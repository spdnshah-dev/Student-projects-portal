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

## Status — foundation (milestones 1–2)

This repository currently contains the **foundation**:

- **Milestone 1 — project setup:** Next.js + TypeScript + Tailwind + Prisma,
  and the Learnbay brand shell (`components/brand/*`) every screen sits in,
  with design tokens lifted from the frozen canvas (`tailwind.config.ts`).
- **Milestone 2 — data model:** the complete Prisma schema
  (`prisma/schema.prisma`) — users, profiles, projects, version snapshots,
  certificates, reviews, link checks, AI sessions/messages, embeddings
  (pgvector), and the audit log.

Still to come (spec build order): auth + fixed-password seed, the student flow,
the state machine, the admin flow, the public portal, the Open-project flow,
certificate uploads, the SSRF-safe link checker, the AI assistant, rate limits,
and logging.

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
