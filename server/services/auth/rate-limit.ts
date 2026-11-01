export const LOGIN_RATE_LIMIT = {
  attempts: 5,
  windowMinutes: 15,
} as const

interface RateLimitEntry {
  attempts: number
  resetsAt: number
}

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

export class FixedWindowRateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>()

  constructor(
    private readonly maximumAttempts: number,
    private readonly windowMilliseconds: number,
  ) {}

  consume(key: string, now = Date.now()): RateLimitResult {
    const existing = this.entries.get(key)
    const entry = !existing || existing.resetsAt <= now
      ? { attempts: 0, resetsAt: now + this.windowMilliseconds }
      : existing

    entry.attempts += 1
    this.entries.set(key, entry)

    return {
      allowed: entry.attempts <= this.maximumAttempts,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetsAt - now) / 1000)),
    }
  }

  reset(key: string): void {
    this.entries.delete(key)
  }

  prune(now = Date.now()): void {
    for (const [key, entry] of this.entries) {
      if (entry.resetsAt <= now) {
        this.entries.delete(key)
      }
    }
  }
}

export const loginRateLimiter = new FixedWindowRateLimiter(
  LOGIN_RATE_LIMIT.attempts,
  LOGIN_RATE_LIMIT.windowMinutes * 60 * 1000,
)
