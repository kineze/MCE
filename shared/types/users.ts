export type UserStatus = 'ACTIVE' | 'DISABLED'

export interface ManagedUser {
  id: string
  email: string
  displayName: string
  status: UserStatus
  createdAt: string
  roles: string[]
  /** False for the signed-in user and for users holding permissions the viewer lacks. */
  manageable: boolean
}

export interface RoleOption {
  key: string
  name: string
  description: string | null
  /** False when the role grants permissions the viewer does not hold. */
  assignable: boolean
}

export interface UserListResponse {
  users: ManagedUser[]
  roles: RoleOption[]
  total: number
  page: number
  pageSize: number
  canManage: boolean
}

export interface UserResponse {
  user: ManagedUser
}
