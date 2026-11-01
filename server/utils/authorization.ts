import type { H3Event } from 'h3'
import { createError } from 'h3'
import type { AuthenticatedUser } from '../../shared/types/auth'

export function hasRole(user: AuthenticatedUser, role: string): boolean {
  return user.roles.includes(role)
}

export function hasPermission(
  user: AuthenticatedUser,
  permission: string,
): boolean {
  return user.permissions.includes(permission)
}

function forbidden(): never {
  throw createError({
    statusCode: 403,
    statusMessage: 'Insufficient permissions',
  })
}

export async function requireRole(
  event: H3Event,
  role: string,
): Promise<AuthenticatedUser> {
  const { requireAuthenticatedUser } = await import('./auth')
  const user = await requireAuthenticatedUser(event)
  return hasRole(user, role) ? user : forbidden()
}

export async function requirePermission(
  event: H3Event,
  permission: string,
): Promise<AuthenticatedUser> {
  const { requireAuthenticatedUser } = await import('./auth')
  const user = await requireAuthenticatedUser(event)
  return hasPermission(user, permission) ? user : forbidden()
}
