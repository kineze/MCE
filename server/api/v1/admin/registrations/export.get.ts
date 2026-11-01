import { setHeader } from 'h3'
import { requirePermission } from '../../../../utils/authorization'
import { exportRegistrationsCsv } from '../../../../services/registrations/registrations'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'registrations.read')
  const date = new Date().toISOString().slice(0, 10)

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="mce-registrations-${date}.csv"`)
  setHeader(event, 'Cache-Control', 'no-store')
  return exportRegistrationsCsv()
})
