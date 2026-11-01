import { describe, expect, it } from 'vitest'
import { FixedWindowRateLimiter } from '../server/services/auth/rate-limit'

describe('FixedWindowRateLimiter', () => {
  it('blocks attempts over the limit and permits them after the window', () => {
    const limiter = new FixedWindowRateLimiter(2, 1_000)

    expect(limiter.consume('login', 10_000).allowed).toBe(true)
    expect(limiter.consume('login', 10_100).allowed).toBe(true)
    expect(limiter.consume('login', 10_200).allowed).toBe(false)
    expect(limiter.consume('login', 11_000).allowed).toBe(true)
  })

  it('can clear successful login attempts', () => {
    const limiter = new FixedWindowRateLimiter(1, 1_000)
    limiter.consume('login', 10_000)
    limiter.reset('login')

    expect(limiter.consume('login', 10_100).allowed).toBe(true)
  })
})
