<script setup lang="ts">
import type { RegistrationListResponse, RegistrationRecord } from '../../../shared/types/registrations'
import { FESTIVAL_DAYS, REGISTRATION_INTEREST_LABELS, formatFestivalDay } from '../../../shared/utils/festival'
import type { RegistrationInterest } from '../../../shared/utils/festival'

definePageMeta({ layout: 'admin', middleware: 'auth', permission: 'registrations.read' })

const { public: { appName } } = useRuntimeConfig()
useHead({ title: `Registrations · ${appName}` })

const toast = useToast()

const ALL = 'all'
const search = ref('')
const query = ref('')
const day = ref<string>(ALL)
const page = ref(1)
let searchTimer: ReturnType<typeof setTimeout> | undefined

watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    query.value = value.trim()
    page.value = 1
  }, 250)
})

watch(day, () => {
  page.value = 1
})

const { data, status, error, refresh } = await useFetch<RegistrationListResponse>('/api/v1/admin/registrations', {
  query: computed(() => ({ q: query.value || undefined, day: day.value === ALL ? undefined : day.value, page: page.value })),
})

const dayOptions = [
  { label: 'All days', value: ALL },
  ...FESTIVAL_DAYS.map(festivalDay => ({ label: formatFestivalDay(festivalDay, 'short'), value: festivalDay })),
]

function interestLabel(interest: string): string {
  return REGISTRATION_INTEREST_LABELS[interest as RegistrationInterest] ?? interest
}

function errorMessage(caught: unknown, fallback: string): string {
  const response = typeof caught === 'object' && caught !== null && 'data' in caught
    ? caught.data as { statusMessage?: string }
    : undefined
  return response?.statusMessage ?? fallback
}

// Thank-you email
const sendingId = ref<string | null>(null)

async function sendConfirmation(registration: RegistrationRecord): Promise<void> {
  sendingId.value = registration.id
  try {
    await $fetch(`/api/v1/admin/registrations/${registration.id}/resend`, { method: 'POST' })
    toast.add({ title: 'Thank-you email sent', description: registration.email, color: 'success', icon: 'i-lucide-mail-check' })
  }
  catch (caught: unknown) {
    toast.add({ title: 'Email not sent', description: errorMessage(caught, 'Please try again.'), color: 'error', icon: 'i-lucide-mail-x' })
  }
  finally {
    sendingId.value = null
    await refresh()
  }
}

// Delete confirmation
const deleting = ref<RegistrationRecord | null>(null)
const deletePending = ref(false)
const deleteError = ref('')
const deleteOpen = computed({
  get: () => deleting.value !== null,
  set: (open: boolean) => {
    if (!open) deleting.value = null
  },
})

function confirmDelete(registration: RegistrationRecord): void {
  deleteError.value = ''
  deleting.value = registration
}

async function remove(): Promise<void> {
  if (!deleting.value) return
  deleteError.value = ''
  deletePending.value = true

  try {
    const name = deleting.value.fullName
    await $fetch(`/api/v1/admin/registrations/${deleting.value.id}`, { method: 'DELETE' })
    deleting.value = null
    toast.add({ title: 'Registration deleted', description: name, color: 'success', icon: 'i-lucide-check' })
    await refresh()
  }
  catch (caught: unknown) {
    deleteError.value = errorMessage(caught, 'Unable to delete the registration. Please try again.')
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
        <h1>Registrations</h1>
        <p>People who registered on the public site. Each new registration is sent a thank-you email through Brevo.</p>
      </div>
      <UButton
        class="users-hero-action"
        icon="i-lucide-download"
        label="Export CSV"
        color="neutral"
        variant="outline"
        to="/api/v1/admin/registrations/export"
        external
        download
      />
    </section>

    <section v-if="data" class="dashboard-kpis registrations-kpis">
      <article class="dashboard-kpi">
        <div>
          <p>Registered</p>
          <strong>{{ data.totals.all }}</strong>
          <small>{{ data.totals.wantsUpdates }} want email updates</small>
        </div>
        <span><UIcon name="i-lucide-clipboard-list" /></span>
      </article>
      <div class="registrations-days">
        <button
          v-for="festivalDay in FESTIVAL_DAYS"
          :key="festivalDay"
          type="button"
          class="registrations-day"
          :class="{ 'is-active': day === festivalDay }"
          :aria-pressed="day === festivalDay"
          @click="day = day === festivalDay ? ALL : festivalDay"
        >
          <span>{{ formatFestivalDay(festivalDay, 'short') }}</span>
          <strong>{{ data.totals.byDay[festivalDay] ?? 0 }}</strong>
        </button>
      </div>
    </section>

    <section class="dashboard-panel" style="margin-top: .75rem">
      <header class="dashboard-panel__header programme-toolbar">
        <div class="programme-filters">
          <UInput v-model="search" icon="i-lucide-search" placeholder="Search name, email, organisation" aria-label="Search registrations" size="sm" class="users-search" />
          <USelect v-model="day" :items="dayOptions" size="sm" aria-label="Filter by day" class="programme-filter" />
        </div>
        <span class="dashboard-panel__meta">{{ data?.total ?? 0 }} shown</span>
      </header>

      <div v-if="error" class="dashboard-empty">
        <span><UIcon name="i-lucide-circle-alert" /></span>
        <strong>Registrations could not be loaded</strong>
        <p>{{ errorMessage(error, 'Please try again.') }}</p>
      </div>

      <div v-else-if="data && data.registrations.length === 0" class="dashboard-empty">
        <span><UIcon name="i-lucide-clipboard-list" /></span>
        <strong>{{ query || day !== ALL ? 'No matching registrations' : 'No registrations yet' }}</strong>
        <p>{{ query || day !== ALL ? 'Try a different search or day.' : 'Registrations from the public site will appear here.' }}</p>
      </div>

      <div v-else class="dashboard-table-wrap" :aria-busy="status === 'pending'">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Days</th>
              <th>Interests</th>
              <th>Registered</th>
              <th>Thank-you email</th>
              <th><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="registration in data?.registrations" :key="registration.id">
              <td>
                <strong>{{ registration.fullName }}</strong>
                <small>{{ [registration.organisation, registration.country].filter(Boolean).join(' · ') || '—' }}</small>
              </td>
              <td>
                <span class="registrations-email">{{ registration.email }}</span>
                <small>{{ registration.phone ?? 'No phone' }}<template v-if="registration.wantsUpdates"> · wants updates</template></small>
              </td>
              <td>
                <div class="dashboard-role-list registrations-chips">
                  <span v-for="registrationDay in registration.days" :key="registrationDay">{{ formatFestivalDay(registrationDay, 'short') }}</span>
                </div>
              </td>
              <td>
                <small class="registrations-interests">{{ registration.interests.map(interestLabel).join(', ') || '—' }}</small>
              </td>
              <td>{{ new Date(registration.createdAt).toLocaleDateString() }}</td>
              <td>
                <span v-if="registration.confirmationSentAt" class="dashboard-status dashboard-status--active">sent</span>
                <span v-else-if="registration.confirmationError" class="dashboard-status dashboard-status--disabled" :title="registration.confirmationError">failed</span>
                <span v-else class="dashboard-status programme-status--draft">not sent</span>
                <small v-if="registration.confirmationError && !registration.confirmationSentAt" class="registrations-email-error">{{ registration.confirmationError }}</small>
              </td>
              <td class="users-actions">
                <div v-if="data?.canManage">
                  <UButton
                    v-if="!registration.confirmationSentAt"
                    icon="i-lucide-send"
                    :label="registration.confirmationError ? 'Retry email' : 'Send email'"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    :loading="sendingId === registration.id"
                    @click="sendConfirmation(registration)"
                  />
                  <UButton icon="i-lucide-trash-2" :aria-label="`Delete registration for ${registration.fullName}`" color="error" variant="ghost" size="sm" @click="confirmDelete(registration)" />
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

    <UModal v-model:open="deleteOpen" :title="`Delete ${deleting?.fullName ?? 'registration'}?`" description="This cannot be undone.">
      <template #body>
        <UAlert v-if="deleteError" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="deleteError" />
        <p v-else class="roles-delete-copy">Their details are removed permanently. Use this when someone asks to be removed.</p>
      </template>

      <template #footer>
        <div class="users-form-footer">
          <UButton label="Cancel" color="neutral" variant="ghost" :disabled="deletePending" @click="deleting = null" />
          <UButton label="Delete registration" color="error" :loading="deletePending" @click="remove" />
        </div>
      </template>
    </UModal>
  </div>
</template>
