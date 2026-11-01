<script setup lang="ts">
import type { AuthenticatedUser } from '../../shared/types/auth'
import type { DashboardAccent, DashboardTextSize, DashboardZoom } from '../composables/useDashboardPreferences'

const currentUser = useState<AuthenticatedUser | null>('current-user', () => null)
const adminSummary = useState('admin-summary', () => null)
const logoutPending = ref(false)
const viewportWidth = ref(0)
const {
  accent,
  dashboardAccents,
  dashboardTextSize,
  dashboardZoom,
  isDark,
  mobileSidebarOpen,
  sidebarMini,
  toggleColorMode,
} = useDashboardPreferences()

const dashboardDesktop = computed(() => (
  viewportWidth.value > 0
  && viewportWidth.value * (100 / dashboardZoom.value) >= 1024
))

function syncViewportWidth(): void {
  viewportWidth.value = window.innerWidth
}

onMounted(() => {
  syncViewportWidth()
  window.addEventListener('resize', syncViewportWidth)
})

onBeforeUnmount(() => window.removeEventListener('resize', syncViewportWidth))

function toggleSidebar(): void {
  if (dashboardDesktop.value) {
    sidebarMini.value = !sidebarMini.value
  }
  else {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
  }
}

function setAccent(value: DashboardAccent): void {
  accent.value = value
}

function setDashboardZoom(value: DashboardZoom): void {
  dashboardZoom.value = value
}

function setDashboardTextSize(value: DashboardTextSize): void {
  dashboardTextSize.value = value
}

async function logout(): Promise<void> {
  logoutPending.value = true
  try {
    await $fetch('/api/v1/auth/logout', { method: 'POST' })
  }
  finally {
    currentUser.value = null
    adminSummary.value = null
    logoutPending.value = false
    await navigateTo('/login')
  }
}
</script>

<template>
  <div class="admin-shell" :class="{ 'admin-shell--mini': sidebarMini }">
    <AdminSidebar
      :mini="sidebarMini"
      :desktop="dashboardDesktop"
      :mobile-open="mobileSidebarOpen"
      @close="mobileSidebarOpen = false"
    />

    <div class="admin-main">
      <AdminTopbar
        :user="currentUser"
        :accent="accent"
        :accents="dashboardAccents"
        :dark="isDark"
        :dashboard-zoom="dashboardZoom"
        :dashboard-text-size="dashboardTextSize"
        :logout-pending="logoutPending"
        @accent-change="setAccent"
        @dashboard-text-size-change="setDashboardTextSize"
        @dashboard-zoom-change="setDashboardZoom"
        @logout="logout"
        @toggle-color-mode="toggleColorMode"
        @toggle-sidebar="toggleSidebar"
      />

      <main class="admin-content">
        <slot />
      </main>
    </div>
  </div>
</template>
