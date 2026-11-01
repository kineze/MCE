<script setup lang="ts">
import type { AdminProgrammeResponse, AdminSession, AdminSessionResponse } from '../../../shared/types/programme'
import {
  FESTIVAL_DAYS,
  SESSION_KINDS,
  SESSION_KIND_LABELS,
  colomboDateKey,
  colomboTimeValue,
  formatColomboTime,
  formatFestivalDay,
} from '../../../shared/utils/festival'
import type { SessionKind } from '../../../shared/utils/festival'

definePageMeta({ layout: 'admin', middleware: 'auth', permission: 'programme.read' })

const { public: { appName } } = useRuntimeConfig()
useHead({ title: `Programme · ${appName}` })

const toast = useToast()

const { data, error, refresh } = await useFetch<AdminProgrammeResponse>('/api/v1/admin/programme')

function errorMessage(caught: unknown, fallback: string): string {
  const response = typeof caught === 'object' && caught !== null && 'data' in caught
    ? caught.data as { statusMessage?: string }
    : undefined
  return response?.statusMessage ?? fallback
}

// Filters
const ALL = 'all'
const dayFilter = ref<string>(ALL)
const venueFilter = ref<string>(ALL)
const statusFilter = ref<'all' | 'published' | 'draft'>('all')

const dayOptions = computed(() => [
  { label: 'All days', value: ALL },
  ...FESTIVAL_DAYS.map(day => ({ label: formatFestivalDay(day, 'short'), value: day })),
])
const venueOptions = computed(() => [
  { label: 'All venues', value: ALL },
  ...(data.value?.venues ?? []).map(venue => ({ label: venue.name, value: venue.id })),
])
const statusOptions = [
  { label: 'Published and drafts', value: 'all' },
  { label: 'Published only', value: 'published' },
  { label: 'Drafts only', value: 'draft' },
]

const filtered = computed(() => (data.value?.sessions ?? []).filter(session =>
  (dayFilter.value === ALL || colomboDateKey(session.startsAt) === dayFilter.value)
  && (venueFilter.value === ALL || session.venue.id === venueFilter.value)
  && (statusFilter.value === 'all' || session.published === (statusFilter.value === 'published')),
))

const groupedByDay = computed(() => {
  const groups = new Map<string, AdminSession[]>()
  for (const session of filtered.value) {
    const day = colomboDateKey(session.startsAt)
    groups.set(day, [...(groups.get(day) ?? []), session])
  }
  return [...groups].map(([day, sessions]) => ({
    day,
    sessions,
    published: sessions.filter(session => session.published).length,
  }))
})

const totals = computed(() => {
  const sessions = data.value?.sessions ?? []
  const published = sessions.filter(session => session.published).length
  return { published, drafts: sessions.length - published }
})

// Create / edit dialog
const dialogOpen = ref(false)
const editing = ref<AdminSession | null>(null)
const saving = ref(false)
const formError = ref('')
const form = reactive({
  title: '',
  kind: 'PERFORMANCE' as SessionKind,
  venueId: '',
  date: FESTIVAL_DAYS[0] as string,
  startTime: '10:00',
  endTime: '11:00',
  people: '',
  moderator: '',
  description: '',
  highlight: false,
  published: false,
  notes: '',
})

const kindOptions = SESSION_KINDS.map(kind => ({ label: SESSION_KIND_LABELS[kind], value: kind }))
const formVenueOptions = computed(() => (data.value?.venues ?? []).map(venue => ({ label: venue.name, value: venue.id })))

function openCreate(): void {
  editing.value = null
  Object.assign(form, {
    title: '',
    kind: 'PERFORMANCE',
    venueId: data.value?.venues[0]?.id ?? '',
    date: dayFilter.value === ALL ? FESTIVAL_DAYS[0] : dayFilter.value,
    startTime: '10:00',
    endTime: '11:00',
    people: '',
    moderator: '',
    description: '',
    highlight: false,
    published: false,
    notes: '',
  })
  formError.value = ''
  dialogOpen.value = true
}

function openEdit(session: AdminSession): void {
  editing.value = session
  Object.assign(form, {
    title: session.title,
    kind: session.kind,
    venueId: session.venue.id,
    date: colomboDateKey(session.startsAt),
    startTime: colomboTimeValue(session.startsAt),
    endTime: colomboTimeValue(session.endsAt),
    people: session.people ?? '',
    moderator: session.moderator ?? '',
    description: session.description ?? '',
    highlight: session.highlight,
    published: session.published,
    notes: session.notes ?? '',
  })
  formError.value = ''
  dialogOpen.value = true
}

async function save(): Promise<void> {
  formError.value = ''
  saving.value = true

  try {
    const body = { ...form }
    if (editing.value) {
      await $fetch<AdminSessionResponse>(`/api/v1/admin/programme/${editing.value.id}`, { method: 'PATCH', body })
      toast.add({ title: 'Session updated', description: form.title, color: 'success', icon: 'i-lucide-check' })
    }
    else {
      await $fetch<AdminSessionResponse>('/api/v1/admin/programme', { method: 'POST', body })
      toast.add({ title: 'Session added', description: form.title, color: 'success', icon: 'i-lucide-check' })
    }

    dialogOpen.value = false
    await refresh()
  }
  catch (caught: unknown) {
    formError.value = errorMessage(caught, 'Unable to save the session. Please try again.')
  }
  finally {
    saving.value = false
  }
}

// Publish toggle
const togglingId = ref<string | null>(null)

async function togglePublished(session: AdminSession): Promise<void> {
  togglingId.value = session.id
  try {
    await $fetch<AdminSessionResponse>(`/api/v1/admin/programme/${session.id}`, {
      method: 'PATCH',
      body: { published: !session.published },
    })
    toast.add({
      title: session.published ? 'Moved to drafts' : 'Published',
      description: session.title,
      color: 'success',
      icon: 'i-lucide-check',
    })
    await refresh()
  }
  catch (caught: unknown) {
    toast.add({ title: 'Could not update the session', description: errorMessage(caught, 'Please try again.'), color: 'error' })
  }
  finally {
    togglingId.value = null
  }
}

// Delete confirmation
const deleting = ref<AdminSession | null>(null)
const deletePending = ref(false)
const deleteError = ref('')
const deleteOpen = computed({
  get: () => deleting.value !== null,
  set: (open: boolean) => {
    if (!open) deleting.value = null
  },
})

function confirmDelete(session: AdminSession): void {
  deleteError.value = ''
  deleting.value = session
}

async function remove(): Promise<void> {
  if (!deleting.value) return
  deleteError.value = ''
  deletePending.value = true

  try {
    const title = deleting.value.title
    await $fetch(`/api/v1/admin/programme/${deleting.value.id}`, { method: 'DELETE' })
    deleting.value = null
    toast.add({ title: 'Session deleted', description: title, color: 'success', icon: 'i-lucide-check' })
    await refresh()
  }
  catch (caught: unknown) {
    deleteError.value = errorMessage(caught, 'Unable to delete the session. Please try again.')
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
        <h1>Programme</h1>
        <p>Only published sessions appear on the public programme. Drafts and internal notes stay here.</p>
      </div>
      <UButton
        v-if="data?.canManage"
        class="users-hero-action"
        icon="i-lucide-calendar-plus"
        label="New session"
        @click="openCreate"
      />
    </section>

    <section class="dashboard-panel" style="margin-top: .75rem">
      <header class="dashboard-panel__header programme-toolbar">
        <div class="programme-filters">
          <USelect v-model="dayFilter" :items="dayOptions" size="sm" aria-label="Filter by day" class="programme-filter" />
          <USelect v-model="venueFilter" :items="venueOptions" size="sm" aria-label="Filter by venue" class="programme-filter" />
          <USelect v-model="statusFilter" :items="statusOptions" size="sm" aria-label="Filter by status" class="programme-filter" />
        </div>
        <span class="dashboard-panel__meta">{{ totals.published }} published · {{ totals.drafts }} drafts</span>
      </header>

      <div v-if="error" class="dashboard-empty">
        <span><UIcon name="i-lucide-circle-alert" /></span>
        <strong>The programme could not be loaded</strong>
        <p>{{ errorMessage(error, 'Please try again.') }}</p>
      </div>

      <div v-else-if="groupedByDay.length === 0" class="dashboard-empty">
        <span><UIcon name="i-lucide-calendar-days" /></span>
        <strong>{{ data?.sessions.length ? 'No sessions match these filters' : 'No sessions yet' }}</strong>
        <p>{{ data?.sessions.length ? 'Try a different day, venue or status.' : 'Add the first session to start the programme.' }}</p>
      </div>

      <template v-else>
        <div v-for="group in groupedByDay" :key="group.day" class="programme-day">
          <div class="programme-day__header">
            <h2>{{ formatFestivalDay(group.day) }}</h2>
            <span>{{ group.published }} of {{ group.sessions.length }} published</span>
          </div>
          <div class="dashboard-table-wrap">
            <table class="programme-table">
              <colgroup>
                <col class="programme-table__time">
                <col>
                <col class="programme-table__venue">
                <col class="programme-table__status">
                <col class="programme-table__actions">
              </colgroup>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Session</th>
                  <th>Venue</th>
                  <th>Status</th>
                  <th><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="session in group.sessions" :key="session.id">
                  <td class="programme-time">
                    {{ formatColomboTime(session.startsAt) }}<small>{{ formatColomboTime(session.endsAt) }}</small>
                  </td>
                  <td>
                    <strong>{{ session.title }}</strong>
                    <small>
                      {{ SESSION_KIND_LABELS[session.kind] }}<template v-if="session.people"> · {{ session.people }}</template><template v-if="session.moderator"> · Moderator: {{ session.moderator }}</template>
                    </small>
                    <small v-if="session.notes" class="programme-note"><UIcon name="i-lucide-sticky-note" /> {{ session.notes }}</small>
                  </td>
                  <td>{{ session.venue.name }}</td>
                  <td>
                    <div class="dashboard-role-list">
                      <span class="dashboard-status" :class="session.published ? 'dashboard-status--active' : 'programme-status--draft'">
                        {{ session.published ? 'published' : 'draft' }}
                      </span>
                      <span v-if="session.highlight">Prime time</span>
                    </div>
                  </td>
                  <td class="users-actions">
                    <div v-if="data?.canManage">
                      <UButton
                        :icon="session.published ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                        :label="session.published ? 'Unpublish' : 'Publish'"
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        :loading="togglingId === session.id"
                        @click="togglePublished(session)"
                      />
                      <UButton icon="i-lucide-pencil" :aria-label="`Edit ${session.title}`" color="neutral" variant="ghost" size="sm" @click="openEdit(session)" />
                      <UButton icon="i-lucide-trash-2" :aria-label="`Delete ${session.title}`" color="error" variant="ghost" size="sm" @click="confirmDelete(session)" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </section>

    <UModal
      v-model:open="dialogOpen"
      :title="editing ? 'Edit session' : 'New session'"
      :description="editing ? editing.title : 'Times are Colombo local time.'"
      :ui="{ content: 'sm:max-w-2xl' }"
    >
      <template #body>
        <form id="session-form" class="users-form" @submit.prevent="save">
          <UAlert v-if="formError" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="formError" />

          <UFormField label="Title" required>
            <UInput v-model="form.title" class="w-full" required minlength="2" maxlength="200" :disabled="saving" />
          </UFormField>

          <div class="programme-form-row">
            <UFormField label="Type" required>
              <USelect v-model="form.kind" :items="kindOptions" class="w-full" :disabled="saving" />
            </UFormField>
            <UFormField label="Venue" required>
              <USelect v-model="form.venueId" :items="formVenueOptions" class="w-full" :disabled="saving" />
            </UFormField>
          </div>

          <div class="programme-form-row programme-form-row--three">
            <UFormField label="Date" required>
              <UInput v-model="form.date" type="date" class="w-full" required :disabled="saving" />
            </UFormField>
            <UFormField label="Starts" required>
              <UInput v-model="form.startTime" type="time" class="w-full" required :disabled="saving" />
            </UFormField>
            <UFormField label="Ends" required>
              <UInput v-model="form.endTime" type="time" class="w-full" required :disabled="saving" />
            </UFormField>
          </div>

          <div class="programme-form-row">
            <UFormField label="Performers or speakers">
              <UInput v-model="form.people" class="w-full" maxlength="500" :disabled="saving" />
            </UFormField>
            <UFormField label="Moderator">
              <UInput v-model="form.moderator" class="w-full" maxlength="160" :disabled="saving" />
            </UFormField>
          </div>

          <UFormField label="Public description">
            <UTextarea v-model="form.description" class="w-full" :rows="3" maxlength="2000" :disabled="saving" />
          </UFormField>

          <div class="programme-form-row">
            <USwitch v-model="form.highlight" label="Prime time" description="Featured on the public programme." :disabled="saving" />
            <USwitch v-model="form.published" label="Published" description="Visible on the public site." :disabled="saving" />
          </div>

          <UFormField label="Internal notes" help="Never shown on the public site.">
            <UTextarea v-model="form.notes" class="w-full" :rows="2" maxlength="2000" :disabled="saving" />
          </UFormField>
        </form>
      </template>

      <template #footer>
        <div class="users-form-footer">
          <UButton label="Cancel" color="neutral" variant="ghost" :disabled="saving" @click="dialogOpen = false" />
          <UButton type="submit" form="session-form" :label="editing ? 'Save changes' : 'Add session'" :loading="saving" />
        </div>
      </template>
    </UModal>

    <UModal v-model:open="deleteOpen" :title="`Delete ${deleting?.title ?? 'session'}?`" description="This cannot be undone.">
      <template #body>
        <UAlert v-if="deleteError" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="deleteError" />
        <p v-else class="roles-delete-copy">
          {{ deleting?.published ? 'This session is published and will disappear from the public programme.' : 'This draft will be removed.' }}
        </p>
      </template>

      <template #footer>
        <div class="users-form-footer">
          <UButton label="Cancel" color="neutral" variant="ghost" :disabled="deletePending" @click="deleting = null" />
          <UButton label="Delete session" color="error" :loading="deletePending" @click="remove" />
        </div>
      </template>
    </UModal>
  </div>
</template>
