// Transactional email through Brevo's HTTP API (POST /v3/smtp/email, `api-key` header).
// Configuration comes from the environment so the key never reaches the browser:
//   BREVO_API_KEY       API key from Brevo → SMTP & API → API keys
//   BREVO_SENDER_EMAIL  a sender or domain verified in Brevo
//   BREVO_SENDER_NAME   optional display name (defaults to the festival name)
//   BREVO_REPLY_TO      optional address replies should go to

const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email'
const BREVO_NAME_LIMIT = 70
const REQUEST_TIMEOUT_MS = 10_000

export interface BrevoConfig {
  apiKey: string
  senderEmail: string
  senderName: string
  replyTo: string | null
}

export interface EmailMessage {
  to: { email: string, name?: string }
  subject: string
  html: string
  text: string
  tags?: string[]
}

export type SendEmailResult =
  | { sent: true, messageId: string | null }
  | { sent: false, reason: 'not-configured' | 'failed', error: string }

type Env = Record<string, string | undefined>

/** Brevo settings, or null when the key or sender is missing. */
export function brevoConfig(env: Env = process.env): BrevoConfig | null {
  const apiKey = env.BREVO_API_KEY?.trim()
  const senderEmail = env.BREVO_SENDER_EMAIL?.trim()
  if (!apiKey || !senderEmail) return null

  return {
    apiKey,
    senderEmail,
    senderName: env.BREVO_SENDER_NAME?.trim() || 'The MCE Festival',
    replyTo: env.BREVO_REPLY_TO?.trim() || null,
  }
}

function brevoName(name: string | undefined): string | undefined {
  const trimmed = name?.trim()
  return trimmed ? trimmed.slice(0, BREVO_NAME_LIMIT) : undefined
}

export async function sendEmail(
  message: EmailMessage,
  options: { env?: Env, fetchImpl?: typeof fetch } = {},
): Promise<SendEmailResult> {
  const config = brevoConfig(options.env)
  if (!config) {
    return { sent: false, reason: 'not-configured', error: 'Email is not configured (BREVO_API_KEY and BREVO_SENDER_EMAIL)' }
  }

  const body = {
    sender: { email: config.senderEmail, name: brevoName(config.senderName) },
    to: [{ email: message.to.email, name: brevoName(message.to.name) }],
    ...(config.replyTo ? { replyTo: { email: config.replyTo } } : {}),
    subject: message.subject,
    htmlContent: message.html,
    textContent: message.text,
    ...(message.tags?.length ? { tags: message.tags } : {}),
  }

  try {
    const response = await (options.fetchImpl ?? fetch)(BREVO_SEND_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': config.apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    const payload = await response.json().catch(() => ({})) as { messageId?: string, code?: string, message?: string }
    if (!response.ok) {
      const detail = [payload.code, payload.message].filter(Boolean).join(': ')
      return { sent: false, reason: 'failed', error: `Brevo responded ${response.status}${detail ? ` (${detail})` : ''}` }
    }

    return { sent: true, messageId: payload.messageId ?? null }
  }
  catch (error: unknown) {
    const reason = error instanceof Error && error.name === 'TimeoutError'
      ? 'Brevo did not respond in time'
      : `Could not reach Brevo: ${error instanceof Error ? error.message : 'unknown error'}`
    return { sent: false, reason: 'failed', error: reason }
  }
}
