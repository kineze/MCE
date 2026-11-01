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

// Public site navigation, used by the `public` layout header and footer.

export interface PublicLink {
  label: string
  to: string
}

export interface PublicLinkGroup {
  label: string
  links: PublicLink[]
}

export const publicNavigation: PublicLink[] = [
  { label: 'Features', to: '/#features' },
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'Get started', to: '/#get-started' },
]

export const publicFooterGroups: PublicLinkGroup[] = [
  {
    label: 'Product',
    links: [
      { label: 'Features', to: '/#features' },
      { label: 'How it works', to: '/#how-it-works' },
    ],
  },
  {
    label: 'Account',
    links: [
      { label: 'Sign in', to: '/login' },
    ],
  },
]
