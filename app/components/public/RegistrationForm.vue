<script setup lang="ts">
// The festival registration form, used on the home page and at /register.
import {
  FESTIVAL_DAYS,
  REGISTRATION_INTERESTS,
  REGISTRATION_INTEREST_LABELS,
  formatFestivalDay,
} from '#shared/utils/festival'

const root = ref<HTMLElement | null>(null)

const form = reactive({
  fullName: '',
  email: '',
  phone: '',
  country: '',
  organisation: '',
  days: [] as string[],
  interests: [] as string[],
  wantsUpdates: false,
  consent: false,
  website: '',
})
const pending = ref(false)
const errorMessage = ref('')
const registered = ref(false)
const registeredDays = ref<string[]>([])

function toggle(list: string[], value: string, checked: boolean): string[] {
  return checked ? [...new Set([...list, value])] : list.filter(item => item !== value)
}

async function submit(): Promise<void> {
  errorMessage.value = ''
  if (form.days.length === 0) {
    errorMessage.value = 'Choose at least one day you plan to attend'
    return
  }
  if (!form.consent) {
    errorMessage.value = 'Please agree to us storing your details so we can manage your registration'
    return
  }

  pending.value = true
  try {
    await $fetch('/api/v1/registrations', { method: 'POST', body: { ...form } })
    registeredDays.value = FESTIVAL_DAYS.filter(day => form.days.includes(day))
    registered.value = true
    await nextTick()
    root.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  catch (caught: unknown) {
    const response = typeof caught === 'object' && caught !== null && 'data' in caught
      ? caught.data as { statusMessage?: string }
      : undefined
    errorMessage.value = response?.statusMessage ?? 'We could not complete your registration. Please try again.'
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div ref="root" class="register-form-wrap">
    <div v-if="registered" class="register-success" role="status">
      <span class="register-success__icon"><UIcon name="i-lucide-check" /></span>
      <h3>Thank you, {{ form.fullName.split(' ')[0] }}</h3>
      <p>Your registration for the Festival of Sacred Sounds is confirmed. We look forward to seeing you on:</p>
      <ul>
        <li v-for="day in registeredDays" :key="day">{{ formatFestivalDay(day) }}</li>
      </ul>
      <NuxtLink to="/programme" class="public-button public-button--primary public-button--large">
        View programme <UIcon name="i-lucide-arrow-right" />
      </NuxtLink>
    </div>

    <form v-else class="register-form" novalidate @submit.prevent="submit">
      <UAlert v-if="errorMessage" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorMessage" />

      <fieldset class="register-fieldset">
        <legend>Your details</legend>
        <UFormField label="Full name" required>
          <UInput v-model="form.fullName" class="w-full" size="lg" autocomplete="name" required maxlength="160" :disabled="pending" />
        </UFormField>
        <UFormField label="Email" required>
          <UInput v-model="form.email" class="w-full" size="lg" type="email" autocomplete="email" inputmode="email" required maxlength="320" :disabled="pending" />
        </UFormField>
        <div class="register-row">
          <UFormField label="Phone" hint="Optional">
            <UInput v-model="form.phone" class="w-full" size="lg" type="tel" autocomplete="tel" maxlength="40" :disabled="pending" />
          </UFormField>
          <UFormField label="Country" hint="Optional">
            <UInput v-model="form.country" class="w-full" size="lg" autocomplete="country-name" maxlength="80" :disabled="pending" />
          </UFormField>
        </div>
        <UFormField label="Organisation" hint="Optional">
          <UInput v-model="form.organisation" class="w-full" size="lg" autocomplete="organization" maxlength="160" :disabled="pending" />
        </UFormField>
      </fieldset>

      <fieldset class="register-fieldset">
        <legend>Which days will you attend? <span class="register-required">*</span></legend>
        <div class="register-days">
          <label v-for="day in FESTIVAL_DAYS" :key="day" class="register-day" :class="{ 'is-checked': form.days.includes(day) }">
            <input
              type="checkbox"
              :value="day"
              :aria-label="formatFestivalDay(day)"
              :checked="form.days.includes(day)"
              :disabled="pending"
              @change="form.days = toggle(form.days, day, ($event.target as HTMLInputElement).checked)"
            >
            <span>{{ formatFestivalDay(day, 'short').split(' ')[0] }}</span>
            <strong>{{ day.slice(-2).replace(/^0/, '') }} Dec</strong>
          </label>
        </div>
      </fieldset>

      <fieldset class="register-fieldset">
        <legend>What are you interested in? <span class="register-optional">Optional</span></legend>
        <div class="register-interests">
          <UCheckbox
            v-for="interest in REGISTRATION_INTERESTS"
            :key="interest"
            :model-value="form.interests.includes(interest)"
            :label="REGISTRATION_INTEREST_LABELS[interest]"
            :disabled="pending"
            @update:model-value="form.interests = toggle(form.interests, interest, $event === true)"
          />
        </div>
      </fieldset>

      <div class="register-consent">
        <UCheckbox v-model="form.wantsUpdates" label="Send me festival news and programme updates by email" :disabled="pending" />
        <UCheckbox
          v-model="form.consent"
          required
          label="I agree to the festival storing these details to manage my registration"
          description="We only use your details for the festival and never share them."
          :disabled="pending"
        />
      </div>

      <!-- Hidden from people; bots that fill it are ignored. -->
      <div class="register-hp" aria-hidden="true">
        <label>Website <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off"></label>
      </div>

      <button type="submit" class="public-button public-button--primary public-button--large register-submit" :disabled="pending">
        <UIcon v-if="pending" name="i-lucide-loader-circle" class="animate-spin" />
        {{ pending ? 'Registering…' : 'Complete registration' }}
      </button>
    </form>
  </div>
</template>
