export interface AuthenticatedUser {
  id: string
  email: string
  displayName: string
  roles: string[]
  permissions: string[]
}

export interface AuthResponse {
  user: AuthenticatedUser
}

export interface AdminDashboardSummary {
  user: AuthenticatedUser
  metrics: {
    users: number
    activeUsers: number
    roles: number
    activeSessions: number
  }
  recentUsers: Array<{
    id: string
    displayName: string
    email: string
    status: 'ACTIVE' | 'DISABLED'
    createdAt: string
    roles: string[]
  }>
}
