import { randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import { deleteCookie, getCookie, getHeader, setCookie } from 'h3'
import type { AuthenticatedUser } from '../../../shared/types/auth'
import { prisma } from '../../utils/prisma'
import { getSessionCookieName, hashSessionToken, parseBearerToken } from './session-token'

export { getSessionCookieName, hashSessionToken } from './session-token'

const SESSION_DURATION_SECONDS = 12 * 60 * 60

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'strict' as const,
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  }
}

export function setSessionCookie(event: H3Event, token: string): void {
  setCookie(event, getSessionCookieName(), token, sessionCookieOptions())
}

export function clearSessionCookie(event: H3Event): void {
  deleteCookie(event, getSessionCookieName(), sessionCookieOptions())
}

/** Reads the web session cookie, falling back to an `Authorization: Bearer` token for API clients. */
export function readSessionToken(event: H3Event): string | undefined {
  return getCookie(event, getSessionCookieName())
    ?? parseBearerToken(getHeader(event, 'authorization'))
}

export async function createSession(input: {
  userId: string
  ipAddress?: string
  userAgent?: string
  durationSeconds?: number
}): Promise<{ token: string, expiresAt: Date }> {
  const token = randomBytes(32).toString('base64url')
  const durationSeconds = input.durationSeconds ?? SESSION_DURATION_SECONDS
  const expiresAt = new Date(Date.now() + durationSeconds * 1000)

  await prisma.session.create({
    data: {
      tokenHash: hashSessionToken(token),
      userId: input.userId,
      expiresAt,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent?.slice(0, 512),
    },
  })

  return { token, expiresAt }
}

export async function revokeSession(token: string): Promise<void> {
  await prisma.session.updateMany({
    where: {
      tokenHash: hashSessionToken(token),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  })
}

export async function findUserBySessionToken(
  token: string,
  now = new Date(),
): Promise<AuthenticatedUser | null> {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: {
      user: {
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (
    !session
    || session.revokedAt
    || session.expiresAt <= now
    || session.user.status !== 'ACTIVE'
  ) {
    return null
  }

  const roles = session.user.roles.map(userRole => userRole.role.key)
  const permissions = new Set(
    session.user.roles.flatMap(userRole =>
      userRole.role.permissions.map(rolePermission => rolePermission.permission.key),
    ),
  )

  return {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    roles,
    permissions: [...permissions],
  }
}
