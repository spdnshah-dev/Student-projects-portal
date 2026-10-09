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

Still to come (spec build order): the student flow (set password, consent,
profile setup, add project, dashboard), the state machine, the admin flow, the
public portal, the Open-project flow, certificate uploads, the SSRF-safe link
checker, the AI assistant, rate limits, and logging.

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
