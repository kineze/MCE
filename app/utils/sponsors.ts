// Festival sponsors and partners, with tiers as printed on the 2026 cover.
// Logos live in public/sponsors and are cropped to their content.

export interface Sponsor {
  name: string
  tier: string
  logo: string
}

export const principalSponsor: Sponsor = {
  name: 'Cargills',
  tier: 'Principal Sponsor',
  logo: '/sponsors/cargills.png',
}

/** First carousel row: collaborator, hospitality, transport, corporate and media partners. */
export const partnerRowOne: Sponsor[] = [
  { name: 'The Asian Literary Festival', tier: 'Official Festival Collaborator', logo: '/sponsors/asian-literary-festival.png' },
  { name: 'Shangri-La Hotels and Resorts', tier: 'Official Hospitality Partner', logo: '/sponsors/shangri-la.png' },
  { name: 'Jetwing Travels', tier: 'Official Transport Partner', logo: '/sponsors/jetwing-travels.png' },
  { name: 'Kent', tier: 'Corporate Partner', logo: '/sponsors/kent.png' },
  { name: 'Tellurian (H J Pitter Pvt Ltd and Green Leaf Herbals Int)', tier: 'Corporate Partner', logo: '/sponsors/tellurian.png' },
  { name: 'Daily FT', tier: 'Print Media Partner', logo: '/sponsors/daily-ft.png' },
  { name: 'The Sunday Times', tier: 'Print Media Partner', logo: '/sponsors/sunday-times.png' },
  { name: 'Daily Mirror', tier: 'Print Media Partner', logo: '/sponsors/daily-mirror.png' },
]

/**
 * Second carousel row: institutional and diplomatic partners.
 * The SJ, AB and NCC names and the red seal's name are still to be confirmed with the organisers.
 */
export const partnerRowTwo: Sponsor[] = [
  { name: 'Alliance Française de Colombo', tier: 'Institutional Partner', logo: '/sponsors/alliance-francaise.png' },
  { name: 'SJ', tier: 'Institutional Partner', logo: '/sponsors/sj.png' },
  { name: 'Institutional partner seal', tier: 'Institutional Partner', logo: '/sponsors/institutional-seal.png' },
  { name: 'AB', tier: 'Institutional Partner', logo: '/sponsors/ab.png' },
  { name: 'NCC', tier: 'Institutional Partner', logo: '/sponsors/ncc.png' },
  { name: 'Embassy of the Republic of Türkiye', tier: 'Diplomatic Partner', logo: '/sponsors/embassy-turkiye.png' },
  { name: 'Embassy of the Islamic Republic of Iran, Colombo', tier: 'Diplomatic Partner', logo: '/sponsors/embassy-iran.png' },
]
