// Rules that keep the role manager from becoming privilege escalation or a way
// to lock administrators out.
import { holdsAllPermissions } from '../users/rules'

export interface RoleActor {
  roles: readonly string[]
  permissions: readonly string[]
}

export interface RoleTarget {
  key: string
  isSystem: boolean
  permissions: readonly string[]
}

/** Returns why `actor` may not edit or delete `role`, or null when it may. */
export function roleManagementDenial(actor: RoleActor, role: RoleTarget): string | null {
  if (role.isSystem) {
    return 'System roles cannot be changed'
  }

  if (actor.roles.includes(role.key)) {
    return 'You cannot change a role you hold'
  }

  if (!holdsAllPermissions(actor.permissions, role.permissions)) {
    return 'This role has permissions you do not hold'
  }

  return null
}

/** Returns why `actor` may not grant `permissions` to a role, or null when it may. */
export function permissionGrantDenial(actor: RoleActor, permissions: readonly string[]): string | null {
  const blocked = permissions.filter(permission => !actor.permissions.includes(permission))
  return blocked.length > 0
    ? `You cannot grant permissions you do not hold: ${blocked.join(', ')}`
    : null
}
