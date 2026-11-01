import { z } from 'zod'

const roleKeys = z.array(z.string().trim().min(1).max(80)).max(20)

export const listUsersQuerySchema = z.object({
  q: z.string().trim().max(160).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
})

export const createUserSchema = z.object({
  email: z.string().trim().email().max(320),
  displayName: z.string().trim().min(2).max(160),
  password: z.string().min(12).max(128),
  roles: roleKeys.default([]),
}).strict()

export const updateUserSchema = z.object({
  displayName: z.string().trim().min(2).max(160).optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  password: z.string().min(12).max(128).optional(),
  roles: roleKeys.optional(),
}).strict().refine(
  input => Object.values(input).some(value => value !== undefined),
  { message: 'Provide at least one field to change' },
)

export const userIdSchema = z.string().uuid()

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
