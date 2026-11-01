import { sendNoContent } from 'h3'
import { clearSessionCookie, readSessionToken, revokeSession } from '../../../services/auth/session'

export default defineEventHandler(async (event) => {
  const token = readSessionToken(event)
  if (token) {
    await revokeSession(token)
  }

  clearSessionCookie(event)
  return sendNoContent(event)
})
