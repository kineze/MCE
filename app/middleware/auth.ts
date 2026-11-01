import type { AdminDashboardSummary, AuthenticatedUser } from '../../shared/types/auth'

export default defineNuxtRouteMiddleware(async () => {
  const currentUser = useState<AuthenticatedUser | null>('current-user', () => null)
  const adminSummary = useState<AdminDashboardSummary | null>('admin-summary', () => null)

  try {
    const request = import.meta.server ? useRequestFetch() : $fetch
    const response = await request<{ user: AuthenticatedUser }>('/api/v1/auth/me')
    currentUser.value = response.user
    adminSummary.value = response.user.permissions.includes('system.admin')
      ? await request<AdminDashboardSummary>('/api/v1/admin/summary')
      : null
  }
  catch (error: unknown) {
    const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
      ? Number(error.statusCode)
      : 401

    if (statusCode === 403) {
      throw error
    }

    currentUser.value = null
    adminSummary.value = null
    return navigateTo('/login')
  }
})
