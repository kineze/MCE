import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../server/services/auth/password'

describe('password hashing', () => {
  it('verifies the correct password without storing plaintext', async () => {
    const hash = await hashPassword('a sufficiently long password')

    expect(hash).not.toContain('a sufficiently long password')
    await expect(verifyPassword('a sufficiently long password', hash)).resolves.toBe(true)
    await expect(verifyPassword('incorrect password', hash)).resolves.toBe(false)
  })

  it('rejects malformed or unsupported hashes', async () => {
    await expect(verifyPassword('password', 'not-a-valid-hash')).resolves.toBe(false)
  })
})
