import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'ok', database: 'ok' }
  }
  catch {
    setResponseStatus(event, 503)
    return { status: 'degraded', database: 'unreachable' }
  }
})
