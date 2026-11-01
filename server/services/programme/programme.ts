import { createError } from 'h3'
import type { Prisma } from '../../../app/generated/prisma/client'
import type { AuthenticatedUser } from '../../../shared/types/auth'
import type { AdminProgrammeResponse, AdminSession, PublicProgrammeResponse, PublicSession } from '../../../shared/types/programme'
import { colomboToDate } from '../../../shared/utils/festival'
import { prisma } from '../../utils/prisma'
import type { CreateSessionInput, UpdateSessionInput } from './validation'

const withVenue = { venue: true } satisfies Prisma.ProgrammeSessionInclude
type SessionWithVenue = Prisma.ProgrammeSessionGetPayload<{ include: typeof withVenue }>

function toPublicSession(session: SessionWithVenue): PublicSession {
  return {
    id: session.id,
    title: session.title,
    description: session.description,
    kind: session.kind,
    startsAt: session.startsAt.toISOString(),
    endsAt: session.endsAt.toISOString(),
    people: session.people,
    moderator: session.moderator,
    highlight: session.highlight,
    venue: { id: session.venue.id, slug: session.venue.slug, name: session.venue.name },
  }
}

function toAdminSession(session: SessionWithVenue): AdminSession {
  return {
    ...toPublicSession(session),
    published: session.published,
    notes: session.notes,
    updatedAt: session.updatedAt.toISOString(),
  }
}

async function assertVenueExists(venueId: string): Promise<void> {
  const venue = await prisma.venue.findUnique({ where: { id: venueId }, select: { id: true } })
  if (!venue) {
    throw createError({ statusCode: 422, statusMessage: 'Choose a venue from the list' })
  }
}

function notFound(): never {
  throw createError({ statusCode: 404, statusMessage: 'Session not found' })
}

/** Published sessions only, without internal notes. */
export async function listPublicProgramme(): Promise<PublicProgrammeResponse> {
  const sessions = await prisma.programmeSession.findMany({
    where: { published: true },
    include: withVenue,
    orderBy: [{ startsAt: 'asc' }, { venue: { sortOrder: 'asc' } }],
  })

  return { sessions: sessions.map(toPublicSession) }
}

export async function listAdminProgramme(actor: AuthenticatedUser): Promise<AdminProgrammeResponse> {
  const [sessions, venues] = await Promise.all([
    prisma.programmeSession.findMany({
      include: withVenue,
      orderBy: [{ startsAt: 'asc' }, { venue: { sortOrder: 'asc' } }],
    }),
    prisma.venue.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
  ])

  return {
    sessions: sessions.map(toAdminSession),
    venues: venues.map(venue => ({ id: venue.id, slug: venue.slug, name: venue.name })),
    canManage: actor.permissions.includes('programme.manage'),
  }
}

export async function createSession(input: CreateSessionInput): Promise<AdminSession> {
  await assertVenueExists(input.venueId)

  const session = await prisma.programmeSession.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      kind: input.kind,
      venueId: input.venueId,
      startsAt: colomboToDate(input.date, input.startTime),
      endsAt: colomboToDate(input.date, input.endTime),
      people: input.people ?? null,
      moderator: input.moderator ?? null,
      highlight: input.highlight,
      published: input.published,
      notes: input.notes ?? null,
    },
    include: withVenue,
  })

  return toAdminSession(session)
}

export async function updateSession(sessionId: string, input: UpdateSessionInput): Promise<AdminSession> {
  const existing = await prisma.programmeSession.findUnique({ where: { id: sessionId } })
  if (!existing) notFound()
  if (input.venueId) await assertVenueExists(input.venueId)

  const times = input.date && input.startTime && input.endTime
    ? { startsAt: colomboToDate(input.date, input.startTime), endsAt: colomboToDate(input.date, input.endTime) }
    : {}

  const session = await prisma.programmeSession.update({
    where: { id: sessionId },
    data: {
      title: input.title,
      description: input.description,
      kind: input.kind,
      venueId: input.venueId,
      ...times,
      people: input.people,
      moderator: input.moderator,
      highlight: input.highlight,
      published: input.published,
      notes: input.notes,
    },
    include: withVenue,
  })

  return toAdminSession(session)
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { count } = await prisma.programmeSession.deleteMany({ where: { id: sessionId } })
  if (count === 0) notFound()
}
