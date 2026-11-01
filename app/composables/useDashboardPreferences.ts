export const dashboardAccents = [
  { value: 'nuxt', label: 'Nuxt green', color: '#00dc82' },
  { value: 'blue', label: 'Ocean blue', color: '#2563eb' },
  { value: 'red', label: 'Signal red', color: '#e11d48' },
  { value: 'emerald', label: 'Emerald', color: '#059669' },
  { value: 'violet', label: 'Violet', color: '#7c3aed' },
  { value: 'amber', label: 'Amber', color: '#d97706' },
] as const

export type DashboardAccent = typeof dashboardAccents[number]['value']

export const dashboardZoomLevels = [90, 100, 110] as const
export const dashboardTextSizes = [90, 100, 110] as const
export type DashboardZoom = typeof dashboardZoomLevels[number]
export type DashboardTextSize = typeof dashboardTextSizes[number]

export function useDashboardPreferences() {
  const colorMode = useColorMode()
  const accent = useState<DashboardAccent>('dashboard-accent', () => 'nuxt')
  const dashboardZoom = useState<DashboardZoom>('dashboard-zoom', () => 100)
  const dashboardTextSize = useState<DashboardTextSize>('dashboard-text-size', () => 100)
  const sidebarMini = useState('sidebar-mini', () => false)
  const mobileSidebarOpen = useState('mobile-sidebar-open', () => false)
  const initialized = useState('dashboard-preferences-ready', () => false)

  const isDark = computed(() => colorMode.value === 'dark')

  function applyColorModeToDocument(dark: boolean): void {
    if (!import.meta.client) return
    const root = document.documentElement
    root.classList.toggle('dark', dark)
    root.classList.toggle('light', !dark)
    root.style.colorScheme = dark ? 'dark' : 'light'
  }

  function applyDashboardAttributes(): void {
    if (!import.meta.client) return
    const root = document.documentElement
    root.dataset.dashboardAccent = accent.value
    root.dataset.dashboardZoom = String(dashboardZoom.value)
    root.dataset.dashboardTextSize = String(dashboardTextSize.value)
    root.dataset.sidebarMini = sidebarMini.value ? 'true' : 'false'
  }

  useHead(() => ({
    htmlAttrs: {
      'data-dashboard-accent': accent.value,
      'data-dashboard-zoom': String(dashboardZoom.value),
      'data-dashboard-text-size': String(dashboardTextSize.value),
      'data-sidebar-mini': sidebarMini.value ? 'true' : 'false',
    },
  }))

  onMounted(() => {
    if (initialized.value) {
      return
    }

    const savedAccent = localStorage.getItem('app-dashboard-accent')
    if (dashboardAccents.some(option => option.value === savedAccent)) {
      accent.value = savedAccent as DashboardAccent
    }

    const savedZoom = Number(localStorage.getItem('app-dashboard-zoom'))
    if (dashboardZoomLevels.some(level => level === savedZoom)) {
      dashboardZoom.value = savedZoom as DashboardZoom
    }

    const savedTextSize = Number(localStorage.getItem('app-dashboard-text-size'))
    if (dashboardTextSizes.some(size => size === savedTextSize)) {
      dashboardTextSize.value = savedTextSize as DashboardTextSize
    }

    sidebarMini.value = localStorage.getItem('app-sidebar-mini') === 'true'
    initialized.value = true
    applyDashboardAttributes()
    applyColorModeToDocument(isDark.value)
  })

  watch(accent, value => {
    if (import.meta.client) {
      localStorage.setItem('app-dashboard-accent', value)
      document.documentElement.dataset.dashboardAccent = value
    }
  })

  watch(sidebarMini, value => {
    if (import.meta.client) {
      localStorage.setItem('app-sidebar-mini', String(value))
      document.documentElement.dataset.sidebarMini = value ? 'true' : 'false'
    }
  })

  watch(dashboardZoom, value => {
    if (import.meta.client) {
      localStorage.setItem('app-dashboard-zoom', String(value))
      document.documentElement.dataset.dashboardZoom = String(value)
    }
  })

  watch(dashboardTextSize, value => {
    if (import.meta.client) {
      localStorage.setItem('app-dashboard-text-size', String(value))
      document.documentElement.dataset.dashboardTextSize = String(value)
    }
  })

  watch(isDark, value => applyColorModeToDocument(value), { immediate: true, flush: 'sync' })

  function toggleColorMode(): void {
    const dark = !isDark.value
    applyColorModeToDocument(dark)
    colorMode.preference = dark ? 'dark' : 'light'
  }

  return {
    accent,
    colorMode,
    dashboardAccents,
    dashboardTextSize,
    dashboardZoom,
    isDark,
    mobileSidebarOpen,
    sidebarMini,
    toggleColorMode,
  }
}
