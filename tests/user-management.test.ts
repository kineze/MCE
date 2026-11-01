import { describe, expect, it } from 'vitest'
import { holdsAllPermissions, roleAssignmentDenial, userManagementDenial } from '../server/services/users/rules'
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from '../server/services/users/validation'

const userManager = { id: 'manager', permissions: ['system.admin', 'users.read', 'users.manage'] }
const superAdmin = { id: 'super', permissions: ['system.admin', 'users.read', 'users.manage', 'roles.manage'] }

describe('user management rules', () => {
  it('checks that every required permission is held', () => {
    expect(holdsAllPermissions(['a', 'b'], ['a'])).toBe(true)
    expect(holdsAllPermissions(['a'], ['a', 'b'])).toBe(false)
    expect(holdsAllPermissions([], [])).toBe(true)
  })

  it('stops administrators from editing their own account', () => {
    expect(userManagementDenial(superAdmin, superAdmin)).toMatch(/your own account/)
  })

  it('stops administrators from managing users with more permissions', () => {
    expect(userManagementDenial(userManager, superAdmin)).toMatch(/permissions you do not hold/)
    expect(userManagementDenial(superAdmin, userManager)).toBeNull()
    expect(userManagementDenial(userManager, { id: 'viewer', permissions: ['users.read'] })).toBeNull()
  })

  it('stops administrators from granting roles beyond their own permissions', () => {
    const superAdminRole = { key: 'super_admin', permissions: superAdmin.permissions }
    const viewerRole = { key: 'viewer', permissions: ['users.read'] }

    expect(roleAssignmentDenial(userManager, [viewerRole, superAdminRole])).toMatch(/super_admin/)
    expect(roleAssignmentDenial(userManager, [viewerRole])).toBeNull()
    expect(roleAssignmentDenial(superAdmin, [superAdminRole])).toBeNull()
    expect(roleAssignmentDenial(userManager, [])).toBeNull()
  })
})

describe('user management validation', () => {
  it('requires a 12 character password when creating a user', () => {
    const base = { email: 'new@example.com', displayName: 'New User' }

    expect(createUserSchema.safeParse({ ...base, password: 'too short' }).success).toBe(false)
    expect(createUserSchema.safeParse({ ...base, password: 'long enough password' }).data?.roles).toEqual([])
  })

  it('rejects empty and unknown update fields', () => {
    expect(updateUserSchema.safeParse({}).success).toBe(false)
    expect(updateUserSchema.safeParse({ email: 'changed@example.com' }).success).toBe(false)
    expect(updateUserSchema.safeParse({ status: 'DISABLED' }).success).toBe(true)
    expect(updateUserSchema.safeParse({ status: 'DELETED' }).success).toBe(false)
  })

  it('defaults and bounds the list page', () => {
    expect(listUsersQuerySchema.parse({}).page).toBe(1)
    expect(listUsersQuerySchema.parse({ page: '3' }).page).toBe(3)
    expect(listUsersQuerySchema.safeParse({ page: '0' }).success).toBe(false)
  })
})
