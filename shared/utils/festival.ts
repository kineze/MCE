// Festival dates and Colombo-local time helpers, shared by the server, admin and public pages.
// Sri Lanka uses a fixed UTC+05:30 offset with no daylight saving, so a constant offset is safe.

export const FESTIVAL_TIME_ZONE = 'Asia/Colombo'
export const FESTIVAL_UTC_OFFSET = '+05:30'

/** Public festival days (the 7 December debrief is internal). */
export const FESTIVAL_DAYS = [
  '2026-12-01',
  '2026-12-02',
  '2026-12-03',
  '2026-12-04',
  '2026-12-05',
  '2026-12-06',
] as const

export const SESSION_KINDS = ['PERFORMANCE', 'PANEL', 'CONVERSATION', 'WORKSHOP', 'FILM', 'COMMUNITY', 'OTHER'] as const
export type SessionKind = typeof SESSION_KINDS[number]

export const SESSION_KIND_LABELS: Record<SessionKind, string> = {
  PERFORMANCE: 'Performance',
  PANEL: 'Panel',
  CONVERSATION: 'In conversation',
  WORKSHOP: 'Workshop',
  FILM: 'Film',
  COMMUNITY: 'Community',
  OTHER: 'Other',
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

/** Converts a Colombo calendar date and 24-hour time ("2026-12-02", "19:30") to a UTC Date. */
export function colomboToDate(date: string, time: string): Date {
  if (!DATE_PATTERN.test(date) || !TIME_PATTERN.test(time)) {
    throw new RangeError(`Invalid Colombo date or time: ${date} ${time}`)
  }

  const value = new Date(`${date}T${time}:00${FESTIVAL_UTC_OFFSET}`)
  // Date rolls impossible days over (30 February becomes 2 March), so check the round trip.
  if (Number.isNaN(value.getTime()) || colomboDateKey(value) !== date) {
    throw new RangeError(`Invalid Colombo date or time: ${date} ${time}`)
  }

  return value
}

function parts(value: Date | string): Record<string, string> {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    timeZone: FESTIVAL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value))
  return Object.fromEntries(formatted.map(part => [part.type, part.value]))
}

/** The Colombo calendar date ("2026-12-02") of an instant. */
export function colomboDateKey(value: Date | string): string {
  const { year, month, day } = parts(value)
  return `${year}-${month}-${day}`
}

/** The Colombo 24-hour time ("19:30") of an instant, for form inputs. */
export function colomboTimeValue(value: Date | string): string {
  const { hour, minute } = parts(value)
  return `${hour}:${minute}`
}

/** A short Colombo time for display, e.g. "7:30 pm". */
export function formatColomboTime(value: Date | string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: FESTIVAL_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value)).replace(/\s/g, ' ')
}

/** A day heading for a Colombo date key, e.g. "Wednesday 2 December". */
export function formatFestivalDay(dateKey: string, style: 'long' | 'short' = 'long'): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    weekday: style,
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
  }).format(new Date(`${dateKey}T00:00:00Z`))
}

/** First programme session (1 December, 10:00) and the end of the closing concert (6 December, 21:30). */
export const FESTIVAL_STARTS_AT = '2026-12-01T10:00:00+05:30'
export const FESTIVAL_ENDS_AT = '2026-12-06T21:30:00+05:30'

export type FestivalPhase = 'upcoming' | 'live' | 'ended'

export interface Countdown {
  phase: FestivalPhase
  days: number
  hours: number
  minutes: number
  seconds: number
}

/** Time remaining until the festival starts, or which phase it is in once it has. */
export function festivalCountdown(now: number | Date): Countdown {
  const current = new Date(now).getTime()
  const start = new Date(FESTIVAL_STARTS_AT).getTime()
  const end = new Date(FESTIVAL_ENDS_AT).getTime()

  if (current >= end) return { phase: 'ended', days: 0, hours: 0, minutes: 0, seconds: 0 }
  if (current >= start) return { phase: 'live', days: 0, hours: 0, minutes: 0, seconds: 0 }

  const totalSeconds = Math.floor((start - current) / 1000)
  return {
    phase: 'upcoming',
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  }
}

/** Session kinds a visitor can say they are interested in when registering. */
export const REGISTRATION_INTERESTS = ['PERFORMANCE', 'PANEL', 'WORKSHOP', 'FILM'] as const
export type RegistrationInterest = typeof REGISTRATION_INTERESTS[number]

export const REGISTRATION_INTEREST_LABELS: Record<RegistrationInterest, string> = {
  PERFORMANCE: 'Concerts and performances',
  PANEL: 'Panels and conversations',
  WORKSHOP: 'Workshops',
  FILM: 'Films',
}
