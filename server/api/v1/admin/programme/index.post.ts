import { readBody, setResponseStatus } from 'h3'
import { requirePermission } from '../../../../utils/authorization'
import { createSession } from '../../../../services/programme/programme'
import { createSessionSchema, sessionValidationMessage } from '../../../../services/programme/validation'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'programme.manage')
  const parsed = createSessionSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: sessionValidationMessage(parsed.error) })
  }

  const session = await createSession(parsed.data)
  setResponseStatus(event, 201)
  return { session }
})
