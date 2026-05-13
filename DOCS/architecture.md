# Architecture Context

## Stack

| Layer            | Technology              | Role                                                           |
| ---------------- | ----------------------- | -------------------------------------------------------------- |
| Framework        | Next.js 16 + TypeScript | Full-stack app with server/client boundaries                   |
| UI               | Tailwind + shadcn/ui    | Component composition and styling                              |
| Auth             | Clerk                   | User identity and route protection                             |
| Database         | Prisma + PostgreSQL     | Relational metadata: projects, collaborators, specs, task runs |
| Canvas           | Liveblocks + React Flow | Real-time collaborative canvas, presence, and cursors          |
| Background tasks | Trigger.dev             | Durable AI generation workflows                                |
| Artifact storage | Vercel Blob             | Canvas snapshots and generated Markdown specs                  |

## System Boundaries

- `app/api` — Authenticated request handlers: input validation, ownership checks, task triggering, and persistence.
- `trigger` — Long-running background jobs: AI design generation and spec generation.
- `lib` — Shared infrastructure: Prisma client, access control helpers, and utilities.
- `components` — UI composition: canvas surfaces, sidebars, dialogs, and interactive elements.
- `prisma` — Schema files (multi-file, under `prisma/`), migrations (`prisma/migrations/`), and `prisma.config.ts` at root. Generated client output is in `app/generated/prisma/`.
- `data` — Legacy local directory. Not used for new artifacts.

## Storage Model

- **Database**: metadata, ownership, relationships, and task run records.
- **Vercel Blob**: generated artifacts — canvas snapshots at `canvas/{projectId}.json` and specs at `specs/{projectId}/{specId}.md`.
- Project records, spec records, and task run records belong in PostgreSQL.
- Canvas content and Markdown output are stored in and retrieved from Vercel Blob.
- The blob URL is stored in the database (`canvasJsonPath`, `filePath`) as the reference to the artifact.

## Auth and Collaboration Model

- Every project has a single owner (Clerk user ID).
- Projects can include additional collaborators.
- Only authenticated users can access protected routes.
- Only the owner or a collaborator can mutate project resources.
- Liveblocks room tokens are issued only after verifying project membership.

## Starter System Designs

- Prebuilt templates are static canvas snapshots stored in the codebase.
- Templates are loaded into the active Liveblocks room when a user imports one.
- Import can occur on canvas creation or from within the editor at any time.
- Template data follows the same node/edge schema as user-created canvas content.
- Templates do not require a separate database record; they are resolved by template ID at import time.

## AI Generation Model

### Design Generation

- Input: user prompt, project context, and current canvas state.
- Execution: durable background task via Trigger.dev.
- Output: structured node and edge updates written into the shared Liveblocks room.

### Spec Generation

- Input: current canvas graph and project context.
- Execution: durable background task via Trigger.dev.
- Output: Markdown technical spec saved to the filesystem and linked to the project in the database.

## Prisma v7 Notes

Prisma 7 introduced breaking changes that differ from most training data and online examples:

- **No `url` in schema files.** `datasource db` blocks must not include a `url` field. The connection URL for migrations is set in `prisma.config.ts` under `datasource.url`. Putting `url = env("DATABASE_URL")` in `schema.prisma` causes a hard `P1012` validation error.
- **Client connection is constructor-injected.** The `PrismaClient` constructor accepts either `{ adapter }` (for a driver adapter like `PrismaPg`) or `{ accelerateUrl }` (for Prisma Postgres / Accelerate). There is no global URL resolution fallback.
- **`PrismaPg` API changed.** `@prisma/adapter-pg` v7 accepts `new PrismaPg({ connectionString })` directly — passing a `pg.Pool` instance no longer works.
- **Generator provider is `prisma-client`.** The old `prisma-client-js` provider is replaced. The generated output directory is set via `output` in the generator block (here: `app/generated/prisma`).
- **Import from the generated path, not `@prisma/client`.** Import `PrismaClient` and generated types from `@/app/generated/prisma/client`. There is no barrel `index.ts` in the output directory; always import the specific module file.
- **Multi-file schema is supported.** Additional `.prisma` files placed under `prisma/` (e.g. `prisma/models/project.prisma`) are composed automatically when `prisma.config.ts` sets `schema: "prisma/"`.

## Invariants

1. Request handlers do not run long-lived AI work — that belongs in background tasks.
2. Metadata and large generated artifacts are stored in separate layers.
3. Auth and ownership are enforced at every mutation boundary.
4. Client components are used only where browser interactivity or real-time state requires them.
5. The canvas schema must remain consistent between user-created content and imported templates.
