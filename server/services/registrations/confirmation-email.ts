import type { EmailMessage } from '../email/brevo'
import { formatFestivalDay } from '../../../shared/utils/festival'

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ESCAPES[character] ?? character)
}

/** The public site address for links and the logo, or null when unset or not http(s). */
export function siteUrl(env: Record<string, string | undefined> = process.env): string | null {
  const value = env.SITE_URL?.trim()
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : null
  }
  catch {
    return null
  }
}

/** The thank-you email for a new registration, in HTML and plain text. */
export function registrationConfirmationEmail(
  registration: { fullName: string, email: string, days: string[] },
  options: { siteUrl: string | null, canReply: boolean },
): EmailMessage {
  const firstName = registration.fullName.trim().split(/\s+/)[0] || registration.fullName
  const days = registration.days.map(day => formatFestivalDay(day))
  const programmeUrl = options.siteUrl ? `${options.siteUrl}/programme` : null
  const logoUrl = options.siteUrl ? `${options.siteUrl}/brand/mce-logo.png` : null
  const subject = 'You’re registered: The Festival of Sacred Sounds 2026'

  const text = [
    `Thank you for registering, ${firstName}.`,
    '',
    'Your place at The Festival of Sacred Sounds, South Asia 2026 is confirmed. We look forward to welcoming you in Colombo on:',
    '',
    ...days.map(day => `  • ${day}`),
    '',
    programmeUrl
      ? `The programme of concerts, conversations, workshops and films is at ${programmeUrl}`
      : 'We will share the programme of concerts, conversations, workshops and films before the festival.',
    '',
    '“Beyond Differences Towards a Deeper Understanding of Shared Humanity”',
    '',
    'The MCE Festival · 1–6 December 2026 · Colombo, Sri Lanka',
    options.canReply
      ? 'You received this email because you registered for the festival. Reply to this email if you would like us to remove your details.'
      : 'You received this email because you registered for the festival.',
  ].join('\n')

  const dayRows = days.map(day => `
              <tr><td style="padding:10px 14px;border:1px solid #e7e2d9;border-radius:10px;background:#fbf6ee;font:700 15px/1.3 Arial,Helvetica,sans-serif;color:#0b1533;">${escapeHtml(day)}</td></tr>
              <tr><td style="height:8px;line-height:8px;font-size:0;">&nbsp;</td></tr>`).join('')

  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f1ec;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;">
        <tr><td style="padding:24px 28px;background:#ffffff;" align="left">
          ${logoUrl
            ? `<img src="${escapeHtml(logoUrl)}" width="200" alt="The MCE Festival" style="display:block;width:200px;max-width:100%;height:auto;border:0;">`
            : '<p style="margin:0;font:900 20px/1.2 Arial,Helvetica,sans-serif;color:#0b1533;letter-spacing:.5px;">THE MCE <span style="color:#0398aa;">FESTIVAL</span></p>'}
        </td></tr>
        <tr><td style="padding:34px 28px;background:#0b1533;background-image:linear-gradient(120deg,#0b1533 0%,#16224a 70%,#3a2a3e 100%);">
          <p style="margin:0 0 10px;font:800 12px/1.4 Arial,Helvetica,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#e9b44c;">You’re registered</p>
          <h1 style="margin:0;font:900 28px/1.15 Arial,Helvetica,sans-serif;color:#ffffff;">Thank you, ${escapeHtml(firstName)}</h1>
          <p style="margin:12px 0 0;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:#d6dbe7;">The Festival of Sacred Sounds, South Asia 2026</p>
        </td></tr>
        <tr><td style="height:4px;line-height:4px;font-size:0;background:#f08a24;background-image:linear-gradient(90deg,#f08a24,#d9541e,#0398aa);">&nbsp;</td></tr>
        <tr><td style="padding:28px;">
          <p style="margin:0 0 18px;font:400 16px/1.6 Arial,Helvetica,sans-serif;color:#252c3b;">Your place is confirmed. We look forward to welcoming you in Colombo on:</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${dayRows}
          </table>
          <p style="margin:18px 0 24px;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:#5b6475;">${programmeUrl
            ? 'The programme of concerts, conversations, workshops and films is online and updated as sessions are confirmed.'
            : 'We will share the programme of concerts, conversations, workshops and films before the festival.'}</p>
          ${programmeUrl ? `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#d9541e;">
            <a href="${escapeHtml(programmeUrl)}" style="display:inline-block;padding:13px 22px;font:700 15px/1 Arial,Helvetica,sans-serif;color:#ffffff;text-decoration:none;">View the programme</a>
          </td></tr></table>` : ''}
          <p style="margin:28px 0 0;padding-left:12px;border-left:3px solid #f08a24;font:italic 400 14px/1.6 Arial,Helvetica,sans-serif;color:#5b6475;">“Beyond Differences Towards a Deeper Understanding of Shared Humanity”</p>
        </td></tr>
        <tr><td style="padding:20px 28px;background:#fbf6ee;border-top:1px solid #efe8dc;">
          <p style="margin:0;font:700 13px/1.5 Arial,Helvetica,sans-serif;color:#0b1533;">The MCE Festival · 1–6 December 2026 · Colombo, Sri Lanka</p>
          <p style="margin:6px 0 0;font:400 12px/1.5 Arial,Helvetica,sans-serif;color:#8a93a3;">You received this email because you registered for the festival.${options.canReply ? ' Reply to this email if you would like us to remove your details.' : ''}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return {
    to: { email: registration.email, name: registration.fullName },
    subject,
    html,
    text,
    tags: ['registration-confirmation'],
  }
}
