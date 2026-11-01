import { getHeader } from 'h3'
import { verifyLoginCredentials } from '../../../services/auth/credentials'
import { createSession, findUserBySessionToken, setSessionCookie } from '../../../services/auth/session'

export default defineEventHandler(async (event) => {
  const { userId, ipAddress } = await verifyLoginCredentials(event)
  const { token } = await createSession({
    userId,
    ipAddress,
    userAgent: getHeader(event, 'user-agent'),
  })
  setSessionCookie(event, token)

  const authenticatedUser = await findUserBySessionToken(token)
  if (!authenticatedUser) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to create session',
    })
  }

  return { user: authenticatedUser }
})
