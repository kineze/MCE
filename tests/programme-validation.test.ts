import { describe, expect, it } from 'vitest'
import { createSessionSchema, sessionValidationMessage, updateSessionSchema } from '../server/services/programme/validation'

const valid = {
  title: 'Prime Time — Aysha Basith',
  kind: 'PERFORMANCE',
  venueId: '7d0c9a52-6a43-4c55-9d33-2f7c1c1e4b10',
  date: '2026-12-04',
  startTime: '19:30',
  endTime: '21:30',
}

describe('programme session validation', () => {
  it('accepts a session and defaults it to an unpublished draft', () => {
    const parsed = createSessionSchema.parse(valid)
    expect(parsed.published).toBe(false)
    expect(parsed.highlight).toBe(false)
  })

  it('requires the session to end after it starts', () => {
    const parsed = createSessionSchema.safeParse({ ...valid, endTime: '19:00' })
    expect(parsed.success).toBe(false)
    expect(sessionValidationMessage(parsed.error!)).toBe('The session must end after it starts')
  })

  it('stores blank optional text as null', () => {
    expect(createSessionSchema.parse({ ...valid, notes: '', people: '  ' }).people).toBeNull()
  })

  it('only changes times when date, start and end arrive together', () => {
    expect(updateSessionSchema.safeParse({ startTime: '18:00' }).success).toBe(false)
    expect(updateSessionSchema.safeParse({ date: '2026-12-04', startTime: '18:00', endTime: '19:00' }).success).toBe(true)
    expect(updateSessionSchema.safeParse({ published: true }).success).toBe(true)
  })

  it('rejects empty updates and unknown fields', () => {
    expect(updateSessionSchema.safeParse({}).success).toBe(false)
    expect(updateSessionSchema.safeParse({ status: 'CONFIRMED' }).success).toBe(false)
  })

  it('names the field that needs fixing', () => {
    const parsed = createSessionSchema.safeParse({ ...valid, title: 'x' })
    expect(sessionValidationMessage(parsed.error!)).toBe('Enter a title of at least 2 characters')
  })
})
