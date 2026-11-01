import { getRouterParam, readBody } from 'h3'
import { requirePermission } from '../../../../utils/authorization'
import { updateUser } from '../../../../services/users/users'
import { updateUserSchema, userIdSchema } from '../../../../services/users/validation'

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'users.manage')
  const userId = userIdSchema.safeParse(getRouterParam(event, 'id'))
  if (!userId.success) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const parsed = updateUserSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Names need at least 2 characters and passwords at least 12',
    })
  }

  const user = await updateUser(actor, userId.data, parsed.data)
  return { user }
})
