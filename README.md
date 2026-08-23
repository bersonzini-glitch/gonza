# ColumnaLATAM

A premium, mobile-first platform for discovering LATAM spine surgery congresses and finding verified spine surgeons across Latin America.

Two core products in one app:

1. **Congress search engine** — search, filter, and browse spine-related congresses, courses, workshops, and webinars across Latin America, each backed by a real public source.
2. **Surgeon directory** — a public, searchable directory of orthopedic and neurosurgical spine surgeons, populated only by admin-approved, self-submitted profiles.

## Architecture

- **Framework**: Next.js 16 (App Router, Server Components, Server Actions), TypeScript in strict mode.
- **Styling**: Tailwind CSS v4 + shadcn/ui (Base UI primitives), Framer Motion for purposeful motion, Lenis for opt-in smooth scrolling.
- **Data & auth**: Supabase (Postgres, Auth, Storage), accessed through `@supabase/ssr` on the server and a thin browser client on the client. All authorization is enforced by **Row Level Security**, never by trusting client input.
- **Validation**: Zod schemas shared between client forms (via `react-hook-form` + `@hookform/resolvers/zod`) and server actions.
- **Icons**: Lucide React, exclusively.

### Directory layout

```
src/
  app/                 Routes (App Router)
  components/          UI components, grouped by feature/domain
  lib/
    actions/           Server Actions (auth, surgeon profile, admin moderation)
    data/               Read-only server-side data-access functions
    supabase/           Supabase client factories (browser/server/admin) + storage helpers
    validation/         Zod schemas (shared client/server)
  types/database.ts     Hand-maintained mirror of the SQL schema
supabase/
  migrations/           Numbered SQL migrations (schema, RLS, functions, storage)
  seed/                 Seed data + methodology notes
scripts/
  create-initial-admin.ts  Provisions the first admin account
  seed.ts                  Loads supabase/seed/*.json into the database
```

## Local setup

### 1. Prerequisites

- Node.js 20.9+ (uses `process.loadEnvFile`, `Array.prototype` etc.)
- A free [Supabase](https://supabase.com) project

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env.local`

Copy `.env.example` to `.env.local` and fill in real values — **never commit this file**:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=              # Project Settings -> API -> Project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=  # Project Settings -> API -> anon/publishable key
SUPABASE_SERVICE_ROLE_KEY=             # Project Settings -> API -> service_role key (server-only!)
INITIAL_ADMIN_USERNAME=                # e.g. admin
INITIAL_ADMIN_EMAIL=                   # a real email you control
INITIAL_ADMIN_PASSWORD=                # 8+ chars, upper+lower+number
NEXT_PUBLIC_SITE_URL=                  # http://localhost:3000 for local dev
```

`SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security. It is only ever read in server-only modules (`src/lib/supabase/admin.ts`, guarded by the `server-only` package which fails the build if a Client Component imports it) and in the one-off scripts under `scripts/`. It is never sent to the browser.

### 4. Supabase setup

1. Create a new Supabase project.
2. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) if you don't have it, then link your project:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   ```
3. Run migrations:
   ```bash
   npx supabase db push
   ```
   (Or paste the files in `supabase/migrations/` into the Supabase SQL editor, in filename order, if you'd rather not use the CLI.)

### 5. Provision the initial administrator

```bash
npm run setup:admin
```

This reads `INITIAL_ADMIN_*` from `.env.local`, creates (or promotes) that Supabase Auth account, and sets its `profiles.role` to `admin` using the service-role key — bypassing the RLS rule that normally forbids self-promotion. Safe to re-run. Sign in at `/sign-in` with the configured username (or email) and password once it completes.

### 6. Load seed data

```bash
npm run seed
```

Loads `supabase/seed/events.json` (real, source-verified LATAM spine congresses) and `supabase/seed/demo-surgeons.json` (clearly-marked sample surgeon profiles) into the database. Idempotent — safe to re-run. See `supabase/seed/README.md` for the verification methodology.

### 7. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run format` / `format:check` | Prettier write / check |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` / `test:watch` | Vitest unit tests |
| `npm run setup:admin` | Provision/promote the initial admin |
| `npm run seed` | Load seed data |

Before considering a change done, run `lint`, `typecheck`, `test`, and `build` — all four must pass.

## Security model & Row Level Security

Every table has RLS enabled (`supabase/migrations/20260822000900_rls_policies.sql`); the summary:

- **Public (anon/authenticated) traffic** can only ever read `approved` surgeon profiles and `approved` events. Draft/submitted/rejected/suspended profiles are invisible to everyone except their owner and admins.
- **Authenticated users** can fully manage their own surgeon profile while it's a `draft`, and move it to `submitted` — but a database trigger (`guard_surgeon_profile_transitions`) blocks any non-admin from setting `approved`/`suspended`/`rejected` or touching approval metadata, even if the application code had a bug that tried to allow it. The same defense-in-depth pattern protects `profiles.role` (`prevent_role_self_escalation`) — a user can never grant themselves admin through a crafted request.
- **Admins** (`profiles.role = 'admin'`) can read and manage everything, via a `SECURITY DEFINER` `current_user_is_admin()` function (avoids RLS self-recursion on `profiles`).
- **`admin_audit_logs`** is admin-read-only and *insert-only for everyone, including admins* — no UPDATE/DELETE policy exists for any role, so the audit trail cannot be rewritten. Writes only ever happen through `log_admin_action()`, a `SECURITY DEFINER` function that re-verifies the caller is an admin and stamps `actor_id = auth.uid()` itself (the caller can't spoof who performed an action).
- **`rate_limit_attempts`** has RLS enabled with *zero* policies — it's reachable only through the `check_rate_limit()` `SECURITY DEFINER` function, used to throttle sign-up, sign-in, password-reset, and profile-submission attempts per IP/user.
- **Surgeon photos** live in a *private* Storage bucket. There is no public/anon storage policy at all — photos are served through `/api/surgeon-photo/[surgeonId]`, a route that re-checks (on every request, server-side) whether the profile is approved, or the caller is its owner or an admin, before minting a short-lived signed URL. An unapproved profile's photo is never reachable by guessing a bucket path.
- Sign-in supports username **or** email; usernames resolve to an email via `get_email_by_username()`, a narrow `SECURITY DEFINER` RPC that returns only an email, nothing else.
- Passwords are handled entirely by Supabase Auth — this codebase never sees or stores a plaintext password.

## Data-source methodology (congresses)

See `supabase/seed/README.md` for the full write-up. In short: every seeded event traces back to a real, fetched public source (an official society page, a dedicated congress microsite, or — flagged explicitly via `date_note` — credible local press coverage when no official page could be found). No event, date, organizer, or URL was invented. Admins add/re-verify events the same way through `/admin/events`, and every event's data-source list is visible on its public detail page.

## Demo data disclosure

`supabase/seed/demo-surgeons.json` seeds a handful of **clearly fictional** sample profiles (`is_demo = true`, names suffixed "(Demo)", emails on the reserved `.example` domain) so the directory isn't empty before real surgeons register. They render with a visible "Sample profile" badge everywhere and never get the verified checkmark shown on real approved profiles.

## Deploying to Vercel

1. Push this repository to GitHub (see below).
2. Import it in [Vercel](https://vercel.com/new).
3. Add the environment variables from `.env.example` in the Vercel project settings (Production, Preview, and Development as needed). Set `NEXT_PUBLIC_SITE_URL` to your real deployed URL.
4. Deploy. Vercel auto-detects Next.js — no custom build command needed.
5. Run `npm run setup:admin` and `npm run seed` **locally, once**, pointed at the same Supabase project (they use the service-role key and are not meant to run inside the Vercel build).

### Pushing to GitHub

```bash
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

## Notes on rendering strategy

Nearly every route is server-rendered per request (`ƒ` in the build output) rather than statically generated, because the header needs the caller's live auth state (signed in vs not, admin vs not) on every page. `robots.txt` and `sitemap.xml` are the exception and are generated statically. If a future iteration wants a static/ISR home page, the auth-aware nav slice would need to move behind a client-side fetch or Next's experimental Partial Prerendering — deliberately not enabled here to keep the caching model simple and predictable.
