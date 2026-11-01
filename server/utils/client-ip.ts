import type { H3Event } from 'h3'
import { getRequestIP } from 'h3'

/**
 * The visitor's IP address, for rate limiting. Behind a reverse proxy every request comes
 * from the proxy, so set TRUST_PROXY=true when the app is only reachable through one (such
 * as nginx overwriting X-Forwarded-For); otherwise the header is ignored because clients
 * could forge it.
 */
export function clientIp(event: H3Event, env: Record<string, string | undefined> = process.env): string | undefined {
  return getRequestIP(event, { xForwardedFor: env.TRUST_PROXY === 'true' })
}
