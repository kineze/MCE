import { describe, expect, it } from 'vitest'
import { permissionGrantDenial, roleManagementDenial } from '../server/services/roles/rules'
import { createRoleSchema, updateRoleSchema } from '../server/services/roles/validation'

const roleManager = { roles: ['role_manager'], permissions: ['system.admin', 'roles.read', 'roles.manage', 'users.read'] }

describe('role management rules', () => {
  it('locks system roles', () => {
    expect(roleManagementDenial(roleManager, { key: 'super_admin', isSystem: true, permissions: [] })).toMatch(/System roles/)
  })

  it('stops administrators from changing a role they hold', () => {
    expect(roleManagementDenial(roleManager, { key: 'role_manager', isSystem: false, permissions: ['roles.read'] })).toMatch(/role you hold/)
  })

  it('stops administrators from changing roles with more permissions', () => {
    expect(roleManagementDenial(roleManager, { key: 'admin', isSystem: false, permissions: ['users.manage'] })).toMatch(/permissions you do not hold/)
    expect(roleManagementDenial(roleManager, { key: 'viewer', isSystem: false, permissions: ['users.read'] })).toBeNull()
  })

  it('only allows granting permissions the administrator holds', () => {
    expect(permissionGrantDenial(roleManager, ['users.read', 'users.manage', 'settings.manage'])).toMatch(/users\.manage, settings\.manage/)
    expect(permissionGrantDenial(roleManager, ['users.read'])).toBeNull()
    expect(permissionGrantDenial(roleManager, [])).toBeNull()
  })
})

describe('role validation', () => {
  it('requires a lowercase key', () => {
    const base = { name: 'Support team' }

    expect(createRoleSchema.safeParse({ ...base, key: 'support_team' }).data?.permissions).toEqual([])
    expect(createRoleSchema.safeParse({ ...base, key: 'Support Team' }).success).toBe(false)
    expect(createRoleSchema.safeParse({ ...base, key: '1support' }).success).toBe(false)
  })

  it('stores an empty description as null and rejects key changes', () => {
    expect(updateRoleSchema.parse({ description: '' }).description).toBeNull()
    expect(updateRoleSchema.safeParse({ key: 'renamed' }).success).toBe(false)
    expect(updateRoleSchema.safeParse({}).success).toBe(false)
  })
})
