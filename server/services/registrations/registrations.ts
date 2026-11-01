import { createError } from 'h3'
import { Prisma } from '../../../app/generated/prisma/client'
import type { AuthenticatedUser } from '../../../shared/types/auth'
import type { RegistrationListResponse, RegistrationRecord } from '../../../shared/types/registrations'
import { FESTIVAL_DAYS, REGISTRATION_INTEREST_LABELS, formatFestivalDay } from '../../../shared/utils/festival'
import type { RegistrationInterest } from '../../../shared/utils/festival'
import { FixedWindowRateLimiter } from '../auth/rate-limit'
import { normalizeEmail } from '../auth/validation'
import { prisma } from '../../utils/prisma'
import { brevoConfig, sendEmail } from '../email/brevo'
import { registrationConfirmationEmail, siteUrl } from './confirmation-email'
import { toCsv } from './csv'
import type { RegistrationInput } from './validation'

export const REGISTRATION_PAGE_SIZE = 50

/** Ten submissions per IP address per hour. */
export const registrationRateLimiter = new FixedWindowRateLimiter(10, 60 * 60 * 1000)

type RegistrationRow = Prisma.RegistrationGetPayload<object>

function toRecord(registration: RegistrationRow): RegistrationRecord {
  return {
    id: registration.id,
    fullName: registration.fullName,
    email: registration.email,
    phone: registration.phone,
    country: registration.country,
    organisation: registration.organisation,
    days: registration.days,
    interests: registration.interests,
    wantsUpdates: registration.wantsUpdates,
    confirmationSentAt: registration.confirmationSentAt?.toISOString() ?? null,
    confirmationError: registration.confirmationError,
    createdAt: registration.createdAt.toISOString(),
  }
}

/**
 * Stores a registration and returns its id. An email that is already registered is left
 * unchanged and null is returned; the caller reports success either way, so the form cannot
 * reveal or overwrite registrations.
 */
export async function createRegistration(input: RegistrationInput): Promise<string | null> {
  const email = normalizeEmail(input.email)
  const existing = await prisma.registration.findUnique({ where: { email }, select: { id: true } })
  if (existing) return null

  try {
    const registration = await prisma.registration.create({
      data: {
        fullName: input.fullName,
        email,
        phone: input.phone ?? null,
        country: input.country ?? null,
        organisation: input.organisation ?? null,
        days: input.days,
        interests: input.interests,
        wantsUpdates: input.wantsUpdates,
        consentedAt: new Date(),
      },
      select: { id: true },
    })
    return registration.id
  }
  catch (error: unknown) {
    // Two submissions for the same email at once: the first one wins.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return null
    throw error
  }
}

/**
 * Sends the thank-you email for a registration and records the outcome. Never throws for
 * delivery problems, so a Brevo outage cannot break registration.
 */
export async function sendRegistrationConfirmation(registrationId: string): Promise<{ sent: boolean, error: string | null }> {
  const registration = await prisma.registration.findUnique({ where: { id: registrationId } })
  if (!registration) {
    throw createError({ statusCode: 404, statusMessage: 'Registration not found' })
  }

  const message = registrationConfirmationEmail(registration, {
    siteUrl: siteUrl(),
    canReply: Boolean(brevoConfig()?.replyTo),
  })
  const result = await sendEmail(message)

  if (result.sent) {
    await prisma.registration.update({
      where: { id: registrationId },
      data: { confirmationSentAt: new Date(), confirmationError: null },
    })
    return { sent: true, error: null }
  }

  console.warn(`[registrations] Thank-you email not sent for ${registrationId}: ${result.error}`)
  await prisma.registration.update({
    where: { id: registrationId },
    data: { confirmationError: result.error.slice(0, 500) },
  })
  return { sent: false, error: result.error }
}

export async function listRegistrations(
  actor: AuthenticatedUser,
  options: { q?: string, day?: string, page: number },
): Promise<RegistrationListResponse> {
  const where: Prisma.RegistrationWhereInput = {
    ...(options.day ? { days: { has: options.day } } : {}),
    ...(options.q
      ? {
          OR: [
            { fullName: { contains: options.q, mode: 'insensitive' } },
            { email: { contains: options.q, mode: 'insensitive' } },
            { organisation: { contains: options.q, mode: 'insensitive' } },
            { country: { contains: options.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const [registrations, total, all, wantsUpdates, dayCounts] = await Promise.all([
    prisma.registration.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (options.page - 1) * REGISTRATION_PAGE_SIZE,
      take: REGISTRATION_PAGE_SIZE,
    }),
    prisma.registration.count({ where }),
    prisma.registration.count(),
    prisma.registration.count({ where: { wantsUpdates: true } }),
    Promise.all(FESTIVAL_DAYS.map(day => prisma.registration.count({ where: { days: { has: day } } }))),
  ])

  return {
    registrations: registrations.map(toRecord),
    total,
    page: options.page,
    pageSize: REGISTRATION_PAGE_SIZE,
    totals: {
      all,
      wantsUpdates,
      byDay: Object.fromEntries(FESTIVAL_DAYS.map((day, index) => [day, dayCounts[index] ?? 0])),
    },
    canManage: actor.permissions.includes('registrations.manage'),
  }
}

/** Every registration as CSV, oldest first. */
export async function exportRegistrationsCsv(): Promise<string> {
  const registrations = await prisma.registration.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] })

  return toCsv([
    ['Name', 'Email', 'Phone', 'Country', 'Organisation', 'Days', 'Interests', 'Wants updates', 'Registered at (UTC)', 'Thank-you email sent (UTC)'],
    ...registrations.map(registration => [
      registration.fullName,
      registration.email,
      registration.phone,
      registration.country,
      registration.organisation,
      registration.days.map(day => formatFestivalDay(day, 'short')).join('; '),
      registration.interests.map(interest => REGISTRATION_INTEREST_LABELS[interest as RegistrationInterest] ?? interest).join('; '),
      registration.wantsUpdates ? 'Yes' : 'No',
      registration.createdAt.toISOString(),
      registration.confirmationSentAt?.toISOString() ?? '',
    ]),
  ])
}

export async function deleteRegistration(registrationId: string): Promise<void> {
  const { count } = await prisma.registration.deleteMany({ where: { id: registrationId } })
  if (count === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Registration not found' })
  }
}
