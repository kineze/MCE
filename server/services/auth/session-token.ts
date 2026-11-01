import { createHash } from 'node:crypto'

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

export function getSessionCookieName(): string {
  return isProduction()
    ? '__Host-mce_session'
    : 'mce_session'
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

const BEARER_PATTERN = /^Bearer\s+([\w-]{20,256})$/

/** Extracts a session token from an `Authorization: Bearer <token>` header. */
export function parseBearerToken(header: string | undefined): string | undefined {
  return header ? BEARER_PATTERN.exec(header.trim())?.[1] : undefined
}
