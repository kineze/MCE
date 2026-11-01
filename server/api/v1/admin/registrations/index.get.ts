import { getQuery } from 'h3'
import { requirePermission } from '../../../../utils/authorization'
import { listRegistrations } from '../../../../services/registrations/registrations'
import { listRegistrationsQuerySchema } from '../../../../services/registrations/validation'

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'registrations.read')
  const parsed = listRegistrationsQuerySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid search, day or page' })
  }

  return listRegistrations(actor, parsed.data)
})
