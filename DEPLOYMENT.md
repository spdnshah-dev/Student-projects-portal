# Deploying Learnbay Projects — Phase 1 (Vercel test environment)

The goal of Phase 1 is a working site the team can click through, with
fixed-password test accounts and no real student data. The application code is
identical in test and production; only hosting and configuration change.

## What you need

- A **Vercel** project (the Next.js app).
- A **PostgreSQL with pgvector** — Neon or Vercel Postgres (both support
  pgvector).
- A **Vercel Blob** store (certificate files).
- A **Google Gemini** API key (paid tier) for the assistant.
- A small **always-on host** for the worker (Railway, Render, Fly.io, a tiny
  VM…) — Vercel's own functions sleep, so the daily link check + vector build
  can't live there.

## 1. Database (Neon)

1. Create a Neon project and a database named `learnbay_projects`.
2. Copy two connection strings:
   - the **pooled** URL → `DATABASE_URL`
   - the **direct** (non-pooling) URL → `DIRECT_URL` (used by Prisma Migrate).
3. pgvector: the first migration runs `CREATE EXTENSION IF NOT EXISTS "vector"`,
   so no manual step is needed on Neon/Vercel Postgres.

## 2. Environment variables (Vercel → Settings → Environment Variables)

Copy `.env.example` and fill in. At minimum for a working test site:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL`, `DIRECT_URL` | from Neon |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `FIXED_PASSWORD_TEST_MODE` | `true` for Phase 1 |
| `BLOB_READ_WRITE_TOKEN` | from the Vercel Blob store |
| `GEMINI_API_KEY` | Google AI Studio (paid tier) |
| `NEXT_PUBLIC_LEARNBAY_HOME_URL` | `https://www.learnbay.co` |
| rate-limit / link-check / AI vars | optional — sensible defaults in code |

In production (Phase 2) these come from **AWS Secrets Manager**, and
`FIXED_PASSWORD_TEST_MODE` must be unset/`false`.

## 3. Build command

Vercel runs `npm run vercel-build`:

```
prisma generate && prisma migrate deploy && next build
```

`prisma migrate deploy` applies the migrations (including the pgvector
extension) on each deploy. `postinstall` also runs `prisma generate` so the
client is always present.

## 4. Seed the test accounts (once)

From a machine with the env vars set (or Vercel's CLI / a one-off job):

```bash
npm run db:seed
```

Creates the super admin (`spandan@learnbay.co`), a test admin, and sample
students with published profiles/projects. Every account's password is
`learnbay-test-2026` (test only). Students set/reset a real password at
`/set-password`.

## 5. Build the assistant's search index (once, after seeding)

The seed writes projects/profiles but not embeddings. Sign in as the super
admin and POST to the reindex endpoint (or use a REST client with the session
cookie):

```
POST /api/admin/reindex      # super-admin only; builds pgvector embeddings
```

New approvals index themselves automatically from then on.

## 6. The always-on worker

Deploy the repo to a small always-on service and run:

```bash
npm run worker:link-check
```

It checks every published link at start and every `LINK_CHECK_INTERVAL_HOURS`
(default 24). Give it the same `DATABASE_URL` and the link-check env vars, **no
app secrets it doesn't need**, and run it behind an egress firewall with no
access to the cloud metadata service (it only needs outbound HTTPS to the
public web).

## 7. Smoke test

- `GET /api/health` → `{ ok: true, db: "up", integrations: { ai, storage } }`.
- Visit `/` — published projects and filters load.
- `/login` as `spandan@learnbay.co` / `learnbay-test-2026` → `/super`.
- As a student: `/set-password` → consent → profile setup → add a project →
  submit; as the admin: `/admin/queue` → approve; back on `/` the project
  appears.
- Open a project → the popup checks the link and opens it in a new tab.
- Ask the assistant a question in the "Ask AI" panel.

## Phase 2 (AWS) — later

Same code on a `projects.learnbay.co` subdomain with SSL: Next.js on Amplify or
ECS behind CloudFront, PostgreSQL on RDS with pgvector, certificates in S3
served from a separate domain, the worker on a small ECS/EC2 task, secrets in
AWS Secrets Manager (not readable by the code that builds AI answers), and the
real consent form + email notifications. Remove the seed and turn on the email
verification code before real students use the site.
