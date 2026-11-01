import { z } from 'zod'

const permissionKeys = z.array(z.string().trim().min(1).max(120)).max(200)
const description = z.string().trim().max(500).nullable().optional()
  .transform(value => value === '' ? null : value)

export const ROLE_KEY_PATTERN = /^[a-z][a-z0-9_]{1,79}$/

export const createRoleSchema = z.object({
  key: z.string().trim().regex(ROLE_KEY_PATTERN),
  name: z.string().trim().min(2).max(120),
  description,
  permissions: permissionKeys.default([]),
}).strict()

export const updateRoleSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description,
  permissions: permissionKeys.optional(),
}).strict().refine(
  input => Object.values(input).some(value => value !== undefined),
  { message: 'Provide at least one field to change' },
)

export const roleIdSchema = z.string().uuid()

export type CreateRoleInput = z.infer<typeof createRoleSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
