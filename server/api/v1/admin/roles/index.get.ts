import { requirePermission } from '../../../../utils/authorization'
import { listRoles } from '../../../../services/roles/roles'

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'roles.read')
  return listRoles(actor)
})
