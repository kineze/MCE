import { getRouterParam } from 'h3'
import { requirePermission } from '../../../../../utils/authorization'
import { sendRegistrationConfirmation } from '../../../../../services/registrations/registrations'
import { registrationIdSchema } from '../../../../../services/registrations/validation'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'registrations.manage')
  const registrationId = registrationIdSchema.safeParse(getRouterParam(event, 'id'))
  if (!registrationId.success) {
    throw createError({ statusCode: 404, statusMessage: 'Registration not found' })
  }

  const result = await sendRegistrationConfirmation(registrationId.data)
  if (!result.sent) {
    throw createError({ statusCode: 502, statusMessage: result.error ?? 'The email could not be sent' })
  }

  return { sent: true }
})
