import type { SessionKind } from '../utils/festival'

export interface ProgrammeVenue {
  id: string
  slug: string
  name: string
}

export interface PublicSession {
  id: string
  title: string
  description: string | null
  kind: SessionKind
  startsAt: string
  endsAt: string
  people: string | null
  moderator: string | null
  highlight: boolean
  venue: ProgrammeVenue
}

export interface AdminSession extends PublicSession {
  published: boolean
  /** Internal planning notes. Only returned to admins. */
  notes: string | null
  updatedAt: string
}

export interface PublicProgrammeResponse {
  sessions: PublicSession[]
}

export interface AdminProgrammeResponse {
  sessions: AdminSession[]
  venues: ProgrammeVenue[]
  canManage: boolean
}

export interface AdminSessionResponse {
  session: AdminSession
}
