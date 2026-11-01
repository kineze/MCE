export interface RegistrationRecord {
  id: string
  fullName: string
  email: string
  phone: string | null
  country: string | null
  organisation: string | null
  days: string[]
  interests: string[]
  wantsUpdates: boolean
  /** When the thank-you email was sent; null if it has not been. */
  confirmationSentAt: string | null
  /** Why the last thank-you email attempt failed, if it did. */
  confirmationError: string | null
  createdAt: string
}

export interface RegistrationListResponse {
  registrations: RegistrationRecord[]
  total: number
  page: number
  pageSize: number
  /** Registrations overall and per festival day, ignoring the search filter. */
  totals: {
    all: number
    wantsUpdates: number
    byDay: Record<string, number>
  }
  canManage: boolean
}
