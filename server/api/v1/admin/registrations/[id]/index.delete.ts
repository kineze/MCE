import { getRouterParam, sendNoContent } from 'h3'
import { requirePermission } from '../../../../../utils/authorization'
import { deleteRegistration } from '../../../../../services/registrations/registrations'
import { registrationIdSchema } from '../../../../../services/registrations/validation'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'registrations.manage')
  const registrationId = registrationIdSchema.safeParse(getRouterParam(event, 'id'))
  if (!registrationId.success) {
    throw createError({ statusCode: 404, statusMessage: 'Registration not found' })
  }

  await deleteRegistration(registrationId.data)
  return sendNoContent(event)
})
