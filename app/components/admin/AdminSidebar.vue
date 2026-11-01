<script setup lang="ts">
import type { AuthenticatedUser } from '#shared/types/auth'
import { navigationGroups as configuredGroups, primaryNavigation as configuredPrimary, type NavigationGroup, type NavigationItem } from '../../utils/navigation'

const props = defineProps<{
  mini: boolean
  desktop: boolean
  mobileOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const route = useRoute()
const { public: { appName } } = useRuntimeConfig()
const currentUser = useState<AuthenticatedUser | null>('current-user')

function canSee(item: NavigationItem): boolean {
  return !item.permission || (currentUser.value?.permissions.includes(item.permission) ?? false)
}

function menuId(group: NavigationGroup): string {
  return `${group.key}-menu`
}

function storageKey(group: NavigationGroup): string {
  return `app-${group.key}-expanded`
}

const primaryNavigation = configuredPrimary.filter(canSee)
const navigationGroups = configuredGroups
  .map(group => ({ ...group, items: group.items.filter(canSee) }))
  .filter(group => group.items.length > 0)

const expandedGroups = reactive<Record<string, boolean>>(
  Object.fromEntries(navigationGroups.map(group => [group.key, false])),
)
const activeFlyoutKey = ref<string | null>(null)
const activeFlyoutGroup = computed(() => (
  navigationGroups.find(group => group.key === activeFlyoutKey.value) ?? null
))
const desktopMini = computed(() => props.mini && props.desktop)
const activeFlyoutTrigger = ref<HTMLElement | null>(null)
const miniFlyout = ref<HTMLElement | null>(null)
const flyoutTop = ref('4.75rem')
const groupPreferencesReady = ref(false)
let hideFlyoutTimer: ReturnType<typeof setTimeout> | undefined

function isItemActive(to: string): boolean {
  return route.path === to || route.path.startsWith(`${to}/`)
}

function isGroupActive(group: NavigationGroup): boolean {
  return group.items.some(item => isItemActive(item.to))
}

function cancelFlyoutHide(): void {
  if (hideFlyoutTimer) {
    clearTimeout(hideFlyoutTimer)
    hideFlyoutTimer = undefined
  }
}

function positionMiniFlyout(trigger: HTMLElement, itemCount: number): void {
  if (!import.meta.client) {
    return
  }

  const triggerRect = trigger.getBoundingClientRect()
  const estimatedHeight = 48 + (itemCount * 48)
  const viewportPadding = 8
  const top = Math.max(
    viewportPadding,
    Math.min(triggerRect.top, window.innerHeight - estimatedHeight - viewportPadding),
  )

  flyoutTop.value = `${top}px`
}

function showMiniFlyout(group: NavigationGroup, event: Event): void {
  if (!desktopMini.value) {
    return
  }

  const trigger = event.currentTarget
  if (!(trigger instanceof HTMLElement)) {
    return
  }

  cancelFlyoutHide()
  activeFlyoutKey.value = group.key
  activeFlyoutTrigger.value = trigger
  positionMiniFlyout(trigger, group.items.length)
}

function scheduleFlyoutHide(): void {
  cancelFlyoutHide()
  hideFlyoutTimer = setTimeout(() => {
    activeFlyoutKey.value = null
    activeFlyoutTrigger.value = null
  }, 160)
}

function toggleGroup(group: NavigationGroup, event: Event): void {
  if (desktopMini.value) {
    showMiniFlyout(group, event)
    return
  }

  expandedGroups[group.key] = !expandedGroups[group.key]
}

function handleDocumentClick(event: MouseEvent): void {
  const target = event.target as Node
  if (
    activeFlyoutKey.value
    && !activeFlyoutTrigger.value?.contains(target)
    && !miniFlyout.value?.contains(target)
  ) {
    activeFlyoutKey.value = null
    activeFlyoutTrigger.value = null
  }
}

function handleEscape(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    activeFlyoutKey.value = null
    activeFlyoutTrigger.value = null
  }
}

onMounted(() => {
  for (const group of navigationGroups) {
    expandedGroups[group.key] = localStorage.getItem(storageKey(group)) === 'true'
  }
  groupPreferencesReady.value = true
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  cancelFlyoutHide()
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleEscape)
})

watch(() => props.mini, () => {
  activeFlyoutKey.value = null
  activeFlyoutTrigger.value = null
})

watch(() => props.desktop, (desktop) => {
  if (!desktop) {
    activeFlyoutKey.value = null
    activeFlyoutTrigger.value = null
  }
})

watch(expandedGroups, () => {
  if (import.meta.client && groupPreferencesReady.value) {
    for (const group of navigationGroups) {
      localStorage.setItem(storageKey(group), String(expandedGroups[group.key]))
    }
  }
}, { deep: true })

watch(() => route.fullPath, () => {
  activeFlyoutKey.value = null
  activeFlyoutTrigger.value = null
  emit('close')
})
</script>

<template>
  <aside
    class="admin-sidebar"
    :class="{
      'admin-sidebar--mini': mini,
      'admin-sidebar--open': mobileOpen,
    }"
  >
    <div class="admin-sidebar__brand">
      <NuxtLink to="/admin" :aria-label="`${appName} dashboard`">
        <AppLogo :compact="mini" />
      </NuxtLink>
    </div>

    <div class="admin-sidebar__body">
      <nav aria-label="Primary navigation" class="admin-sidebar__nav">
        <NuxtLink
          v-for="item in primaryNavigation"
          :key="item.label"
          :to="item.to"
          class="admin-sidebar__link"
          active-class=""
          exact-active-class="is-active"
          :title="mini ? item.label : undefined"
        >
          <span class="admin-sidebar__icon"><UIcon :name="item.icon" /></span>
          <span class="admin-sidebar__label">{{ item.label }}</span>
        </NuxtLink>

        <div
          v-for="group in navigationGroups"
          :key="group.key"
          class="admin-sidebar__group"
          :class="{
            'is-open': expandedGroups[group.key],
            'is-active': isGroupActive(group),
          }"
          @pointerenter="showMiniFlyout(group, $event)"
          @pointerleave="scheduleFlyoutHide"
        >
          <button
            type="button"
            class="admin-sidebar__link"
            :class="{ 'is-section-active': isGroupActive(group) }"
            :title="mini ? group.label : undefined"
            :aria-controls="menuId(group)"
            :aria-expanded="desktopMini ? activeFlyoutKey === group.key : expandedGroups[group.key]"
            @click="toggleGroup(group, $event)"
            @focus="showMiniFlyout(group, $event)"
          >
            <span class="admin-sidebar__icon"><UIcon :name="group.icon" /></span>
            <span class="admin-sidebar__label">{{ group.label }}</span>
            <UIcon
              name="i-lucide-chevron-down"
              class="admin-sidebar__chevron admin-sidebar__label"
            />
          </button>

          <div
            v-if="!desktopMini && expandedGroups[group.key]"
            :id="menuId(group)"
            class="admin-sidebar__submenu"
          >
            <NuxtLink
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              class="admin-sidebar__sublink"
              :class="{ 'is-active': isItemActive(item.to) }"
            >
              <UIcon :name="item.icon" />
              <span>{{ item.label }}</span>
            </NuxtLink>
          </div>
        </div>
      </nav>

    </div>

  </aside>

  <div
    v-if="desktopMini && activeFlyoutGroup"
    :id="menuId(activeFlyoutGroup)"
    ref="miniFlyout"
    class="admin-sidebar__flyout"
    :style="{ top: flyoutTop }"
    @pointerenter="cancelFlyoutHide"
    @pointerleave="scheduleFlyoutHide"
  >
    <div class="admin-sidebar__flyout-header">
      <strong>{{ activeFlyoutGroup.label }}</strong>
      <button
        type="button"
        :aria-label="`Close ${activeFlyoutGroup.label} menu`"
        @click="activeFlyoutKey = null; activeFlyoutTrigger = null"
      >
        <UIcon name="i-lucide-x" />
      </button>
    </div>

    <nav :aria-label="`${activeFlyoutGroup.label} navigation`" class="admin-sidebar__flyout-links">
      <NuxtLink
        v-for="item in activeFlyoutGroup.items"
        :key="item.to"
        :to="item.to"
        class="admin-sidebar__flyout-link"
        :class="{ 'is-active': isItemActive(item.to) }"
      >
        <span class="admin-sidebar__flyout-icon"><UIcon :name="item.icon" /></span>
        <strong>{{ item.label }}</strong>
      </NuxtLink>
    </nav>
  </div>

  <button
    v-if="mobileOpen"
    type="button"
    class="admin-sidebar__overlay"
    aria-label="Close navigation"
    @click="emit('close')"
  />
</template>
