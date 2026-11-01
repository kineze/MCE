import { getRouterParam, sendNoContent } from 'h3'
import { requirePermission } from '../../../../utils/authorization'
import { deleteRole } from '../../../../services/roles/roles'
import { roleIdSchema } from '../../../../services/roles/validation'

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'roles.manage')
  const roleId = roleIdSchema.safeParse(getRouterParam(event, 'id'))
  if (!roleId.success) {
    throw createError({ statusCode: 404, statusMessage: 'Role not found' })
  }

  await deleteRole(actor, roleId.data)
  return sendNoContent(event)
})
