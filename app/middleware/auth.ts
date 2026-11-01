import type { AdminDashboardSummary, AuthenticatedUser } from '#shared/types/auth'

export default defineNuxtRouteMiddleware(async (to) => {
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

  const permission = to.meta.permission
  if (permission && !currentUser.value?.permissions.includes(permission)) {
    throw createError({ statusCode: 403, statusMessage: 'Insufficient permissions' })
  }
})
