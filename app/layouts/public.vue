<script setup lang="ts">
import { publicFooterGroups, publicNavigation } from '../utils/navigation'

const { public: { appName } } = useRuntimeConfig()
const route = useRoute()
const menuOpen = ref(false)
const year = new Date().getFullYear()

watch(() => route.fullPath, () => {
  menuOpen.value = false
})

// The header is borderless at the top so the hero can fade into it; it gains a
// border and shadow once the page scrolls.
const scrolled = ref(false)

function updateScrolled(): void {
  scrolled.value = window.scrollY > 8
}

onMounted(() => {
  updateScrolled()
  window.addEventListener('scroll', updateScrolled, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateScrolled)
})
</script>

<template>
  <div class="public-page">
    <header class="public-header" :class="{ 'public-header--scrolled': scrolled || menuOpen }">
      <nav class="public-nav" aria-label="Main">
        <NuxtLink to="/" class="public-nav__brand" :aria-label="`${appName} home`">
          <AppLogo />
        </NuxtLink>

        <ul class="public-nav__links">
          <li v-for="link in publicNavigation" :key="link.to">
            <NuxtLink :to="link.to" :external="link.newTab" :target="link.newTab ? '_blank' : undefined" :rel="link.newTab ? 'noopener' : undefined" :aria-label="link.ariaLabel">{{ link.label }}<UIcon v-if="link.newTab" name="i-lucide-arrow-up-right" class="public-link-external" /></NuxtLink>
          </li>
        </ul>

        <div class="public-nav__actions">
          <NuxtLink to="/#register" class="public-button public-button--primary public-nav__signin">Register</NuxtLink>
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
        <NuxtLink v-for="link in publicNavigation" :key="link.to" :to="link.to" :external="link.newTab" :target="link.newTab ? '_blank' : undefined" :rel="link.newTab ? 'noopener' : undefined" :aria-label="link.ariaLabel" @click="menuOpen = false">
          {{ link.label }}<UIcon v-if="link.newTab" name="i-lucide-arrow-up-right" class="public-link-external" />
        </NuxtLink>
        <NuxtLink to="/#register" class="public-button public-button--primary">Register</NuxtLink>
      </div>
    </header>

    <main class="public-main">
      <slot />
    </main>

    <footer class="public-footer">
      <div class="public-footer__inner">
        <div class="public-footer__brand">
          <AppLogo />
          <p>The Festival of Sacred Sounds, South Asia. 1–6 December 2026, Colombo.</p>
        </div>
        <nav v-for="group in publicFooterGroups" :key="group.label" class="public-footer__group" :aria-label="group.label">
          <h2>{{ group.label }}</h2>
          <ul>
            <li v-for="link in group.links" :key="link.to">
              <NuxtLink :to="link.to" :external="link.newTab" :target="link.newTab ? '_blank' : undefined" :rel="link.newTab ? 'noopener' : undefined" :aria-label="link.ariaLabel">{{ link.label }}<UIcon v-if="link.newTab" name="i-lucide-arrow-up-right" class="public-link-external" /></NuxtLink>
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
