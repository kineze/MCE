import { readBody, setHeader, setResponseStatus } from 'h3'
import { clientIp } from '../../utils/client-ip'
import { createRegistration, registrationRateLimiter, sendRegistrationConfirmation } from '../../services/registrations/registrations'
import { registrationSchema, registrationValidationMessage } from '../../services/registrations/validation'

export default defineEventHandler(async (event) => {
  const parsed = registrationSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: registrationValidationMessage(parsed.error) })
  }

  // Only complete submissions count, so fixing a typo does not use up the allowance.
  const limit = registrationRateLimiter.consume(clientIp(event) ?? 'unknown')
  if (!limit.allowed) {
    setHeader(event, 'Retry-After', limit.retryAfterSeconds)
    throw createError({ statusCode: 429, statusMessage: 'Too many registrations from this connection. Please try again later.' })
  }

  // Bots fill the hidden field; give them the same answer without storing anything.
  // Only new registrations get the thank-you email, so the form cannot be used to spam an address.
  const registrationId = parsed.data.website ? null : await createRegistration(parsed.data)
  if (registrationId) {
    await sendRegistrationConfirmation(registrationId)
  }

  setResponseStatus(event, 201)
  return { registered: true }
})
