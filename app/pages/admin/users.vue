<script setup lang="ts">
import type { AuthenticatedUser } from '#shared/types/auth'
import type { ManagedUser, UserListResponse, UserResponse, UserStatus } from '#shared/types/users'

definePageMeta({ layout: 'admin', middleware: 'auth', permission: 'users.read' })

const { public: { appName } } = useRuntimeConfig()
useHead({ title: `Users · ${appName}` })

const toast = useToast()
const currentUser = useState<AuthenticatedUser | null>('current-user', () => null)

const search = ref('')
const query = ref('')
const page = ref(1)
let searchTimer: ReturnType<typeof setTimeout> | undefined

watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    query.value = value.trim()
    page.value = 1
  }, 250)
})

const { data, status, error, refresh } = await useFetch<UserListResponse>('/api/v1/admin/users', {
  query: { q: query, page },
})

const roleNames = computed(() => new Map(data.value?.roles.map(role => [role.key, role.name]) ?? []))

function roleLabel(key: string): string {
  return roleNames.value.get(key) ?? key.replaceAll('_', ' ')
}

// Create / edit dialog
const dialogOpen = ref(false)
const editing = ref<ManagedUser | null>(null)
const saving = ref(false)
const formError = ref('')
const form = reactive({
  email: '',
  displayName: '',
  password: '',
  roles: [] as string[],
  active: true,
})

function openCreate(): void {
  editing.value = null
  Object.assign(form, { email: '', displayName: '', password: '', roles: [], active: true })
  formError.value = ''
  dialogOpen.value = true
}

function openEdit(user: ManagedUser): void {
  editing.value = user
  Object.assign(form, {
    email: user.email,
    displayName: user.displayName,
    password: '',
    roles: [...user.roles],
    active: user.status === 'ACTIVE',
  })
  formError.value = ''
  dialogOpen.value = true
}

function toggleRole(key: string, checked: boolean | 'indeterminate'): void {
  form.roles = checked === true
    ? [...new Set([...form.roles, key])]
    : form.roles.filter(role => role !== key)
}

function errorMessage(caught: unknown, fallback: string): string {
  const response = typeof caught === 'object' && caught !== null && 'data' in caught
    ? caught.data as { statusMessage?: string }
    : undefined
  return response?.statusMessage ?? fallback
}

async function save(): Promise<void> {
  formError.value = ''
  saving.value = true

  try {
    if (editing.value) {
      const status: UserStatus = form.active ? 'ACTIVE' : 'DISABLED'
      await $fetch<UserResponse>(`/api/v1/admin/users/${editing.value.id}`, {
        method: 'PATCH',
        body: {
          displayName: form.displayName,
          status,
          roles: form.roles,
          ...(form.password ? { password: form.password } : {}),
        },
      })
      toast.add({ title: 'User updated', description: form.email, color: 'success', icon: 'i-lucide-check' })
    }
    else {
      await $fetch<UserResponse>('/api/v1/admin/users', {
        method: 'POST',
        body: {
          email: form.email,
          displayName: form.displayName,
          password: form.password,
          roles: form.roles,
        },
      })
      toast.add({ title: 'User created', description: form.email, color: 'success', icon: 'i-lucide-check' })
    }

    dialogOpen.value = false
    await refresh()
  }
  catch (caught: unknown) {
    formError.value = errorMessage(caught, 'Unable to save the user. Please try again.')
  }
  finally {
    saving.value = false
  }
}

const willSignOut = computed(() => (
  editing.value !== null
  && ((editing.value.status === 'ACTIVE' && !form.active) || form.password !== '')
))
</script>

<template>
  <div class="dashboard-workspace">
    <section class="dashboard-hero">
      <div>
        <h1>Users</h1>
        <p>Create accounts, assign roles and disable access.</p>
      </div>
      <UButton
        v-if="data?.canManage"
        class="users-hero-action"
        icon="i-lucide-user-plus"
        label="New user"
        @click="openCreate"
      />
    </section>

    <section class="dashboard-panel" style="margin-top: .75rem">
      <header class="dashboard-panel__header">
        <UInput
          v-model="search"
          class="users-search"
          icon="i-lucide-search"
          placeholder="Search by name or email"
          aria-label="Search users"
          size="sm"
        />
        <span class="dashboard-panel__meta">
          {{ data?.total ?? 0 }} {{ data?.total === 1 ? 'user' : 'users' }}
        </span>
      </header>

      <div v-if="error" class="dashboard-empty">
        <span><UIcon name="i-lucide-circle-alert" /></span>
        <strong>Users could not be loaded</strong>
        <p>{{ errorMessage(error, 'Please try again.') }}</p>
      </div>

      <div v-else-if="data && data.users.length === 0" class="dashboard-empty">
        <span><UIcon name="i-lucide-users" /></span>
        <strong>{{ query ? 'No matching users' : 'No users yet' }}</strong>
        <p>{{ query ? 'Try a different name or email.' : 'Create the first account to get started.' }}</p>
      </div>

      <div v-else class="dashboard-table-wrap" :aria-busy="status === 'pending'">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Created</th>
              <th><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in data?.users" :key="user.id">
              <td><strong>{{ user.displayName }}</strong><small>{{ user.email }}</small></td>
              <td>
                <div class="dashboard-role-list">
                  <span v-for="role in user.roles" :key="role">{{ roleLabel(role) }}</span>
                  <small v-if="user.roles.length === 0" class="users-no-roles">No roles</small>
                </div>
              </td>
              <td>
                <span class="dashboard-status" :class="user.status === 'ACTIVE' ? 'dashboard-status--active' : 'dashboard-status--disabled'">
                  {{ user.status.toLowerCase() }}
                </span>
              </td>
              <td>{{ new Date(user.createdAt).toLocaleDateString() }}</td>
              <td class="users-actions">
                <div>
                  <UBadge v-if="user.id === currentUser?.id" label="You" color="neutral" variant="subtle" size="sm" />
                  <UButton
                    v-else-if="data?.canManage && user.manageable"
                    icon="i-lucide-pencil"
                    label="Edit"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    @click="openEdit(user)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer v-if="data && data.total > data.pageSize" class="users-pagination">
        <UPagination v-model:page="page" :total="data.total" :items-per-page="data.pageSize" size="sm" />
      </footer>
    </section>

    <UModal
      v-model:open="dialogOpen"
      :title="editing ? `Edit ${editing.displayName}` : 'New user'"
      :description="editing ? editing.email : 'The user signs in with this email and password.'"
    >
      <template #body>
        <form id="user-form" class="users-form" @submit.prevent="save">
          <UAlert v-if="formError" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="formError" />

          <UFormField v-if="!editing" label="Email" required>
            <UInput v-model="form.email" type="email" autocomplete="off" class="w-full" required :disabled="saving" />
          </UFormField>

          <UFormField label="Name" required>
            <UInput v-model="form.displayName" class="w-full" required minlength="2" maxlength="160" :disabled="saving" />
          </UFormField>

          <UFormField
            :label="editing ? 'New password' : 'Password'"
            :required="!editing"
            :help="editing ? 'Leave blank to keep the current password. At least 12 characters.' : 'At least 12 characters.'"
          >
            <UInput
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              class="w-full"
              minlength="12"
              maxlength="128"
              :required="!editing"
              :disabled="saving"
            />
          </UFormField>

          <UFormField label="Roles">
            <div class="users-role-options">
              <UCheckbox
                v-for="role in data?.roles"
                :key="role.key"
                :model-value="form.roles.includes(role.key)"
                :label="role.name"
                :description="role.assignable ? (role.description ?? undefined) : 'Grants permissions you do not hold'"
                :disabled="saving || !role.assignable"
                @update:model-value="toggleRole(role.key, $event)"
              />
              <p v-if="!data?.roles.length" class="users-no-roles">No roles exist yet.</p>
            </div>
          </UFormField>

          <USwitch
            v-if="editing"
            v-model="form.active"
            label="Active"
            description="Disabled users cannot sign in."
            :disabled="saving"
          />

          <p v-if="willSignOut" class="users-warning">
            <UIcon name="i-lucide-log-out" /> Saving signs this user out of every device.
          </p>
        </form>
      </template>

      <template #footer>
        <div class="users-form-footer">
          <UButton label="Cancel" color="neutral" variant="ghost" :disabled="saving" @click="dialogOpen = false" />
          <UButton type="submit" form="user-form" :label="editing ? 'Save changes' : 'Create user'" :loading="saving" />
        </div>
      </template>
    </UModal>
  </div>
</template>
