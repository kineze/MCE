<script setup lang="ts">
definePageMeta({ layout: 'public' })

const { public: { appName } } = useRuntimeConfig()
useHead({ title: appName })

const features = [
  { icon: 'i-lucide-lock-keyhole', title: 'Secure sign-in', text: 'Server-side sessions, strong password hashing and rate-limited login attempts.' },
  { icon: 'i-lucide-shield-check', title: 'Roles and permissions', text: 'Group permissions into roles and give each person exactly the access they need.' },
  { icon: 'i-lucide-users', title: 'User management', text: 'Create accounts, assign roles and disable access from one screen.' },
  { icon: 'i-lucide-layout-dashboard', title: 'Admin dashboard', text: 'See users, roles and active sessions at a glance.' },
  { icon: 'i-lucide-moon', title: 'Light and dark', text: 'Comfortable to use day or night, with accent colours and text sizes to suit.' },
  { icon: 'i-lucide-smartphone', title: 'Works everywhere', text: 'A responsive layout that fits phones, tablets and desktops.' },
]

const steps = [
  { title: 'Get an account', text: 'An administrator creates your account and assigns your roles.' },
  { title: 'Sign in', text: 'Use your email and password to open the dashboard.' },
  { title: 'Get to work', text: 'You see the pages and actions your roles allow.' },
]
</script>

<template>
  <div>
    <section class="public-hero">
      <p class="public-eyebrow">Welcome to {{ appName }}</p>
      <h1>Everything your team needs, behind one sign-in.</h1>
      <p class="public-hero__lead">
        {{ appName }} keeps accounts, roles and permissions in one place, so the right people get the right access.
      </p>
      <div class="public-hero__actions">
        <NuxtLink to="/login" class="public-button public-button--primary public-button--large">
          Sign in <UIcon name="i-lucide-arrow-right" />
        </NuxtLink>
        <NuxtLink to="/#features" class="public-button public-button--ghost public-button--large">See features</NuxtLink>
      </div>
    </section>

    <section id="features" class="public-section">
      <header class="public-section__header">
        <p class="public-eyebrow">Features</p>
        <h2>Built on a secure foundation</h2>
      </header>
      <div class="public-feature-grid">
        <article v-for="feature in features" :key="feature.title" class="public-card">
          <span class="public-card__icon"><UIcon :name="feature.icon" /></span>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.text }}</p>
        </article>
      </div>
    </section>

    <section id="how-it-works" class="public-section">
      <header class="public-section__header">
        <p class="public-eyebrow">How it works</p>
        <h2>Up and running in three steps</h2>
      </header>
      <ol class="public-steps">
        <li v-for="(step, index) in steps" :key="step.title">
          <span>{{ index + 1 }}</span>
          <h3>{{ step.title }}</h3>
          <p>{{ step.text }}</p>
        </li>
      </ol>
    </section>

    <section id="get-started" class="public-section">
      <div class="public-cta">
        <h2>Ready to get started?</h2>
        <p>Sign in with the account your administrator gave you.</p>
        <NuxtLink to="/login" class="public-button public-button--primary public-button--large">Sign in</NuxtLink>
      </div>
    </section>
  </div>
</template>
