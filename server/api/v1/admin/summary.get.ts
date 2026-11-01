import { requirePermission } from '../../../utils/authorization'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'system.admin')

  const now = new Date()
  const [users, activeUsers, roles, activeSessions, recentUsers]
    = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.role.count(),
      prisma.session.count({
        where: { revokedAt: null, expiresAt: { gt: now } },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          displayName: true,
          email: true,
          status: true,
          createdAt: true,
          roles: { select: { role: { select: { key: true } } } },
        },
      }),
    ])

  return {
    user,
    metrics: { users, activeUsers, roles, activeSessions },
    recentUsers: recentUsers.map(recentUser => ({
      ...recentUser,
      createdAt: recentUser.createdAt.toISOString(),
      roles: recentUser.roles.map(userRole => userRole.role.key),
    })),
  }
})
