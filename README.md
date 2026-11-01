# MCE

MCE web application, created from the Nuxt starter shell. It includes:

- Nuxt 4, Nuxt UI 4 and Tailwind 4
- A dashboard shell with a collapsible sidebar (mini mode with flyouts), a topbar with accent colour, zoom, text size and dark mode controls, and a user menu. Preferences are saved per browser.
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

```bash
npm run dev
```

Open http://localhost:3000. It redirects to `/login`, and you land on `/admin` after you sign in.

npm 11 blocks dependency install scripts unless they are approved. `package.json` → `allowScripts` approves esbuild, prisma, @prisma/engines and vue-demi at exact versions. If an upgrade changes those versions, run `npm install-scripts ls` and approve them again.

## Project layout

| Path | Purpose |
| --- | --- |
| `app/layouts/admin.vue` | Dashboard shell (sidebar + topbar + content slot) |
| `app/utils/navigation.ts` | Sidebar entries. Add pages here and gate each one with an optional `permission` |
| `app/components/admin/` | `AdminSidebar`, `AdminTopbar`, `PagePlaceholder` |
| `app/composables/useDashboardPreferences.ts` | Accent, zoom, text size, sidebar and colour mode state |
| `app/middleware/auth.ts` | Loads the current user and sends anonymous visitors to `/login` |
| `app/assets/css/main.css` | Shell, auth and dashboard styles (`--app-*` tokens) |
| `server/api/v1/auth/` | `login`, `logout`, `me` |
| `server/api/v1/admin/summary.get.ts` | Dashboard metrics (requires `system.admin`) |
| `server/api/v1/health.get.ts` | Liveness check with a database ping |
| `server/utils/authorization.ts` | `requirePermission(event, key)` / `requireRole(event, key)` |
| `prisma/schema.prisma` | `SystemSetting`, `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `Session` |
| `scripts/create-admin.ts` | Creates the `super_admin` role, the base permissions and the first user |

## Adding a dashboard page

1. Create `app/pages/admin/<name>.vue` with `definePageMeta({ layout: 'admin', middleware: 'auth' })`.
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
