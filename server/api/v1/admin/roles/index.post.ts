import { readBody, setResponseStatus } from 'h3'
import { requirePermission } from '../../../../utils/authorization'
import { createRole } from '../../../../services/roles/roles'
import { createRoleSchema } from '../../../../services/roles/validation'

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'roles.manage')
  const parsed = createRoleSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Enter a name of at least 2 characters and a key of lowercase letters, numbers and underscores',
    })
  }

  const role = await createRole(actor, parsed.data)
  setResponseStatus(event, 201)
  return { role }
})
