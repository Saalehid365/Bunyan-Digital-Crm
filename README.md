# Bunyan Digital CRM

An internal CRM for Bunyan Digital: manage clients, the services run for each of them
(eBay management, website management, etc.), and track the work being done through
Backlog → In Progress → In Review → Done, with a per-client activity/work-log timeline.

## Stack

- Next.js 16 (App Router, TypeScript) + Tailwind CSS v4 + shadcn/ui
- Prisma ORM + PostgreSQL
- Auth.js (NextAuth v5) — password sign-in and passwordless email magic-link sign-in
  (via Resend), restricted to admin-created accounts only
- dnd-kit (Kanban board) · Recharts (dashboard) · next-themes (light/dark)

## Local development

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (a Postgres connection
   string — [Neon](https://neon.com) works well) and `AUTH_SECRET` (generate one with
   `npx auth secret`). Leave `RESEND_API_KEY` unset to have magic sign-in links print to
   the terminal instead of being emailed.
2. Install dependencies and set up the database:
   ```bash
   npm install
   npm run db:migrate
   npm run db:seed
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). The seed script creates an admin
   account — check the seed output for its email, then sign in via the printed magic link.

## Roles

- **Admin** — manages clients, the service catalog, team accounts, and sees everything.
- **Member** — only sees clients they've been explicitly assigned to.

## Deployment

Deploy on Vercel with a hosted Postgres database (Neon recommended) and a
[Resend](https://resend.com) account with a verified sending domain for real magic-link
emails. Required environment variables are listed in `.env.example`.
