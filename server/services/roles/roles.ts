import { createError } from 'h3'
import { Prisma } from '../../../app/generated/prisma/client'
import type { AuthenticatedUser } from '../../../shared/types/auth'
import type { ManagedRole, RoleListResponse } from '../../../shared/types/roles'
import { prisma } from '../../utils/prisma'
import { permissionGrantDenial, roleManagementDenial } from './rules'
import type { CreateRoleInput, UpdateRoleInput } from './validation'

const roleWithPermissions = {
  permissions: { include: { permission: true } },
  _count: { select: { users: true } },
} satisfies Prisma.RoleInclude

type RoleWithPermissions = Prisma.RoleGetPayload<{ include: typeof roleWithPermissions }>

function permissionsOf(role: RoleWithPermissions): string[] {
  return role.permissions.map(rolePermission => rolePermission.permission.key).sort()
}

function toManagedRole(role: RoleWithPermissions, actor: AuthenticatedUser): ManagedRole {
  const permissions = permissionsOf(role)
  return {
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissions,
    userCount: role._count.users,
    lockedReason: roleManagementDenial(actor, { key: role.key, isSystem: role.isSystem, permissions }),
  }
}

function forbidden(statusMessage: string): never {
  throw createError({ statusCode: 403, statusMessage })
}

/** Loads the requested permissions, rejecting unknown keys and ones the actor may not grant. */
async function resolveGrantablePermissions(
  actor: AuthenticatedUser,
  permissionKeys: readonly string[],
): Promise<string[]> {
  const keys = [...new Set(permissionKeys)]
  const permissions = await prisma.permission.findMany({
    where: { key: { in: keys } },
    select: { id: true, key: true },
  })

  const unknown = keys.filter(key => !permissions.some(permission => permission.key === key))
  if (unknown.length > 0) {
    throw createError({
      statusCode: 422,
      statusMessage: `Unknown permission: ${unknown.join(', ')}`,
    })
  }

  const denial = permissionGrantDenial(actor, keys)
  if (denial) {
    forbidden(denial)
  }

  return permissions.map(permission => permission.id)
}

async function findManageableRole(actor: AuthenticatedUser, roleId: string): Promise<RoleWithPermissions> {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: roleWithPermissions,
  })

  if (!role) {
    throw createError({ statusCode: 404, statusMessage: 'Role not found' })
  }

  const denial = roleManagementDenial(actor, {
    key: role.key,
    isSystem: role.isSystem,
    permissions: permissionsOf(role),
  })
  if (denial) {
    forbidden(denial)
  }

  return role
}

export async function listRoles(actor: AuthenticatedUser): Promise<RoleListResponse> {
  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({
      include: roleWithPermissions,
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    }),
    prisma.permission.findMany({ orderBy: { key: 'asc' } }),
  ])

  return {
    roles: roles.map(role => toManagedRole(role, actor)),
    permissions: permissions.map(permission => ({
      key: permission.key,
      description: permission.description,
      grantable: actor.permissions.includes(permission.key),
    })),
    canManage: actor.permissions.includes('roles.manage'),
  }
}

export async function createRole(actor: AuthenticatedUser, input: CreateRoleInput): Promise<ManagedRole> {
  const permissionIds = await resolveGrantablePermissions(actor, input.permissions)

  try {
    const role = await prisma.role.create({
      data: {
        key: input.key,
        name: input.name,
        description: input.description ?? null,
        permissions: {
          create: permissionIds.map(permissionId => ({ permissionId })),
        },
      },
      include: roleWithPermissions,
    })

    return toManagedRole(role, actor)
  }
  catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'A role with this key already exists' })
    }

    throw error
  }
}

export async function updateRole(
  actor: AuthenticatedUser,
  roleId: string,
  input: UpdateRoleInput,
): Promise<ManagedRole> {
  await findManageableRole(actor, roleId)
  const permissionIds = input.permissions
    ? await resolveGrantablePermissions(actor, input.permissions)
    : undefined

  const role = await prisma.$transaction(async (transaction) => {
    if (permissionIds) {
      await transaction.rolePermission.deleteMany({
        where: { roleId, permissionId: { notIn: permissionIds } },
      })
      await transaction.rolePermission.createMany({
        data: permissionIds.map(permissionId => ({ roleId, permissionId })),
        skipDuplicates: true,
      })
    }

    return transaction.role.update({
      where: { id: roleId },
      data: {
        name: input.name,
        description: input.description,
      },
      include: roleWithPermissions,
    })
  })

  return toManagedRole(role, actor)
}

export async function deleteRole(actor: AuthenticatedUser, roleId: string): Promise<void> {
  const role = await findManageableRole(actor, roleId)
  if (role._count.users > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `Remove this role from its ${role._count.users} ${role._count.users === 1 ? 'user' : 'users'} before deleting it`,
    })
  }

  await prisma.role.delete({ where: { id: roleId } })
}
