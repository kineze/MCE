import { describe, expect, it, vi } from 'vitest'
import { brevoConfig, sendEmail } from '../server/services/email/brevo'
import { escapeHtml, registrationConfirmationEmail, siteUrl } from '../server/services/registrations/confirmation-email'

const env = { BREVO_API_KEY: 'test-key', BREVO_SENDER_EMAIL: 'hello@festival.test', BREVO_REPLY_TO: 'team@festival.test' }
const message = { to: { email: 'amara@example.com', name: 'Amara Perera' }, subject: 'Hi', html: '<p>Hi</p>', text: 'Hi', tags: ['registration-confirmation'] }

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

describe('Brevo client', () => {
  it('needs both an API key and a sender', () => {
    expect(brevoConfig({})).toBeNull()
    expect(brevoConfig({ BREVO_API_KEY: 'k' })).toBeNull()
    expect(brevoConfig({ BREVO_API_KEY: 'k', BREVO_SENDER_EMAIL: 's@x.test' })?.senderName).toBe('The MCE Festival')
  })

  it('skips sending when not configured, without calling Brevo', async () => {
    const fetchImpl = vi.fn()
    const result = await sendEmail(message, { env: {}, fetchImpl })
    expect(result).toMatchObject({ sent: false, reason: 'not-configured' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('posts the message to Brevo with the api-key header', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(201, { messageId: '<abc@relay>' }))
    const result = await sendEmail(message, { env, fetchImpl })

    expect(result).toEqual({ sent: true, messageId: '<abc@relay>' })
    const [url, init] = fetchImpl.mock.calls[0]!
    expect(url).toBe('https://api.brevo.com/v3/smtp/email')
    expect(init.method).toBe('POST')
    expect(init.headers['api-key']).toBe('test-key')
    expect(JSON.parse(init.body)).toEqual({
      sender: { email: 'hello@festival.test', name: 'The MCE Festival' },
      to: [{ email: 'amara@example.com', name: 'Amara Perera' }],
      replyTo: { email: 'team@festival.test' },
      subject: 'Hi',
      htmlContent: '<p>Hi</p>',
      textContent: 'Hi',
      tags: ['registration-confirmation'],
    })
  })

  it('trims names to Brevo’s 70 character limit', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(201, {}))
    await sendEmail({ ...message, to: { email: 'a@b.test', name: 'x'.repeat(90) } }, { env, fetchImpl })
    expect(JSON.parse(fetchImpl.mock.calls[0]![1].body).to[0].name).toHaveLength(70)
  })

  it('reports Brevo errors without throwing', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(401, { code: 'unauthorized', message: 'Key not found' }))
    expect(await sendEmail(message, { env, fetchImpl })).toEqual({
      sent: false, reason: 'failed', error: 'Brevo responded 401 (unauthorized: Key not found)',
    })
  })

  it('reports network failures without throwing', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('fetch failed'))
    expect(await sendEmail(message, { env, fetchImpl })).toMatchObject({ sent: false, error: 'Could not reach Brevo: fetch failed' })
  })
})

describe('registration thank-you email', () => {
  const registration = { fullName: 'Amara <b>Perera</b>', email: 'amara@example.com', days: ['2026-12-02', '2026-12-04'] }

  it('escapes the visitor’s name in the HTML', () => {
    const email = registrationConfirmationEmail(registration, { siteUrl: null, canReply: false })
    expect(email.html).toContain('Thank you, Amara')
    expect(email.html).not.toContain('<b>Perera</b>')
    expect(escapeHtml('<script>"x"</script>')).toBe('&lt;script&gt;&quot;x&quot;&lt;/script&gt;')
  })

  it('lists the chosen days in both versions', () => {
    const email = registrationConfirmationEmail(registration, { siteUrl: null, canReply: false })
    for (const day of ['Wednesday 2 December', 'Friday 4 December']) {
      expect(email.html).toContain(day)
      expect(email.text).toContain(day)
    }
  })

  it('links to the programme and shows the logo only when a site URL is set', () => {
    const offline = registrationConfirmationEmail(registration, { siteUrl: null, canReply: false })
    expect(offline.html).not.toContain('href=')
    expect(offline.html).not.toContain('<img')

    const online = registrationConfirmationEmail(registration, { siteUrl: 'https://mce.example', canReply: true })
    expect(online.html).toContain('href="https://mce.example/programme"')
    expect(online.html).toContain('src="https://mce.example/brand/mce-logo.png"')
    expect(online.text).toContain('Reply to this email')
  })

  it('accepts only http(s) site URLs', () => {
    expect(siteUrl({ SITE_URL: 'https://mce.example/some/path' })).toBe('https://mce.example')
    expect(siteUrl({ SITE_URL: 'javascript:alert(1)' })).toBeNull()
    expect(siteUrl({})).toBeNull()
  })
})
