import { requireAuthenticatedUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthenticatedUser(event)
  return { user }
})
