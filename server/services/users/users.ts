import { createError } from 'h3'
import { Prisma } from '../../../app/generated/prisma/client'
import type { AuthenticatedUser } from '../../../shared/types/auth'
import type { ManagedUser, RoleOption, UserListResponse } from '../../../shared/types/users'
import { hashPassword } from '../auth/password'
import { normalizeEmail } from '../auth/validation'
import { prisma } from '../../utils/prisma'
import { holdsAllPermissions, roleAssignmentDenial, userManagementDenial } from './rules'
import type { CreateUserInput, UpdateUserInput } from './validation'

export const USER_PAGE_SIZE = 25

const userWithPermissions = {
  roles: {
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  },
} satisfies Prisma.UserInclude

type UserWithPermissions = Prisma.UserGetPayload<{ include: typeof userWithPermissions }>

function permissionsOf(user: UserWithPermissions): string[] {
  return [...new Set(user.roles.flatMap(userRole =>
    userRole.role.permissions.map(rolePermission => rolePermission.permission.key),
  ))]
}

function toManagedUser(user: UserWithPermissions, actor: AuthenticatedUser): ManagedUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    roles: user.roles.map(userRole => userRole.role.key),
    manageable: userManagementDenial(actor, { id: user.id, permissions: permissionsOf(user) }) === null,
  }
}

function forbidden(statusMessage: string): never {
  throw createError({ statusCode: 403, statusMessage })
}

/** Loads the requested roles, rejecting unknown keys and roles the actor may not grant. */
async function resolveAssignableRoles(
  actor: AuthenticatedUser,
  roleKeys: readonly string[],
): Promise<Array<{ id: string, key: string }>> {
  const keys = [...new Set(roleKeys)]
  const roles = await prisma.role.findMany({
    where: { key: { in: keys } },
    include: { permissions: { include: { permission: true } } },
  })

  const unknown = keys.filter(key => !roles.some(role => role.key === key))
  if (unknown.length > 0) {
    throw createError({
      statusCode: 422,
      statusMessage: `Unknown role: ${unknown.join(', ')}`,
    })
  }

  const denial = roleAssignmentDenial(actor, roles.map(role => ({
    key: role.key,
    permissions: role.permissions.map(rolePermission => rolePermission.permission.key),
  })))
  if (denial) {
    forbidden(denial)
  }

  return roles.map(role => ({ id: role.id, key: role.key }))
}

async function findManageableUser(actor: AuthenticatedUser, userId: string): Promise<UserWithPermissions> {
  const target = await prisma.user.findUnique({
    where: { id: userId },
    include: userWithPermissions,
  })

  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const denial = userManagementDenial(actor, { id: target.id, permissions: permissionsOf(target) })
  if (denial) {
    forbidden(denial)
  }

  return target
}

export async function listUsers(
  actor: AuthenticatedUser,
  options: { q?: string, page: number },
): Promise<UserListResponse> {
  const where: Prisma.UserWhereInput = options.q
    ? {
        OR: [
          { email: { contains: options.q, mode: 'insensitive' } },
          { displayName: { contains: options.q, mode: 'insensitive' } },
        ],
      }
    : {}

  const [users, total, roles] = await Promise.all([
    prisma.user.findMany({
      where,
      include: userWithPermissions,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (options.page - 1) * USER_PAGE_SIZE,
      take: USER_PAGE_SIZE,
    }),
    prisma.user.count({ where }),
    prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    }),
  ])

  return {
    users: users.map(user => toManagedUser(user, actor)),
    roles: roles.map((role): RoleOption => ({
      key: role.key,
      name: role.name,
      description: role.description,
      assignable: holdsAllPermissions(
        actor.permissions,
        role.permissions.map(rolePermission => rolePermission.permission.key),
      ),
    })),
    total,
    page: options.page,
    pageSize: USER_PAGE_SIZE,
    canManage: actor.permissions.includes('users.manage'),
  }
}

export async function createUser(actor: AuthenticatedUser, input: CreateUserInput): Promise<ManagedUser> {
  const email = normalizeEmail(input.email)
  const roles = await resolveAssignableRoles(actor, input.roles)
  const passwordHash = await hashPassword(input.password)

  try {
    const user = await prisma.user.create({
      data: {
        email,
        displayName: input.displayName,
        passwordHash,
        roles: {
          create: roles.map(role => ({ roleId: role.id, assignedById: actor.id })),
        },
      },
      include: userWithPermissions,
    })

    return toManagedUser(user, actor)
  }
  catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'A user with this email already exists' })
    }

    throw error
  }
}

export async function updateUser(
  actor: AuthenticatedUser,
  userId: string,
  input: UpdateUserInput,
): Promise<ManagedUser> {
  await findManageableUser(actor, userId)
  const roles = input.roles ? await resolveAssignableRoles(actor, input.roles) : undefined
  const passwordHash = input.password ? await hashPassword(input.password) : undefined
  const signOut = input.status === 'DISABLED' || passwordHash !== undefined
  const now = new Date()

  const user = await prisma.$transaction(async (transaction) => {
    if (roles) {
      const roleIds = roles.map(role => role.id)
      await transaction.userRole.deleteMany({
        where: { userId, roleId: { notIn: roleIds } },
      })
      await transaction.userRole.createMany({
        data: roleIds.map(roleId => ({ userId, roleId, assignedById: actor.id })),
        skipDuplicates: true,
      })
    }

    if (signOut) {
      await transaction.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      })
    }

    return transaction.user.update({
      where: { id: userId },
      data: {
        displayName: input.displayName,
        status: input.status,
        ...(passwordHash ? { passwordHash, passwordChangedAt: now } : {}),
      },
      include: userWithPermissions,
    })
  })

  return toManagedUser(user, actor)
}
