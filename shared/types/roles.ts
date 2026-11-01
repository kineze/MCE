export interface ManagedRole {
  id: string
  key: string
  name: string
  description: string | null
  isSystem: boolean
  permissions: string[]
  userCount: number
  /** Why the viewer cannot edit or delete this role, or null when they can. */
  lockedReason: string | null
}

export interface PermissionOption {
  key: string
  description: string | null
  /** False when the viewer does not hold this permission and so cannot grant it. */
  grantable: boolean
}

export interface RoleListResponse {
  roles: ManagedRole[]
  permissions: PermissionOption[]
  canManage: boolean
}

export interface RoleResponse {
  role: ManagedRole
}
