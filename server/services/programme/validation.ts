import { z } from 'zod'
import { SESSION_KINDS } from '../../../shared/utils/festival'

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional()
  .transform(value => value === '' ? null : value)

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)

const sessionFields = {
  title: z.string().trim().min(2).max(200),
  description: optionalText(2000),
  kind: z.enum(SESSION_KINDS),
  venueId: z.string().uuid(),
  date,
  startTime: time,
  endTime: time,
  people: optionalText(500),
  moderator: optionalText(160),
  highlight: z.boolean(),
  published: z.boolean(),
  notes: optionalText(2000),
}

const endsAfterStart = (input: { startTime?: string, endTime?: string }) =>
  !input.startTime || !input.endTime || input.endTime > input.startTime

export const createSessionSchema = z.object({
  ...sessionFields,
  highlight: sessionFields.highlight.default(false),
  published: sessionFields.published.default(false),
}).strict().refine(endsAfterStart, { message: 'The session must end after it starts' })

export const updateSessionSchema = z.object(sessionFields).partial().strict()
  .refine(
    input => [input.date, input.startTime, input.endTime].every(value => value === undefined)
      || [input.date, input.startTime, input.endTime].every(value => value !== undefined),
    { message: 'Send date, start time and end time together' },
  )
  .refine(endsAfterStart, { message: 'The session must end after it starts' })
  .refine(input => Object.values(input).some(value => value !== undefined), { message: 'Provide at least one field to change' })

export const sessionIdSchema = z.string().uuid()

export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>

/** Turns the first validation issue into a message an editor can act on. */
export function sessionValidationMessage(error: z.ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Check the session details'
  if (issue.code === 'custom') return issue.message
  const field = String(issue.path[0] ?? 'session')
  const labels: Record<string, string> = {
    title: 'Enter a title of at least 2 characters',
    venueId: 'Choose a venue',
    date: 'Choose a date',
    startTime: 'Enter a start time',
    endTime: 'Enter an end time',
    kind: 'Choose a session type',
  }
  return labels[field] ?? `Check the ${field} field`
}
