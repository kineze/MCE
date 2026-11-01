import { getRouterParam, readBody } from 'h3'
import { requirePermission } from '../../../../utils/authorization'
import { updateSession } from '../../../../services/programme/programme'
import { sessionIdSchema, sessionValidationMessage, updateSessionSchema } from '../../../../services/programme/validation'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'programme.manage')
  const sessionId = sessionIdSchema.safeParse(getRouterParam(event, 'id'))
  if (!sessionId.success) {
    throw createError({ statusCode: 404, statusMessage: 'Session not found' })
  }

  const parsed = updateSessionSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: sessionValidationMessage(parsed.error) })
  }

  const session = await updateSession(sessionId.data, parsed.data)
  return { session }
})
