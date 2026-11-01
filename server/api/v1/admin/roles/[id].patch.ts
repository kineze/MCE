import { getRouterParam, readBody } from 'h3'
import { requirePermission } from '../../../../utils/authorization'
import { updateRole } from '../../../../services/roles/roles'
import { roleIdSchema, updateRoleSchema } from '../../../../services/roles/validation'

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'roles.manage')
  const roleId = roleIdSchema.safeParse(getRouterParam(event, 'id'))
  if (!roleId.success) {
    throw createError({ statusCode: 404, statusMessage: 'Role not found' })
  }

  const parsed = updateRoleSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'Names need at least 2 characters' })
  }

  const role = await updateRole(actor, roleId.data, parsed.data)
  return { role }
})
