import 'dotenv/config'
import type { SessionKind } from '../shared/utils/festival'
import { colomboToDate } from '../shared/utils/festival'
import { prisma } from '../server/utils/prisma'

// One-off import of the public sessions in "MCE - Program Final Draft.docx".
// Internal logistics (sound checks, setup, lunch, the 7 December debrief) are left out.
// Sessions that are provisional, proposed, tentative or waiting on a topic are drafts,
// with the open question in `notes`. Editors publish them from /admin/programme.

const VENUES = [
  { slug: 'lionel-wendt', name: 'Lionel Wendt Theatre', sortOrder: 1 },
  { slug: 'ices', name: 'ICES Auditorium', sortOrder: 2 },
  { slug: 'alliance-francaise', name: 'Alliance Française de Colombo', sortOrder: 3 },
  { slug: 'jesuit-church', name: 'Jesuit Church', sortOrder: 4 },
  { slug: 'akbar-auditorium', name: 'Akbar Auditorium', sortOrder: 5 },
  { slug: 'arcade-independence-square', name: 'Arcade Independence Square', sortOrder: 6 },
] as const

type VenueSlug = typeof VENUES[number]['slug']

interface SeedSession {
  date: string
  start: string
  end: string
  venue: VenueSlug
  kind: SessionKind
  title: string
  people?: string
  moderator?: string
  description?: string
  highlight?: boolean
  published: boolean
  notes?: string
}

const SESSIONS: SeedSession[] = [
  // Tuesday 1 December
  {
    date: '2026-12-01', start: '18:30', end: '21:30', venue: 'jesuit-church', kind: 'PERFORMANCE',
    title: 'Tribute Performance — Hania Mariam Luthufi with Johanne & Friends',
    people: 'Hania Mariam Luthufi, Johanne & Friends',
    description: 'A stand-alone opening tribute to the festival.',
    published: true,
    notes: 'Confirm Johann Peiris’s role, running time and technical requirements (coordinate with Hania).',
  },
  {
    date: '2026-12-01', start: '18:30', end: '21:30', venue: 'jesuit-church', kind: 'PERFORMANCE',
    title: 'Tribute Performance — Café Europa',
    people: 'Café Europa with Pabalu (drums)',
    description: 'Poetry and drumming meet in an interdisciplinary tribute within the church.',
    published: true,
    notes: 'Performing on behalf of Ramya Jeerasinghe.',
  },
  {
    date: '2026-12-01', start: '10:00', end: '13:00', venue: 'ices', kind: 'WORKSHOP',
    title: 'Workshop with Seema Ashroff',
    people: 'Seema Ashroff',
    description: 'Celebrating the power of art to unite humanity beyond borders, cultures and beliefs.',
    published: true,
  },

  // Wednesday 2 December
  {
    date: '2026-12-02', start: '19:30', end: '21:30', venue: 'lionel-wendt', kind: 'PERFORMANCE',
    title: 'Festival Inauguration',
    people: 'Francis Almedha with musicians of four faiths, Vihanga and Pabalu',
    description: 'The opening ceremony, uniting four faiths and their musical traditions on one stage.',
    highlight: true,
    published: true,
  },
  {
    date: '2026-12-02', start: '10:00', end: '11:30', venue: 'ices', kind: 'PANEL',
    title: 'Sacred Stories: How Faith Shapes Literature Across South Asia',
    moderator: 'Nadeeka Guruge',
    description: 'The festival’s literary opening, setting the day’s spiritual and literary theme.',
    published: true,
    notes: 'Panellists not yet listed in the programme.',
  },
  {
    date: '2026-12-02', start: '12:30', end: '13:30', venue: 'ices', kind: 'PANEL',
    title: 'Poetry as Prayer: The Spiritual Voice in Contemporary South Asian Writing',
    people: 'Krzysztof Czyżewski, Julia Fiedorczuk, Ramya Jeerasinghe',
    description: 'Spoken word and multi-faith poets explore contemporary spiritual voices in South Asian writing.',
    published: true,
  },
  {
    date: '2026-12-02', start: '14:00', end: '15:30', venue: 'ices', kind: 'PANEL',
    title: 'Panel discussion',
    people: 'Krzysztof Czyżewski, Pramudith D. Rupasinghe, Ramya Jeerasinghe',
    published: false,
    notes: 'Topic to be decided. Check spelling: Pramudith (here) vs Pamudith (3 Dec workshop).',
  },
  {
    date: '2026-12-02', start: '16:00', end: '17:00', venue: 'ices', kind: 'PANEL',
    title: 'Conflict, Healing, and the Writer’s Role in Post-War Societies',
    people: 'Dr Amjad Saleem, Dhanuka Dickwella',
    description: 'Perspectives from Sri Lanka, Afghanistan and Kashmir.',
    published: true,
  },
  {
    date: '2026-12-02', start: '16:00', end: '17:30', venue: 'alliance-francaise', kind: 'WORKSHOP',
    title: 'Playback Theatre',
    people: 'Facilitated by Seema Ashroff',
    description: 'An interactive playback theatre session built on community stories, shared dialogue and reflection.',
    published: true,
  },

  // Thursday 3 December
  {
    date: '2026-12-03', start: '10:00', end: '11:30', venue: 'lionel-wendt', kind: 'PANEL',
    title: 'Panel discussion',
    people: 'Radhika Coomaraswamy, Farzana Jameel, Andre de Quadros',
    moderator: 'Hafeel Fariz',
    published: false,
    notes: 'Topic to be confirmed by Radhika.',
  },
  {
    date: '2026-12-03', start: '12:30', end: '13:30', venue: 'lionel-wendt', kind: 'CONVERSATION',
    title: 'In conversation with Dr A.K. Merchant',
    people: 'Dr A.K. Merchant',
    published: false,
    notes: 'Provisional. Topic to be decided.',
  },
  {
    date: '2026-12-03', start: '16:00', end: '18:00', venue: 'lionel-wendt', kind: 'WORKSHOP',
    title: 'Duff Workshop and Performance — Iranian Ensemble',
    people: 'Ali Raza and the Iranian Ensemble',
    published: false,
    notes: 'Reserved. Topic to be decided.',
  },
  {
    date: '2026-12-03', start: '19:30', end: '21:30', venue: 'lionel-wendt', kind: 'PERFORMANCE',
    title: 'Prime Time — Interfaith Ensembles',
    description: 'A shared performance moving through Buddhist, Hindu, Christian and Muslim traditions, linked by musical connectors.',
    highlight: true,
    published: false,
    notes: 'Provisional. Connectors: Pabalu (Buddhist → Hindu), Ali Raza? (Christian → Muslim).',
  },
  {
    date: '2026-12-03', start: '10:00', end: '11:30', venue: 'ices', kind: 'WORKSHOP',
    title: 'Writing the Sacred: A Workshop for Emerging Writers',
    people: 'Pamudith D. Rupasinghe',
    description: 'Established authors lead an interactive workshop on spiritual and interfaith storytelling.',
    published: true,
  },
  {
    date: '2026-12-03', start: '12:30', end: '13:30', venue: 'ices', kind: 'WORKSHOP',
    title: 'Page to Performance: Spoken Word Workshop',
    people: 'Weronika Czyżewska, Julia Fiedorczuk, Mikołaj Poncyljusz',
    description: 'Training young artists to bring poetry and music together on stage.',
    published: true,
  },
  {
    date: '2026-12-03', start: '14:00', end: '15:30', venue: 'ices', kind: 'PANEL',
    title: 'From Oral Tradition to Written Word: Preserving Sacred Stories',
    people: 'K.K. Saman',
    moderator: 'Pathum Punchihewa',
    description: 'Folklore, mythology and the passage from oral tradition to the written word. In Sinhala.',
    published: true,
  },

  // Friday 4 December
  {
    date: '2026-12-04', start: '10:00', end: '11:30', venue: 'lionel-wendt', kind: 'PANEL',
    title: 'Morning session',
    people: 'Prof. Andre de Quadros, Dhanuka Dickwella',
    published: false,
    notes: 'Topic to be decided (working idea: geopolitics and peace).',
  },
  {
    date: '2026-12-04', start: '11:30', end: '12:30', venue: 'lionel-wendt', kind: 'CONVERSATION',
    title: 'In conversation',
    people: 'Babar Sheikh, Faria, Dinali',
    moderator: 'Shabir Zakey',
    published: false,
    notes: 'Babar Sheikh will give the topic. Confirm Faria’s full name.',
  },
  {
    date: '2026-12-04', start: '14:00', end: '15:30', venue: 'lionel-wendt', kind: 'PANEL',
    title: 'Panel discussion',
    people: 'Mario, Tasneem Chopra, Robert',
    moderator: 'Hafeel',
    published: false,
    notes: 'Tentative. Topic and full names to be confirmed.',
  },
  {
    date: '2026-12-04', start: '16:00', end: '18:00', venue: 'lionel-wendt', kind: 'PERFORMANCE',
    title: 'Prelude — Alireza & Friends',
    people: 'Alireza & Friends',
    published: true,
    notes: 'Confirm format (performance or workshop), collaboration and technical needs.',
  },
  {
    date: '2026-12-04', start: '19:30', end: '21:30', venue: 'lionel-wendt', kind: 'PERFORMANCE',
    title: 'Prime Time — Aysha Basith',
    people: 'Aysha Basith',
    highlight: true,
    published: true,
    notes: 'Confirm final running order and technical requirements.',
  },
  {
    date: '2026-12-04', start: '14:00', end: '16:00', venue: 'ices', kind: 'FILM',
    title: 'Film Festival — Documentaries',
    description: 'Documentary screenings.',
    published: true,
  },
  {
    date: '2026-12-04', start: '16:00', end: '17:30', venue: 'alliance-francaise', kind: 'PERFORMANCE',
    title: 'Performance — Hasini and Praveen',
    people: 'Hasini and Praveen',
    published: true,
    notes: 'Topic to be added.',
  },

  // Saturday 5 December — Youth Day
  {
    date: '2026-12-05', start: '10:00', end: '11:30', venue: 'lionel-wendt', kind: 'PANEL',
    title: 'Opening of Youth Day — Youth Perspectives',
    people: 'Shayan De Silva and others',
    published: false,
    notes: 'Marked provisional. Confirm whether Shayan De Silva’s choir role is separate.',
  },
  {
    date: '2026-12-05', start: '12:30', end: '14:00', venue: 'lionel-wendt', kind: 'CONVERSATION',
    title: 'Heaven & Earth: An Immersive Journey with Gehan A. Cooray',
    people: 'Gehan A. Cooray',
    moderator: 'Dinali',
    description: 'A presentation followed by a panel discussion.',
    published: true,
    notes: 'Programme lists 12:30 am; corrected to 12:30 pm. Invite a school choir for a 6-minute classical medley.',
  },
  {
    date: '2026-12-05', start: '14:30', end: '15:30', venue: 'lionel-wendt', kind: 'CONVERSATION',
    title: 'Razeen Sally in conversation with Captain Elmo Jayawardena',
    people: 'Razeen Sally, Capt. Elmo Jayawardena',
    description: 'Captain Elmo Jayawardena is an award-winning writer on all things Sri Lankan, a famed pilot and, with his wife Dil, the founder of the charity Candle Aid Lanka. Razeen Sally talks to him about his life and work.',
    published: true,
  },
  {
    date: '2026-12-05', start: '16:00', end: '17:00', venue: 'lionel-wendt', kind: 'PERFORMANCE',
    title: 'Play for Palestine',
    people: 'Performance by Stages; discussion with Ruwanthi de C. and Nafeesa',
    published: false,
    notes: 'Proposed. Programme lists 4–5 pm (5–6 pm).',
  },
  {
    date: '2026-12-05', start: '19:30', end: '21:30', venue: 'lionel-wendt', kind: 'PERFORMANCE',
    title: 'Prime Time — Milad Yusifi and Ahmed Muin',
    people: 'Milad Yusifi, Ahmed Muin',
    highlight: true,
    published: true,
    notes: 'Confirm format and duration. Children’s voices (St. Thomas?) and voice-over by Gihan and Dinali.',
  },
  {
    date: '2026-12-05', start: '10:00', end: '12:30', venue: 'ices', kind: 'FILM',
    title: 'Film Festival — Kipenzi Kids Festival',
    description: 'Screenings for young audiences as part of Youth Day.',
    published: true,
  },
  {
    date: '2026-12-05', start: '14:00', end: '16:00', venue: 'ices', kind: 'FILM',
    title: 'Film Festival',
    description: 'Afternoon screenings.',
    published: true,
  },
  {
    date: '2026-12-05', start: '16:00', end: '17:30', venue: 'alliance-francaise', kind: 'CONVERSATION',
    title: 'Session with Sajada and Tasneem Chopra',
    people: 'Sajada, Tasneem Chopra',
    published: false,
    notes: 'Topic to be decided.',
  },

  // Sunday 6 December — closing day
  {
    date: '2026-12-06', start: '10:00', end: '11:30', venue: 'lionel-wendt', kind: 'CONVERSATION',
    title: 'Aysha Basith in conversation',
    people: 'Aysha Basith',
    published: true,
    notes: 'Topic to be added.',
  },
  {
    date: '2026-12-06', start: '14:30', end: '15:30', venue: 'lionel-wendt', kind: 'PERFORMANCE',
    title: 'Choral Ensembles',
    description: 'An afternoon open session for international artists and choral groups.',
    published: false,
    notes: 'Slot marked available.',
  },
  {
    date: '2026-12-06', start: '16:00', end: '18:00', venue: 'lionel-wendt', kind: 'PERFORMANCE',
    title: 'Turkish Performance',
    published: true,
  },
  {
    date: '2026-12-06', start: '19:30', end: '21:30', venue: 'lionel-wendt', kind: 'PERFORMANCE',
    title: 'Prime Time — Closing Concert: MCE in Concert',
    people: 'Shahid Shabaz, Adil',
    description: 'The festival’s closing performance.',
    highlight: true,
    published: true,
    notes: 'Verify Shahid Shabaz’s spelling and Adil’s full name and role. Website launch and Ali Raza drum launch.',
  },
  {
    date: '2026-12-06', start: '16:00', end: '17:30', venue: 'alliance-francaise', kind: 'CONVERSATION',
    title: 'Razeen Sally: From Political Economy to the Buddhist World',
    people: 'Razeen Sally',
    description: 'Razeen Sally talks about his journey from professor of international political economy to travel writer on Sri Lanka, and his new book on the Buddhist world, which takes him to about twenty countries in Asia and the West.',
    published: true,
  },
]

async function main(): Promise<void> {
  const existing = await prisma.programmeSession.count()
  if (existing > 0) {
    throw new Error(`The programme already has ${existing} sessions. Edit them at /admin/programme. No changes were made.`)
  }

  await prisma.$transaction(async (transaction) => {
    const venueIds = new Map<string, string>()
    for (const venue of VENUES) {
      const saved = await transaction.venue.upsert({
        where: { slug: venue.slug },
        create: venue,
        update: { name: venue.name, sortOrder: venue.sortOrder },
      })
      venueIds.set(venue.slug, saved.id)
    }

    await transaction.programmeSession.createMany({
      data: SESSIONS.map(session => ({
        title: session.title,
        description: session.description ?? null,
        kind: session.kind,
        venueId: venueIds.get(session.venue)!,
        startsAt: colomboToDate(session.date, session.start),
        endsAt: colomboToDate(session.date, session.end),
        people: session.people ?? null,
        moderator: session.moderator ?? null,
        highlight: session.highlight ?? false,
        published: session.published,
        notes: session.notes ?? null,
      })),
    })
  })

  const published = SESSIONS.filter(session => session.published).length
  console.log(`Imported ${SESSIONS.length} sessions (${published} published, ${SESSIONS.length - published} drafts) across ${VENUES.length} venues.`)
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Programme import failed.')
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
