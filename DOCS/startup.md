# Local Startup Guide

## Prerequisites

- Node.js 20+
- npm
- A running PostgreSQL instance (or use the Prisma-hosted DB already configured)
- Accounts / API keys for: Clerk, Liveblocks, Vercel Blob, Google AI, Trigger.dev

---

## 1. Install dependencies

```bash
npm install
```

---

## 2. Configure environment variables

Create `.env.local` at the project root (if it doesn't exist) with the following keys:

```env
# Clerk — auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/editor
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/editor

# PostgreSQL (via Prisma)
DATABASE_URL=

# Liveblocks — collaborative canvas
LIVEBLOCKS_PUBLIC_KEY=
LIVEBLOCKS_SECRET_KEY=

# Vercel Blob — artifact storage
BLOB_READ_WRITE_TOKEN=

# Google AI — AI generation
GOOGLE_AI_API_KEY=

# Trigger.dev — background tasks
TRIGGER_SECRET_KEY=
TRIGGER_PROJECT_REF=
```

Get each key from:
- **Clerk**: https://dashboard.clerk.com
- **Liveblocks**: https://liveblocks.io/dashboard
- **Vercel Blob**: https://vercel.com/dashboard → Storage → Blob
- **Google AI**: https://aistudio.google.com/apikey
- **Trigger.dev**: https://cloud.trigger.dev → your project → API keys

---

## 3. Generate the Prisma client

```bash
npx prisma generate
```

---

## 4. Run database migrations

```bash
npx prisma migrate deploy
```

> If this is a brand new database, this applies all migrations in `prisma/migrations/`.

---

## 5. Start the Next.js dev server

```bash
npm run dev
```

App runs at **http://localhost:3000**.

---

## 6. Start the Trigger.dev dev worker (separate terminal)

Background tasks (AI generation, spec generation) run through Trigger.dev. In a second terminal:

```bash
npx trigger.dev@latest dev
```

This connects your local worker to the Trigger.dev cloud and listens for task runs. Without this, AI and spec generation features won't execute.

---

## Running everything at once

You need **two terminals** running simultaneously:

| Terminal | Command | Purpose |
|----------|---------|---------|
| 1 | `npm run dev` | Next.js app |
| 2 | `npx trigger.dev@latest dev` | Background task worker |

---

## Verify it's working

1. Open http://localhost:3000 — you should see the sign-in page.
2. Sign up or sign in via Clerk.
3. Create a project — confirms DB connection and Prisma are working.
4. Open the editor — confirms Liveblocks canvas is loading.
5. Trigger an AI generation — confirms Trigger.dev worker is connected and Google AI key is valid.

---

## Common issues

**`DATABASE_URL` connection error** — check the connection string format and that the DB is reachable. Prisma-hosted URLs require `?sslmode=verify-full`.

**Clerk redirect loop** — make sure both `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL` are set correctly.

**Trigger.dev worker not picking up tasks** — ensure `TRIGGER_SECRET_KEY` and `TRIGGER_PROJECT_REF` match the project in the Trigger.dev dashboard and the dev worker is running.

**Blob upload failing** — `BLOB_READ_WRITE_TOKEN` must be a read-write token, not read-only.
