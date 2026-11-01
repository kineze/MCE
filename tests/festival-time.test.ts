import { describe, expect, it } from 'vitest'
import { colomboDateKey, colomboTimeValue, colomboToDate, festivalCountdown, formatColomboTime, formatFestivalDay } from '../shared/utils/festival'

describe('festival time helpers', () => {
  it('converts Colombo local time to UTC', () => {
    expect(colomboToDate('2026-12-02', '19:30').toISOString()).toBe('2026-12-02T14:00:00.000Z')
    expect(colomboToDate('2026-12-01', '00:15').toISOString()).toBe('2026-11-30T18:45:00.000Z')
  })

  it('round-trips through Colombo date and time', () => {
    const instant = colomboToDate('2026-12-06', '21:30')
    expect(colomboDateKey(instant)).toBe('2026-12-06')
    expect(colomboTimeValue(instant)).toBe('21:30')
  })

  it('keeps early-morning Colombo times on the Colombo date', () => {
    expect(colomboDateKey('2026-11-30T18:45:00.000Z')).toBe('2026-12-01')
  })

  it('rejects malformed input', () => {
    expect(() => colomboToDate('2026-12-2', '19:30')).toThrow(RangeError)
    expect(() => colomboToDate('2026-12-02', '24:00')).toThrow(RangeError)
    expect(() => colomboToDate('2026-02-30', '10:00')).toThrow(RangeError)
  })

  it('formats times and day headings for display', () => {
    expect(formatColomboTime('2026-12-02T14:00:00.000Z')).toBe('7:30 pm')
    expect(formatFestivalDay('2026-12-02')).toBe('Wednesday 2 December')
    expect(formatFestivalDay('2026-12-02', 'short')).toBe('Wed 2 Dec')
  })
})

describe('festival countdown', () => {
  it('counts down to the first session in Colombo time', () => {
    expect(festivalCountdown(new Date('2026-11-01T04:30:00Z'))).toEqual({ phase: 'upcoming', days: 30, hours: 0, minutes: 0, seconds: 0 })
    expect(festivalCountdown(new Date('2026-12-01T04:29:01Z'))).toEqual({ phase: 'upcoming', days: 0, hours: 0, minutes: 0, seconds: 59 })
    expect(festivalCountdown(new Date('2026-11-29T01:15:30Z'))).toEqual({ phase: 'upcoming', days: 2, hours: 3, minutes: 14, seconds: 30 })
  })

  it('reports when the festival is live and when it has ended', () => {
    expect(festivalCountdown(new Date('2026-12-01T04:30:00Z')).phase).toBe('live')
    expect(festivalCountdown(new Date('2026-12-06T15:59:59Z')).phase).toBe('live')
    expect(festivalCountdown(new Date('2026-12-06T16:00:00Z')).phase).toBe('ended')
  })
})
