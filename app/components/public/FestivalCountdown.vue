<script setup lang="ts">
import { festivalCountdown, formatFestivalDay } from '#shared/utils/festival'

// The server's clock is shared with the client so the first render matches, then it ticks.
const now = useState('festival-countdown-now', () => Date.now())
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  now.value = Date.now()
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => clearInterval(timer))

const countdown = computed(() => festivalCountdown(now.value))
const units = computed(() => [
  { label: 'Days', value: countdown.value.days },
  { label: 'Hours', value: countdown.value.hours },
  { label: 'Minutes', value: countdown.value.minutes },
  { label: 'Seconds', value: countdown.value.seconds },
])
const summary = computed(() => {
  const { days, hours, minutes } = countdown.value
  return `${days} days, ${hours} hours and ${minutes} minutes until the festival begins`
})

function pad(value: number): string {
  return String(value).padStart(2, '0')
}
</script>

<template>
  <section class="countdown" aria-labelledby="countdown-title">
    <div class="countdown__panel">
      <PublicMandala class="countdown__mandala" />

      <div class="countdown__copy">
        <template v-if="countdown.phase === 'upcoming'">
          <p class="public-eyebrow">The festival begins in</p>
          <h2 id="countdown-title" class="festival-display">{{ formatFestivalDay('2026-12-01') }}</h2>
          <p class="countdown__place"><UIcon name="i-lucide-map-pin" /> Colombo, Sri Lanka · 1–6 December 2026</p>
        </template>
        <template v-else-if="countdown.phase === 'live'">
          <p class="public-eyebrow">Happening now</p>
          <h2 id="countdown-title" class="festival-display">The festival is under way</h2>
          <p class="countdown__place"><UIcon name="i-lucide-map-pin" /> Colombo, Sri Lanka · until Sunday 6 December</p>
        </template>
        <template v-else>
          <p class="public-eyebrow">1–6 December 2026</p>
          <h2 id="countdown-title" class="festival-display">Thank you for joining us</h2>
          <p class="countdown__place">The Festival of Sacred Sounds, South Asia 2026</p>
        </template>

      </div>

      <div v-if="countdown.phase === 'upcoming'" class="countdown__units" role="timer" :aria-label="summary">
        <div v-for="(unit, index) in units" :key="unit.label" class="countdown__unit" :class="{ 'countdown__unit--seconds': index === units.length - 1 }">
          <strong>{{ pad(unit.value) }}</strong>
          <span>{{ unit.label }}</span>
        </div>
      </div>
      <div v-else class="countdown__badge" aria-hidden="true">
        <UIcon :name="countdown.phase === 'live' ? 'i-lucide-music-4' : 'i-lucide-heart-handshake'" />
      </div>

      <div class="countdown__actions">
        <NuxtLink v-if="countdown.phase !== 'ended'" to="/#register" class="public-button public-button--sunset public-button--large">
          Register <UIcon name="i-lucide-arrow-right" />
        </NuxtLink>
        <NuxtLink to="/#programme" class="public-button public-button--outline-light public-button--large">View programme</NuxtLink>
      </div>
    </div>
  </section>
</template>
