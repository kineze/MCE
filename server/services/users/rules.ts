// Rules that stop user management from becoming privilege escalation: an
// administrator can only act on users and grant roles within their own permissions.

export interface PermissionHolder {
  id: string
  permissions: readonly string[]
}

export function holdsAllPermissions(
  heldPermissions: readonly string[],
  requiredPermissions: Iterable<string>,
): boolean {
  const held = new Set(heldPermissions)
  for (const permission of requiredPermissions) {
    if (!held.has(permission)) {
      return false
    }
  }

  return true
}

/** Returns why `actor` may not manage `target`, or null when it may. */
export function userManagementDenial(
  actor: PermissionHolder,
  target: PermissionHolder,
): string | null {
  if (actor.id === target.id) {
    return 'You cannot change your own account from user management'
  }

  if (!holdsAllPermissions(actor.permissions, target.permissions)) {
    return 'This user has permissions you do not hold'
  }

  return null
}

/** Returns why `actor` may not grant `roles`, or null when it may grant all of them. */
export function roleAssignmentDenial(
  actor: PermissionHolder,
  roles: ReadonlyArray<{ key: string, permissions: readonly string[] }>,
): string | null {
  const blocked = roles.find(role => !holdsAllPermissions(actor.permissions, role.permissions))
  return blocked
    ? `You cannot assign the ${blocked.key} role because it grants permissions you do not hold`
    : null
}
