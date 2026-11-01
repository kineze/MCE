import { readBody, setResponseStatus } from 'h3'
import { requirePermission } from '../../../../utils/authorization'
import { createUser } from '../../../../services/users/users'
import { createUserSchema } from '../../../../services/users/validation'

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'users.manage')
  const parsed = createUserSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Enter a valid email, a name of at least 2 characters and a password of at least 12 characters',
    })
  }

  const user = await createUser(actor, parsed.data)
  setResponseStatus(event, 201)
  return { user }
})
