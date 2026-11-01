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
    key: 'festival',
    label: 'Festival',
    icon: 'i-lucide-calendar-days',
    items: [
      { label: 'Programme', icon: 'i-lucide-calendar-clock', to: '/admin/programme', permission: 'programme.read' },
      { label: 'Registrations', icon: 'i-lucide-clipboard-list', to: '/admin/registrations', permission: 'registrations.read' },
    ],
  },
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
  { label: 'Programme', to: '/programme' },
]

export const publicFooterGroups: PublicLinkGroup[] = [
  {
    label: 'Festival',
    links: [
      { label: 'Programme', to: '/programme' },
      { label: 'Register', to: '/#register' },
    ],
  },
  {
    label: 'Organisers',
    links: [
      { label: 'Team sign-in', to: '/login' },
    ],
  },
]
