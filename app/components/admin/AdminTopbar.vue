<script setup lang="ts">
import type { AuthenticatedUser } from '../../../shared/types/auth'
import {
  dashboardTextSizes,
  dashboardZoomLevels,
  type DashboardAccent,
  type DashboardTextSize,
  type DashboardZoom,
} from '../../composables/useDashboardPreferences'

const props = defineProps<{
  user: AuthenticatedUser | null
  accent: DashboardAccent
  accents: ReadonlyArray<{ value: DashboardAccent, label: string, color: string }>
  dashboardZoom: DashboardZoom
  dashboardTextSize: DashboardTextSize
  logoutPending: boolean
}>()

const emit = defineEmits<{
  accentChange: [value: DashboardAccent]
  dashboardTextSizeChange: [value: DashboardTextSize]
  dashboardZoomChange: [value: DashboardZoom]
  logout: []
  toggleSidebar: []
}>()

const accentOpen = ref(false)
const displayOpen = ref(false)
const userOpen = ref(false)
const displayPopover = ref<HTMLElement | null>(null)

function handleOutsideClick(event: MouseEvent): void {
  const target = event.target
  if (displayOpen.value && target instanceof Node && !displayPopover.value?.contains(target)) {
    displayOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleOutsideClick))
onBeforeUnmount(() => document.removeEventListener('click', handleOutsideClick))

function stepValue<T extends number>(levels: readonly T[], current: T, direction: -1 | 1): T {
  const currentIndex = levels.indexOf(current)
  const nextIndex = Math.min(levels.length - 1, Math.max(0, currentIndex + direction))
  return levels[nextIndex] ?? current
}

function changeZoom(direction: -1 | 1): void {
  emit('dashboardZoomChange', stepValue(dashboardZoomLevels, props.dashboardZoom, direction))
}

function changeTextSize(direction: -1 | 1): void {
  emit('dashboardTextSizeChange', stepValue(dashboardTextSizes, props.dashboardTextSize, direction))
}

function resetDisplay(): void {
  emit('dashboardZoomChange', 100)
  emit('dashboardTextSizeChange', 100)
}
</script>

<template>
  <header class="admin-topbar">
    <div class="admin-topbar__inner">
      <button type="button" class="topbar-icon-button" aria-label="Toggle navigation" @click="emit('toggleSidebar')">
        <UIcon name="i-lucide-panel-left" />
      </button>

      <div class="admin-topbar__spacer" />

      <div class="topbar-popover">
        <button
          type="button"
          class="topbar-icon-button topbar-accent-button"
          aria-label="Change dashboard color"
          :aria-expanded="accentOpen"
          @click="accentOpen = !accentOpen; displayOpen = false; userOpen = false"
        >
          <span class="topbar-accent-dot"><UIcon name="i-lucide-palette" /></span>
        </button>

        <div v-if="accentOpen" class="topbar-menu topbar-theme-menu" aria-label="Dashboard color">
          <button
            v-for="option in accents"
            :key="option.value"
            type="button"
            class="topbar-theme-option"
            :class="{ 'is-active': accent === option.value }"
            :aria-label="`Use ${option.label} dashboard color`"
            :title="option.label"
            @click="emit('accentChange', option.value); accentOpen = false"
          >
            <span :style="{ backgroundColor: option.color }" />
          </button>
        </div>
      </div>

      <div ref="displayPopover" class="topbar-popover">
        <button
          type="button"
          class="topbar-icon-button"
          aria-label="Adjust dashboard zoom and text size"
          :aria-expanded="displayOpen"
          @click="displayOpen = !displayOpen; accentOpen = false; userOpen = false"
        >
          <UIcon name="i-lucide-scan-text" />
        </button>

        <div v-if="displayOpen" class="topbar-menu topbar-display-menu">
          <div class="topbar-menu__heading">
            <strong>Display size</strong>
            <small>Adjust the dashboard interface</small>
          </div>

          <div class="topbar-display-setting">
            <div><strong>Dashboard zoom</strong><small>{{ dashboardZoom }}%</small></div>
            <div class="topbar-stepper">
              <button type="button" aria-label="Zoom out" :disabled="dashboardZoom === dashboardZoomLevels[0]" @click="changeZoom(-1)"><UIcon name="i-lucide-minus" /></button>
              <output>{{ dashboardZoom }}%</output>
              <button type="button" aria-label="Zoom in" :disabled="dashboardZoom === dashboardZoomLevels[dashboardZoomLevels.length - 1]" @click="changeZoom(1)"><UIcon name="i-lucide-plus" /></button>
            </div>
          </div>

          <div class="topbar-display-setting">
            <div><strong>Text size</strong><small>{{ dashboardTextSize === 100 ? 'Default' : `${dashboardTextSize}%` }}</small></div>
            <div class="topbar-stepper">
              <button type="button" aria-label="Decrease text size" :disabled="dashboardTextSize === dashboardTextSizes[0]" @click="changeTextSize(-1)"><span>A−</span></button>
              <output>{{ dashboardTextSize }}%</output>
              <button type="button" aria-label="Increase text size" :disabled="dashboardTextSize === dashboardTextSizes[dashboardTextSizes.length - 1]" @click="changeTextSize(1)"><span>A+</span></button>
            </div>
          </div>

          <button type="button" class="topbar-display-reset" :disabled="dashboardZoom === 100 && dashboardTextSize === 100" @click="resetDisplay">
            <UIcon name="i-lucide-rotate-ccw" />Reset display size
          </button>
        </div>
      </div>

      <div class="topbar-popover">
        <button
          type="button"
          class="topbar-user"
          :aria-expanded="userOpen"
          @click="userOpen = !userOpen; accentOpen = false; displayOpen = false"
        >
          <span class="topbar-user__avatar">{{ user?.displayName?.charAt(0).toUpperCase() || 'A' }}</span>
          <span class="topbar-user__copy">
            <strong>{{ user?.displayName || 'Administrator' }}</strong>
            <small>{{ user?.roles[0]?.replaceAll('_', ' ') || 'Member' }}</small>
          </span>
          <UIcon name="i-lucide-chevron-down" />
        </button>

        <div v-if="userOpen" class="topbar-menu topbar-user-menu">
          <div class="topbar-menu__heading">
            <strong>{{ user?.displayName }}</strong>
            <small>{{ user?.email }}</small>
          </div>
          <div class="topbar-user-menu__roles">
            <span v-for="role in user?.roles" :key="role">{{ role.replaceAll('_', ' ') }}</span>
          </div>
          <button type="button" class="topbar-logout" :disabled="logoutPending" @click="emit('logout')">
            <UIcon name="i-lucide-log-out" />
            {{ logoutPending ? 'Signing out…' : 'Sign out' }}
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
