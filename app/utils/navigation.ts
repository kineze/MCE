// Sidebar navigation. Add new pages here; `permission` hides an entry from
// users who lack it (the server still enforces access on every API route).

export interface NavigationItem {
  label: string
  icon: string
  to: string
  permission?: string
}

export interface NavigationGroup {
  key: string
  label: string
  icon: string
  items: NavigationItem[]
}

export const primaryNavigation: NavigationItem[] = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/admin' },
]

export const navigationGroups: NavigationGroup[] = [
  {
    key: 'access',
    label: 'Users & permissions',
    icon: 'i-lucide-user-cog',
    items: [
      { label: 'Users', icon: 'i-lucide-users', to: '/admin/users', permission: 'users.read' },
      { label: 'Role manager', icon: 'i-lucide-shield-check', to: '/admin/roles', permission: 'roles.read' },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: 'i-lucide-settings',
    items: [
      { label: 'General', icon: 'i-lucide-sliders-horizontal', to: '/admin/settings', permission: 'settings.read' },
    ],
  },
]
