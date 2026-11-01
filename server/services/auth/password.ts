import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

const ALGORITHM = 'scrypt-v1'
const COST = 2 ** 15
const BLOCK_SIZE = 8
const PARALLELIZATION = 3
const KEY_LENGTH = 64
const MAX_MEMORY = 64 * 1024 * 1024
const SALT_LENGTH = 16

function deriveKey(
  password: string,
  salt: Buffer,
  cost: number,
  blockSize: number,
  parallelization: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      KEY_LENGTH,
      {
        N: cost,
        r: blockSize,
        p: parallelization,
        maxmem: MAX_MEMORY,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error)
          return
        }

        resolve(derivedKey)
      },
    )
  })
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH)
  const derivedKey = await deriveKey(
    password,
    salt,
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
  )

  return [
    ALGORITHM,
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString('base64url'),
    derivedKey.toString('base64url'),
  ].join('$')
}

export async function verifyPassword(
  password: string,
  encodedHash: string,
): Promise<boolean> {
  const [algorithm, costText, blockSizeText, parallelizationText, saltText, hashText]
    = encodedHash.split('$')

  const cost = Number(costText)
  const blockSize = Number(blockSizeText)
  const parallelization = Number(parallelizationText)

  if (
    algorithm !== ALGORITHM
    || cost !== COST
    || blockSize !== BLOCK_SIZE
    || parallelization !== PARALLELIZATION
    || !saltText
    || !hashText
  ) {
    return false
  }

  const expected = Buffer.from(hashText, 'base64url')
  if (expected.length !== KEY_LENGTH) {
    return false
  }

  const actual = await deriveKey(
    password,
    Buffer.from(saltText, 'base64url'),
    cost,
    blockSize,
    parallelization,
  )

  return timingSafeEqual(actual, expected)
}
