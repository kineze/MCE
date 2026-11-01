<script setup lang="ts">
import type { PublicProgrammeResponse, PublicSession } from '#shared/types/programme'
import { FESTIVAL_DAYS, SESSION_KIND_LABELS, colomboDateKey, formatColomboTime, formatFestivalDay } from '#shared/utils/festival'

const props = withDefaults(defineProps<{
  /** Colombo date to show; the first day with sessions is used when empty. */
  day?: string
  showVenueFilter?: boolean
}>(), {
  day: '',
  showVenueFilter: true,
})

const emit = defineEmits<{ 'update:day': [day: string] }>()

const { data, error } = await useFetch<PublicProgrammeResponse>('/api/v1/programme', { key: 'public-programme' })

const sessionsByDay = computed(() => {
  const groups = new Map<string, PublicSession[]>(FESTIVAL_DAYS.map(day => [day, []]))
  for (const session of data.value?.sessions ?? []) {
    groups.get(colomboDateKey(session.startsAt))?.push(session)
  }
  return groups
})

const selectedDay = computed(() => {
  if (FESTIVAL_DAYS.some(day => day === props.day)) return props.day
  return FESTIVAL_DAYS.find(day => (sessionsByDay.value.get(day)?.length ?? 0) > 0) ?? FESTIVAL_DAYS[0]
})

const venueFilter = ref<string | null>(null)
const daySessions = computed(() => sessionsByDay.value.get(selectedDay.value) ?? [])
const dayVenues = computed(() => {
  const venues = new Map(daySessions.value.map(session => [session.venue.slug, session.venue.name]))
  return [...venues].map(([slug, name]) => ({ slug, name }))
})
const visibleSessions = computed(() => daySessions.value.filter(session =>
  !venueFilter.value || session.venue.slug === venueFilter.value,
))

watch(selectedDay, () => {
  venueFilter.value = null
})

function selectDay(day: string): void {
  emit('update:day', day)
}
</script>

<template>
  <div class="schedule">
    <nav class="schedule-days" aria-label="Festival days">
      <button
        v-for="day in FESTIVAL_DAYS"
        :key="day"
        type="button"
        class="schedule-day"
        :class="{ 'is-active': day === selectedDay }"
        :aria-pressed="day === selectedDay"
        :aria-label="`${formatFestivalDay(day)}, ${sessionsByDay.get(day)?.length ?? 0} sessions`"
        @click="selectDay(day)"
      >
        <span class="schedule-day__weekday">{{ formatFestivalDay(day, 'short').split(' ')[0] }}</span>
        <strong class="schedule-day__date">{{ day.slice(-2).replace(/^0/, '') }}</strong>
        <span class="schedule-day__month">Dec</span>
        <span class="schedule-day__count">{{ sessionsByDay.get(day)?.length ?? 0 }} sessions</span>
      </button>
    </nav>

    <div v-if="showVenueFilter && dayVenues.length > 1" class="schedule-venues" role="group" aria-label="Filter by venue">
      <button type="button" :class="{ 'is-active': !venueFilter }" @click="venueFilter = null">All venues</button>
      <button
        v-for="venue in dayVenues"
        :key="venue.slug"
        type="button"
        :class="{ 'is-active': venueFilter === venue.slug }"
        @click="venueFilter = venue.slug"
      >
        {{ venue.name }}
      </button>
    </div>

    <h3 class="schedule-title">{{ formatFestivalDay(selectedDay) }}</h3>

    <div v-if="error" class="schedule-empty">
      <UIcon name="i-lucide-circle-alert" />
      <p>The programme could not be loaded. Please try again shortly.</p>
    </div>

    <div v-else-if="visibleSessions.length === 0" class="schedule-empty">
      <UIcon name="i-lucide-calendar-clock" />
      <p>Sessions for this day will be announced soon.</p>
    </div>

    <ol v-else class="schedule-list">
      <li
        v-for="session in visibleSessions"
        :key="session.id"
        class="schedule-item"
        :class="[`kind-${session.kind.toLowerCase()}`, { 'schedule-item--prime': session.highlight }]"
      >
        <time class="schedule-item__time" :datetime="session.startsAt">
          {{ formatColomboTime(session.startsAt) }}
          <small>{{ formatColomboTime(session.endsAt) }}</small>
        </time>
        <span class="schedule-item__rail" aria-hidden="true" />
        <article class="schedule-card">
          <div class="schedule-card__tags">
            <span v-if="session.highlight" class="schedule-card__prime">Prime time</span>
            <span class="schedule-card__kind">{{ SESSION_KIND_LABELS[session.kind] }}</span>
          </div>
          <h4>{{ session.title }}</h4>
          <p v-if="session.people" class="schedule-card__people">{{ session.people }}</p>
          <p v-if="session.moderator" class="schedule-card__moderator">Moderated by {{ session.moderator }}</p>
          <p v-if="session.description" class="schedule-card__description">{{ session.description }}</p>
          <p class="schedule-card__venue"><UIcon name="i-lucide-map-pin" /> {{ session.venue.name }}</p>
        </article>
      </li>
    </ol>
  </div>
</template>
