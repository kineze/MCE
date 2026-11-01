<script setup lang="ts">
import type { AuthResponse, AuthenticatedUser } from '../../shared/types/auth'

definePageMeta({ middleware: [] })

const { public: { appName } } = useRuntimeConfig()
useHead({ title: `Sign in · ${appName}` })

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const pending = ref(false)
const currentUser = useState<AuthenticatedUser | null>('current-user', () => null)

async function login(): Promise<void> {
  errorMessage.value = ''
  pending.value = true

  try {
    const response = await $fetch<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    currentUser.value = response.user
    await navigateTo('/admin')
  }
  catch (error: unknown) {
    const response = typeof error === 'object' && error !== null && 'data' in error
      ? error.data as { statusMessage?: string }
      : undefined
    errorMessage.value = response?.statusMessage ?? 'Unable to sign in. Please try again.'
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <header class="auth-header">
      <NuxtLink to="/" aria-label="Home"><AppLogo /></NuxtLink>
    </header>

    <main class="auth-main">
      <div class="auth-card">
        <h1>Sign in</h1>
        <p class="auth-card__muted">Welcome back to {{ appName }}.</p>

        <div v-if="errorMessage" class="auth-alert" role="alert">
          <UIcon name="i-lucide-circle-alert" />
          <span>{{ errorMessage }}</span>
        </div>

        <form class="auth-form" @submit.prevent="login">
          <label>
            <span class="auth-label">Email</span>
            <span class="auth-field">
              <input v-model="email" type="email" autocomplete="username" inputmode="email" placeholder="name@example.com" required autofocus :disabled="pending">
            </span>
          </label>
          <label>
            <span class="auth-label">Password</span>
            <span class="auth-field auth-field--password">
              <input v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" required :disabled="pending">
              <button type="button" class="auth-password-toggle" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword">
                <UIcon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" />
              </button>
            </span>
          </label>
          <button type="submit" class="auth-submit" :disabled="pending">
            <UIcon v-if="pending" name="i-lucide-loader-circle" class="animate-spin" />
            {{ pending ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <p class="auth-footnote">Accounts are created by an administrator.</p>
      </div>
    </main>
  </div>
</template>
