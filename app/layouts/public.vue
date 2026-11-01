<script setup lang="ts">
import { publicFooterGroups, publicNavigation } from '../utils/navigation'

const { public: { appName } } = useRuntimeConfig()
const colorMode = useColorMode()
const route = useRoute()
const menuOpen = ref(false)
const isDark = computed(() => colorMode.value === 'dark')
const year = new Date().getFullYear()

function toggleColorMode(): void {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

watch(() => route.fullPath, () => {
  menuOpen.value = false
})
</script>

<template>
  <div class="public-page">
    <header class="public-header">
      <nav class="public-nav" aria-label="Main">
        <NuxtLink to="/" class="public-nav__brand" :aria-label="`${appName} home`">
          <AppLogo />
        </NuxtLink>

        <ul class="public-nav__links">
          <li v-for="link in publicNavigation" :key="link.to">
            <NuxtLink :to="link.to">{{ link.label }}</NuxtLink>
          </li>
        </ul>

        <div class="public-nav__actions">
          <ClientOnly>
            <button type="button" class="public-icon-button" :aria-label="isDark ? 'Use light mode' : 'Use dark mode'" @click="toggleColorMode">
              <UIcon :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" />
            </button>
            <template #fallback>
              <button type="button" class="public-icon-button" aria-label="Color mode" disabled>
                <UIcon name="i-lucide-monitor" />
              </button>
            </template>
          </ClientOnly>
          <NuxtLink to="/login" class="public-button public-button--primary public-nav__signin">Sign in</NuxtLink>
          <button
            type="button"
            class="public-icon-button public-nav__toggle"
            :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
            :aria-expanded="menuOpen"
            aria-controls="public-mobile-menu"
            @click="menuOpen = !menuOpen"
          >
            <UIcon :name="menuOpen ? 'i-lucide-x' : 'i-lucide-menu'" />
          </button>
        </div>
      </nav>

      <div v-show="menuOpen" id="public-mobile-menu" class="public-mobile-menu">
        <NuxtLink v-for="link in publicNavigation" :key="link.to" :to="link.to" @click="menuOpen = false">
          {{ link.label }}
        </NuxtLink>
        <NuxtLink to="/login" class="public-button public-button--primary">Sign in</NuxtLink>
      </div>
    </header>

    <main class="public-main">
      <slot />
    </main>

    <footer class="public-footer">
      <div class="public-footer__inner">
        <div class="public-footer__brand">
          <AppLogo />
          <p>Accounts, roles and permissions for your team, in one place.</p>
        </div>
        <nav v-for="group in publicFooterGroups" :key="group.label" class="public-footer__group" :aria-label="group.label">
          <h2>{{ group.label }}</h2>
          <ul>
            <li v-for="link in group.links" :key="link.to">
              <NuxtLink :to="link.to">{{ link.label }}</NuxtLink>
            </li>
          </ul>
        </nav>
      </div>
      <div class="public-footer__bottom">
        <p>© {{ year }} {{ appName }}. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>
