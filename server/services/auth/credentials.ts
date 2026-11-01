import type { H3Event } from 'h3'
import { createError, getRequestIP, readBody, setHeader } from 'h3'
import { hashPassword, verifyPassword } from './password'
import { loginRateLimiter } from './rate-limit'
import { loginSchema, normalizeEmail } from './validation'
import { prisma } from '../../utils/prisma'

function invalidCredentials(): never {
  throw createError({
    statusCode: 401,
    statusMessage: 'Invalid email or password',
  })
}

/**
 * Validates the email/password body of a login request and returns the
 * matching active user, applying rate limiting and timing-safe failure handling.
 */
export async function verifyLoginCredentials(event: H3Event): Promise<{
  userId: string
  ipAddress?: string
}> {
  const parsed = loginSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Enter a valid email address and password',
    })
  }

  const email = normalizeEmail(parsed.data.email)
  const ipAddress = getRequestIP(event) ?? 'unknown'
  const rateLimitKey = `${ipAddress}:${email}`
  const rateLimit = loginRateLimiter.consume(rateLimitKey)

  if (!rateLimit.allowed) {
    setHeader(event, 'Retry-After', rateLimit.retryAfterSeconds)
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many login attempts. Try again later.',
    })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    // Perform the same deliberately expensive work as a real password check.
    await hashPassword(parsed.data.password)
    return invalidCredentials()
  }

  const passwordIsValid = await verifyPassword(
    parsed.data.password,
    user.passwordHash,
  )

  if (!passwordIsValid || user.status !== 'ACTIVE') {
    return invalidCredentials()
  }

  loginRateLimiter.reset(rateLimitKey)
  return {
    userId: user.id,
    ipAddress: ipAddress === 'unknown' ? undefined : ipAddress,
  }
}
