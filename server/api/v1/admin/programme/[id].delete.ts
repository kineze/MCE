import { getRouterParam, sendNoContent } from 'h3'
import { requirePermission } from '../../../../utils/authorization'
import { deleteSession } from '../../../../services/programme/programme'
import { sessionIdSchema } from '../../../../services/programme/validation'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'programme.manage')
  const sessionId = sessionIdSchema.safeParse(getRouterParam(event, 'id'))
  if (!sessionId.success) {
    throw createError({ statusCode: 404, statusMessage: 'Session not found' })
  }

  await deleteSession(sessionId.data)
  return sendNoContent(event)
})
