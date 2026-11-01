import { requirePermission } from '../../../../utils/authorization'
import { listAdminProgramme } from '../../../../services/programme/programme'

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'programme.read')
  return listAdminProgramme(actor)
})
