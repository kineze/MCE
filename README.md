# MCE

MCE web application, created from the Nuxt starter shell. It includes:

- Nuxt 4, Nuxt UI 4 and Tailwind 4
- A dashboard shell with a collapsible sidebar (mini mode with flyouts), a topbar with accent colour, zoom and text size controls, and a user menu. Preferences are saved per browser. The site is light mode only.
- PostgreSQL through Prisma 7 (`@prisma/adapter-pg`) with one initial migration
- Server-managed sessions (HttpOnly cookie, SHA-256 token hashes), users with multiple roles, role permissions, scrypt password hashing and login rate limiting

## Requirements

- Node.js 24 (`nvm use`)
- npm 11
- PostgreSQL 17 (Homebrew is fine)

## Setup

```bash
nvm use
npm install
cp .env.example .env          # set DATABASE_URL (include the PostgreSQL user)
createdb mce                  # or the database name in DATABASE_URL
npm run prisma:generate
npm run db:migrate
```

Create the first administrator. Put `ADMIN_EMAIL`, `ADMIN_NAME` and `ADMIN_PASSWORD` (at least 12 characters) in `.env`, then run:

```bash
npm run admin:create
```

Remove `ADMIN_PASSWORD` from `.env` afterwards. The script refuses to run if a super administrator already exists.

Import the festival programme once with `npm run programme:seed`, then manage it at `/admin/programme`. The public schedule is at `/programme`. Visitors register on the home page or at `/register`; registrations are listed at `/admin/registrations`.

### Thank-you emails (Brevo)

Each new registration is sent a thank-you email through Brevo's transactional API. Set these in `.env` (see `.env.example`):

- `BREVO_API_KEY`: from Brevo → SMTP & API → API keys. Keep it out of the repository.
- `BREVO_SENDER_EMAIL`: a sender or domain verified in Brevo. Brevo rejects unverified senders.
- `BREVO_SENDER_NAME` and `BREVO_REPLY_TO`: optional.
- `SITE_URL`: the public site address, used for the logo and programme link in the email.

Without the key or sender, registration still works and no email is sent. A failed send never blocks registration: the error is stored on the registration, shown on `/admin/registrations`, and admins with `registrations.manage` can retry it there. Repeat registrations for the same address do not send another email.

```bash
npm run dev
```

Open http://localhost:3000 for the public home page. Sign in at `/login` to reach `/admin`.

npm 11 blocks dependency install scripts unless they are approved. `package.json` → `allowScripts` approves esbuild, prisma, @prisma/engines and vue-demi at exact versions. If an upgrade changes those versions, run `npm install-scripts ls` and approve them again.

## Project layout

| Path | Purpose |
| --- | --- |
| `app/layouts/public.vue` | Public site shell (sticky nav with mobile menu + footer). Links live in `app/utils/navigation.ts` |
| `app/pages/index.vue` | Public home page |
| `app/layouts/admin.vue` | Dashboard shell (sidebar + topbar + content slot) |
| `app/utils/navigation.ts` | Sidebar entries. Add pages here and gate each one with an optional `permission` |
| `app/components/admin/` | `AdminSidebar`, `AdminTopbar`, `PagePlaceholder` |
| `app/composables/useDashboardPreferences.ts` | Accent, zoom, text size, sidebar and colour mode state |
| `app/middleware/auth.ts` | Loads the current user and sends anonymous visitors to `/login` |
| `public/brand/` | MCE Festival logo (`mce-logo.png`), circle mark for the collapsed sidebar and favicons. `AppLogo` renders them |
| `app/app.config.ts` | Points Nuxt UI's `primary` colour at the `mce` teal scale defined in `main.css` |
| `app/assets/css/main.css` | Shell, auth and dashboard styles (`--app-*` tokens) |
| `server/api/v1/auth/` | `login`, `logout`, `me` |
| `server/api/v1/admin/summary.get.ts` | Dashboard metrics (requires `system.admin`) |
| `server/api/v1/admin/users/` | List, create and update users (`users.read` / `users.manage`) |
| `server/api/v1/admin/roles/` | List, create, update and delete roles (`roles.read` / `roles.manage`) |
| `server/services/roles/rules.ts` | Locks system roles and roles you hold, and stops granting permissions you do not hold |
| `server/api/v1/programme.get.ts` | Public festival programme: published sessions only, never internal notes |
| `server/api/v1/admin/programme/` | Create, edit, publish and delete sessions (`programme.read` / `programme.manage`) |
| `server/api/v1/registrations.post.ts` | Public festival registration: validated, rate limited per IP, honeypot; duplicate emails are left unchanged |
| `server/api/v1/admin/registrations/` | List, search, CSV export, delete and resend the thank-you email (`registrations.read` / `registrations.manage`) |
| `server/services/email/brevo.ts` | Brevo transactional email client (configured from `BREVO_*` environment variables) |
| `server/services/registrations/confirmation-email.ts` | The registration thank-you email (HTML and plain text) |
| `shared/utils/festival.ts` | Festival days and Colombo (UTC+05:30) time helpers used by server and pages |
| `scripts/seed-programme.ts` | One-off import of the programme document (`npm run programme:seed`); refuses if sessions exist |
| `server/services/users/rules.ts` | Stops administrators editing themselves, managing users with more permissions, or granting roles beyond their own |
| `server/api/v1/health.get.ts` | Liveness check with a database ping |
| `server/utils/authorization.ts` | `requirePermission(event, key)` / `requireRole(event, key)` |
| `prisma/schema.prisma` | `SystemSetting`, `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `Session` |
| `scripts/create-admin.ts` | Creates the `super_admin` role, the base permissions and the first user |

## Adding a dashboard page

1. Create `app/pages/admin/<name>.vue` with `definePageMeta({ layout: 'admin', middleware: 'auth', permission: '<permission.key>' })`. The middleware returns 403 when the user lacks `permission`.
2. Add an entry to `app/utils/navigation.ts`.
3. Protect its API routes with `await requirePermission(event, '<permission.key>')`. Hiding an entry in the sidebar does not restrict access on its own.

## Database changes

```bash
npm run db:migrate:dev -- --name describe_change   # development: creates and applies a migration
npm run db:migrate                                 # other environments: applies pending migrations
npm run db:status
```

Do not run `prisma migrate reset` or `prisma db push` against a database whose data you need to keep.

## Quality checks

```bash
npm run prisma:validate
npm run typecheck
npm test
npm run build
```
