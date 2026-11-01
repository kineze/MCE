import { getQuery } from 'h3'
import { requirePermission } from '../../../../utils/authorization'
import { listUsers } from '../../../../services/users/users'
import { listUsersQuerySchema } from '../../../../services/users/validation'

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'users.read')
  const parsed = listUsersQuerySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid search or page' })
  }

  return listUsers(actor, parsed.data)
})
