# Learnbay Projects

Public showcase portal where Learnbay students publish the data, AI, and
software projects they build during their course. Recruiters browse it to find
candidates; prospective learners browse it to see what they would build.

The **technical build specification** is the single source of truth; the Claude
Design canvas holds the exact screens.

## Stack

| Piece                        | Role                                                        |
| ---------------------------- | ----------------------------------------------------------- |
| Next.js (App Router, TS)     | Pages **and** backend API routes; SSR for SEO on profiles   |
| PostgreSQL + Prisma          | Main database and type-safe data layer / migrations         |
| pgvector                     | Assistant search vectors, inside the same database          |
| Tailwind CSS                 | Utility styling matched to the frozen design tokens         |
| Vercel Blob → S3             | Certificate file storage (test → production)                |
| Always-on worker             | Daily SSRF-safe link checker + AI vector building           |
| Google Gemini (paid)         | The assistant's answers                                     |

## Status — milestones 1–3

- **Milestone 1 — project setup:** Next.js + TypeScript + Tailwind + Prisma,
  and the Learnbay brand shell (`components/brand/*`) every screen sits in,
  with design tokens lifted from the frozen canvas (`tailwind.config.ts`).
- **Milestone 2 — data model:** the complete Prisma schema
  (`prisma/schema.prisma`) — users, profiles, projects, version snapshots,
  certificates, reviews, link checks, AI sessions/messages, embeddings
  (pgvector), and the audit log.
- **Milestone 3 — sign-in, roles, and the seed:** email/password login
  (`/login`) shared by students and admins, scrypt password hashing and a
  signed-cookie session (`lib/auth/*`), server-side role guards
  (`requireUser` / `requireRole`) protecting `/dashboard`, `/admin`, `/super`,
  and a fixed-password seed (`prisma/seed.ts`) creating the super admin, a test
  admin, and sample students with published profiles/projects.
- **Milestone 4 — student flow:** set password (`/set-password`, email code
  skipped in the test phase), the placeholder consent step (`/consent`),
  profile setup (`/profile/setup`), add a project (`/projects/new`), and the
  student dashboard (`/dashboard`) with Overview and Link-problems tabs. Forms
  save via server actions with server-side auth; submitting a project snapshots
  it into a version and moves it to In review.
- **Milestone 5 — the state machine:** the shared lifecycle for projects and
  profiles. Pure transition rules (`lib/lifecycle-rules.ts`, unit-tested with
  `npm test`) plus the DB operations (`lib/lifecycle.ts`): submit, edit-while-
  published (opens a new pending version, old version stays public), approve,
  send back, take down, restore — each snapshotting versions, moving the
  `approvedVersionId` pointer, and writing review + audit rows. Public-
  visibility rules live in `lib/visibility.ts` (a project is public only if it
  and its profile are published and the account is active).
- **Milestone 6 — the admin flow (desktop):** the admin area under `/admin`
  with a shared top nav — overview, the project **review queue** and the
  **profiles** queue (each with Waiting / Sent back / Published·Live tabs), the
  project and profile **review screens** (open the live link, see it as
  visitors will, approve/publish or **send back with a required note**), a
  **take-down** control for live projects, and the **students** list. Every
  action is server-checked (admin + super admin) and drives the milestone-5
  state machine. Link problems is a stub until the link-checker milestone.
- **Milestone 7 — the public portal (no login):** Home (`/`) with the live
  published-projects grid and Category / Domain / keyword / sort filters; the
  Students list (`/students`); public profiles (`/students/[id]`); and project
  detail pages (`/projects/[id]`) with the Learnbay bar, a Share button, the
  visitor-facing hero, and "more by this student". All reads go through
  `lib/public.ts`, which enforces the visibility rules (only PUBLISHED items
  whose profile is Live and account active). "Open project" opens the live URL
  in a new tab for now — the loading popup is the next milestone. View
  counts / likes aren't shown (no analytics data model yet).
- **Milestone 8 — the Open-project flow:** the centre-screen popup
  (`OpenProjectDialog`) with the animated Learnbay mark, project + student +
  description. It polls `POST /api/projects/[id]/check`, which runs an
  (interim) SSRF-safe check (`lib/ssrf.ts`: https-only, blocks IP literals /
  localhost / metadata / private ranges, timeout, no redirect-follow), records
  a `link_checks` row, and updates the project's link-health flags. Ready state
  opens the project in a new tab; after 90 s it offers Open-anyway / Close.

Still to come (spec build order): certificate uploads, the full SSRF-safe link
checker + daily worker, the AI assistant, rate limits, logging, and super-admin
management of admins/students.

### Design vs. tech-doc decisions (milestone 4)

The frozen design and the tech doc (source of truth) differ in a few places;
resolved with the product owner:

- **Added** profile fields the design shows but the doc's table omits: years of
  experience, work domain, LinkedIn, profile photo (upload later), and
  certificate name + issuer. Also kept the doc's `headline` / `about`.
- **Project domain:** the doc says domain is per-project, so Add Project has a
  domain selector even though that board omits one.
- **AI assistant files:** followed the doc — one site-wide assistant reading
  profile/project/certificate text, so the design's per-project "assistant
  file" uploads and per-project chatbot are not built.
- **Deferred:** profile photo + certificate image uploads (file-upload
  milestone), live-link "Test" button (link-checker milestone), and the
  dashboard view-analytics / "who viewed" charts (no data model yet).

### Test accounts (after `npm run db:seed`)

All seeded accounts share the fixed password **`learnbay-test-2026`** (test
phase only — not for production):

| Role        | Email                                               |
| ----------- | --------------------------------------------------- |
| Super admin | `spandan@learnbay.co`                               |
| Admin       | `karan.mehta@example.com`                           |
| Student     | `riya.sharma@example.com` (+ other sample students) |

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env    # fill in DATABASE_URL (Postgres with pgvector), etc.

# 3. Generate the Prisma client
npm run prisma:generate

# 4. Create the database schema (needs a reachable Postgres with pgvector)
npm run prisma:migrate   # dev: creates + applies a migration

# 5. Run the app
npm run dev              # http://localhost:3000
```

### Database notes

- `DATABASE_URL` must point at a PostgreSQL that has the **`vector`** extension
  available (Neon and Vercel Postgres both support pgvector). The migration
  enables the extension; the `embeddings.embedding` column is `vector(768)` to
  match the Gemini `text-embedding-004` model.
- `DIRECT_URL` is used by Prisma Migrate (the non-pooled connection on Neon).

## Project layout

```
app/                 Next.js App Router pages (+ API routes, added per milestone)
components/brand/     Brand shell: Logo, SiteHeader, SiteFooter
components/ui/         Reusable primitives: Button, Badge
lib/                  prisma client singleton, fixed-list constants
prisma/schema.prisma  The full data model
```

## Scripts

| Script                    | Does                                      |
| ------------------------- | ----------------------------------------- |
| `npm run dev`             | Start the dev server                      |
| `npm run build`           | Production build                          |
| `npm run typecheck`       | `tsc --noEmit`                            |
| `npm run lint`            | ESLint (next/core-web-vitals)             |
| `npm run prisma:generate` | Generate the Prisma client                |
| `npm run prisma:migrate`  | Create + apply a dev migration            |
| `npm run db:seed`         | Seed fixed-password test accounts (later) |
