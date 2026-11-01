import { z } from 'zod'
import { FESTIVAL_DAYS, REGISTRATION_INTERESTS } from '../../../shared/utils/festival'

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional()
  .transform(value => value === '' ? null : value)

export const registrationSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  phone: optionalText(40).refine(value => !value || /^[+\d][\d\s()-]{5,39}$/.test(value), 'Enter a valid phone number'),
  country: optionalText(80),
  organisation: optionalText(160),
  days: z.array(z.enum(FESTIVAL_DAYS)).min(1).max(FESTIVAL_DAYS.length)
    .transform(days => FESTIVAL_DAYS.filter(day => days.includes(day))),
  interests: z.array(z.enum(REGISTRATION_INTERESTS)).max(REGISTRATION_INTERESTS.length).default([])
    .transform(interests => REGISTRATION_INTERESTS.filter(interest => interests.includes(interest))),
  wantsUpdates: z.boolean().default(false),
  consent: z.literal(true),
  /** Honeypot: hidden from people, so anything here came from a bot. */
  website: z.string().max(200).optional(),
}).strict()

export type RegistrationInput = z.infer<typeof registrationSchema>

export const listRegistrationsQuerySchema = z.object({
  q: z.string().trim().max(160).optional(),
  day: z.enum(FESTIVAL_DAYS).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
})

export const registrationIdSchema = z.string().uuid()

/** Turns the first validation issue into a message a visitor can act on. */
export function registrationValidationMessage(error: z.ZodError): string {
  const field = String(error.issues[0]?.path[0] ?? '')
  const messages: Record<string, string> = {
    fullName: 'Enter your full name',
    email: 'Enter a valid email address',
    phone: 'Enter a valid phone number, or leave it blank',
    country: 'Country must be 80 characters or fewer',
    organisation: 'Organisation must be 160 characters or fewer',
    days: 'Choose at least one day you plan to attend',
    interests: 'Choose interests from the list',
    consent: 'Please agree to us storing your details so we can manage your registration',
  }
  return messages[field] ?? 'Please check your details and try again'
}
