<script setup lang="ts">
import type { ManagedRole, PermissionOption, RoleListResponse, RoleResponse } from '../../../shared/types/roles'

definePageMeta({ layout: 'admin', middleware: 'auth', permission: 'roles.read' })

const { public: { appName } } = useRuntimeConfig()
useHead({ title: `Role manager · ${appName}` })

const toast = useToast()

const { data, error, refresh } = await useFetch<RoleListResponse>('/api/v1/admin/roles')

// Permissions grouped by the part of the key before the first dot, e.g. `users.read` → users.
const permissionGroups = computed(() => {
  const groups = new Map<string, PermissionOption[]>()
  for (const permission of data.value?.permissions ?? []) {
    const group = permission.key.split('.')[0] ?? permission.key
    groups.set(group, [...(groups.get(group) ?? []), permission])
  }
  return [...groups].map(([key, permissions]) => ({ key, permissions }))
})

function errorMessage(caught: unknown, fallback: string): string {
  const response = typeof caught === 'object' && caught !== null && 'data' in caught
    ? caught.data as { statusMessage?: string }
    : undefined
  return response?.statusMessage ?? fallback
}

// Create / edit dialog
const dialogOpen = ref(false)
const editing = ref<ManagedRole | null>(null)
const saving = ref(false)
const formError = ref('')
const keyEdited = ref(false)
const form = reactive({
  key: '',
  name: '',
  description: '',
  permissions: [] as string[],
})

function keyFromName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^[^a-z]+|_+$/g, '').slice(0, 80)
}

watch(() => form.name, (name) => {
  if (!editing.value && !keyEdited.value) {
    form.key = keyFromName(name)
  }
})

function openCreate(): void {
  editing.value = null
  keyEdited.value = false
  Object.assign(form, { key: '', name: '', description: '', permissions: [] })
  formError.value = ''
  dialogOpen.value = true
}

function openEdit(role: ManagedRole): void {
  editing.value = role
  Object.assign(form, {
    key: role.key,
    name: role.name,
    description: role.description ?? '',
    permissions: [...role.permissions],
  })
  formError.value = ''
  dialogOpen.value = true
}

function togglePermission(key: string, checked: boolean | 'indeterminate'): void {
  form.permissions = checked === true
    ? [...new Set([...form.permissions, key])]
    : form.permissions.filter(permission => permission !== key)
}

async function save(): Promise<void> {
  formError.value = ''
  saving.value = true

  try {
    const body = {
      name: form.name,
      description: form.description.trim() || null,
      permissions: form.permissions,
    }

    if (editing.value) {
      await $fetch<RoleResponse>(`/api/v1/admin/roles/${editing.value.id}`, { method: 'PATCH', body })
      toast.add({ title: 'Role updated', description: form.name, color: 'success', icon: 'i-lucide-check' })
    }
    else {
      await $fetch<RoleResponse>('/api/v1/admin/roles', { method: 'POST', body: { ...body, key: form.key } })
      toast.add({ title: 'Role created', description: form.name, color: 'success', icon: 'i-lucide-check' })
    }

    dialogOpen.value = false
    await refresh()
  }
  catch (caught: unknown) {
    formError.value = errorMessage(caught, 'Unable to save the role. Please try again.')
  }
  finally {
    saving.value = false
  }
}

// Delete confirmation
const deleting = ref<ManagedRole | null>(null)
const deletePending = ref(false)
const deleteError = ref('')
const deleteOpen = computed({
  get: () => deleting.value !== null,
  set: (open: boolean) => {
    if (!open) deleting.value = null
  },
})

function confirmDelete(role: ManagedRole): void {
  deleteError.value = ''
  deleting.value = role
}

async function remove(): Promise<void> {
  if (!deleting.value) return
  deleteError.value = ''
  deletePending.value = true

  try {
    const name = deleting.value.name
    await $fetch(`/api/v1/admin/roles/${deleting.value.id}`, { method: 'DELETE' })
    deleting.value = null
    toast.add({ title: 'Role deleted', description: name, color: 'success', icon: 'i-lucide-check' })
    await refresh()
  }
  catch (caught: unknown) {
    deleteError.value = errorMessage(caught, 'Unable to delete the role. Please try again.')
  }
  finally {
    deletePending.value = false
  }
}
</script>

<template>
  <div class="dashboard-workspace">
    <section class="dashboard-hero">
      <div>
        <h1>Role manager</h1>
        <p>Group permissions into roles, then assign roles to users.</p>
      </div>
      <UButton
        v-if="data?.canManage"
        class="users-hero-action"
        icon="i-lucide-shield-plus"
        label="New role"
        @click="openCreate"
      />
    </section>

    <section class="dashboard-panel" style="margin-top: .75rem">
      <header class="dashboard-panel__header">
        <h2>Roles</h2>
        <span class="dashboard-panel__meta">
          {{ data?.roles.length ?? 0 }} {{ data?.roles.length === 1 ? 'role' : 'roles' }}
        </span>
      </header>

      <div v-if="error" class="dashboard-empty">
        <span><UIcon name="i-lucide-circle-alert" /></span>
        <strong>Roles could not be loaded</strong>
        <p>{{ errorMessage(error, 'Please try again.') }}</p>
      </div>

      <div v-else-if="data && data.roles.length === 0" class="dashboard-empty">
        <span><UIcon name="i-lucide-shield-check" /></span>
        <strong>No roles yet</strong>
        <p>Create a role to group permissions together.</p>
      </div>

      <div v-else class="dashboard-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Permissions</th>
              <th>Users</th>
              <th><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="role in data?.roles" :key="role.id">
              <td>
                <div class="roles-name">
                  <strong>{{ role.name }}</strong>
                  <UBadge v-if="role.isSystem" label="System" color="neutral" variant="subtle" size="sm" />
                </div>
                <small>{{ role.key }}<template v-if="role.description"> · {{ role.description }}</template></small>
              </td>
              <td>
                <div class="dashboard-role-list roles-permission-list">
                  <span v-for="permission in role.permissions" :key="permission">{{ permission }}</span>
                  <small v-if="role.permissions.length === 0" class="users-no-roles">No permissions</small>
                </div>
              </td>
              <td>{{ role.userCount }}</td>
              <td class="users-actions">
                <div v-if="data?.canManage">
                  <template v-if="!role.lockedReason">
                    <UButton icon="i-lucide-pencil" label="Edit" color="neutral" variant="ghost" size="sm" @click="openEdit(role)" />
                    <UButton icon="i-lucide-trash-2" :aria-label="`Delete ${role.name}`" color="error" variant="ghost" size="sm" @click="confirmDelete(role)" />
                  </template>
                  <UTooltip v-else :text="role.lockedReason">
                    <UIcon name="i-lucide-lock" class="roles-lock" :aria-label="role.lockedReason" />
                  </UTooltip>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <UModal
      v-model:open="dialogOpen"
      :title="editing ? `Edit ${editing.name}` : 'New role'"
      :description="editing ? editing.key : 'Roles group permissions so you can assign them together.'"
    >
      <template #body>
        <form id="role-form" class="users-form" @submit.prevent="save">
          <UAlert v-if="formError" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="formError" />

          <UFormField label="Name" required>
            <UInput v-model="form.name" class="w-full" required minlength="2" maxlength="120" :disabled="saving" />
          </UFormField>

          <UFormField
            v-if="!editing"
            label="Key"
            required
            help="Used in code. Lowercase letters, numbers and underscores. It cannot be changed later."
          >
            <UInput
              v-model="form.key"
              class="w-full"
              required
              pattern="[a-z][a-z0-9_]{1,79}"
              maxlength="80"
              :disabled="saving"
              @input="keyEdited = true"
            />
          </UFormField>

          <UFormField label="Description">
            <UTextarea v-model="form.description" class="w-full" :rows="2" maxlength="500" :disabled="saving" />
          </UFormField>

          <UFormField label="Permissions">
            <div class="roles-permission-groups">
              <fieldset v-for="group in permissionGroups" :key="group.key">
                <legend>{{ group.key }}</legend>
                <UCheckbox
                  v-for="permission in group.permissions"
                  :key="permission.key"
                  :model-value="form.permissions.includes(permission.key)"
                  :label="permission.key"
                  :description="permission.grantable ? (permission.description ?? undefined) : 'You do not hold this permission'"
                  :disabled="saving || !permission.grantable"
                  @update:model-value="togglePermission(permission.key, $event)"
                />
              </fieldset>
              <p v-if="!permissionGroups.length" class="users-no-roles">No permissions exist yet.</p>
            </div>
          </UFormField>

          <p v-if="editing && editing.userCount > 0" class="users-warning">
            <UIcon name="i-lucide-users" /> Changes apply right away to {{ editing.userCount }} {{ editing.userCount === 1 ? 'user' : 'users' }}.
          </p>
        </form>
      </template>

      <template #footer>
        <div class="users-form-footer">
          <UButton label="Cancel" color="neutral" variant="ghost" :disabled="saving" @click="dialogOpen = false" />
          <UButton type="submit" form="role-form" :label="editing ? 'Save changes' : 'Create role'" :loading="saving" />
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="deleteOpen"
      :title="`Delete ${deleting?.name ?? 'role'}?`"
      description="This cannot be undone."
    >
      <template #body>
        <UAlert v-if="deleteError" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="deleteError" />
        <p v-else-if="deleting && deleting.userCount > 0" class="roles-delete-copy">
          {{ deleting.userCount }} {{ deleting.userCount === 1 ? 'user has' : 'users have' }} this role. Remove it from them on the Users page first.
        </p>
        <p v-else class="roles-delete-copy">No users have this role.</p>
      </template>

      <template #footer>
        <div class="users-form-footer">
          <UButton label="Cancel" color="neutral" variant="ghost" :disabled="deletePending" @click="deleting = null" />
          <UButton
            label="Delete role"
            color="error"
            :loading="deletePending"
            :disabled="(deleting?.userCount ?? 0) > 0"
            @click="remove"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
