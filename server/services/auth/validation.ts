import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(128),
}).strict()

export const administratorSchema = z.object({
  email: z.string().trim().email().max(320),
  displayName: z.string().trim().min(2).max(160),
  password: z.string().min(12).max(128),
}).strict()

export function normalizeEmail(email: string): string {
  return email.trim().toLocaleLowerCase('en-US')
}
