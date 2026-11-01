import type { H3Event } from 'h3'
import { createError } from 'h3'
import type { AuthenticatedUser } from '../../shared/types/auth'
import { findUserBySessionToken, readSessionToken } from '../services/auth/session'

export async function getAuthenticatedUser(
  event: H3Event,
): Promise<AuthenticatedUser | null> {
  const token = readSessionToken(event)
  if (!token) {
    return null
  }

  return findUserBySessionToken(token)
}

export async function requireAuthenticatedUser(
  event: H3Event,
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  return user
}
