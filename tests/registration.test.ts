import { describe, expect, it } from 'vitest'
import { csvCell, toCsv } from '../server/services/registrations/csv'
import { registrationSchema, registrationValidationMessage } from '../server/services/registrations/validation'

const valid = {
  fullName: 'Amara Perera',
  email: 'amara@example.com',
  days: ['2026-12-04', '2026-12-02', '2026-12-04'],
  consent: true,
}

describe('registration validation', () => {
  it('accepts a minimal registration and sorts and de-duplicates days', () => {
    const parsed = registrationSchema.parse(valid)
    expect(parsed.days).toEqual(['2026-12-02', '2026-12-04'])
    expect(parsed.interests).toEqual([])
    expect(parsed.wantsUpdates).toBe(false)
  })

  it('requires consent and at least one festival day', () => {
    const noConsent = registrationSchema.safeParse({ ...valid, consent: false })
    expect(registrationValidationMessage(noConsent.error!)).toMatch(/agree/)
    const noDays = registrationSchema.safeParse({ ...valid, days: [] })
    expect(registrationValidationMessage(noDays.error!)).toMatch(/at least one day/)
    expect(registrationSchema.safeParse({ ...valid, days: ['2026-12-07'] }).success).toBe(false)
  })

  it('checks phone numbers only when given', () => {
    expect(registrationSchema.safeParse({ ...valid, phone: '+94 77 123 4567' }).success).toBe(true)
    expect(registrationSchema.parse({ ...valid, phone: '' }).phone).toBeNull()
    expect(registrationSchema.safeParse({ ...valid, phone: 'call me' }).success).toBe(false)
  })

  it('rejects unknown fields and interests', () => {
    expect(registrationSchema.safeParse({ ...valid, role: 'admin' }).success).toBe(false)
    expect(registrationSchema.safeParse({ ...valid, interests: ['PARTY'] }).success).toBe(false)
  })
})

describe('registration CSV export', () => {
  it('quotes commas, quotes and line breaks', () => {
    expect(csvCell('Perera, Amara')).toBe('"Perera, Amara"')
    expect(csvCell('The "MCE"')).toBe('"The ""MCE"""')
    expect(csvCell(null)).toBe('')
  })

  it('defuses spreadsheet formulas', () => {
    expect(csvCell('=HYPERLINK("http://evil")')).toBe('"\'=HYPERLINK(""http://evil"")"')
    expect(csvCell('+94 77 123 4567')).toBe("'+94 77 123 4567")
    expect(csvCell('@sum')).toBe("'@sum")
  })

  it('starts with a byte order mark and uses CRLF rows', () => {
    expect(toCsv([['a', 'b'], ['Żaneta', 1]])).toBe('﻿a,b\r\nŻaneta,1\r\n')
  })
})
