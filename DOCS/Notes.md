# Feature 05 Implementation Notes:

## Prisma v7 Notes

Prisma 7 introduced breaking changes that differ from most training data and online examples:

- **No `url` in schema files.** `datasource db` blocks must not include a `url` field. The connection URL for migrations is set in `prisma.config.ts` under `datasource.url`. Putting `url = env("DATABASE_URL")` in `schema.prisma` causes a hard `P1012` validation error.
- **Client connection is constructor-injected.** The `PrismaClient` constructor accepts either `{ adapter }` (for a driver adapter like `PrismaPg`) or `{ accelerateUrl }` (for Prisma Postgres / Accelerate). There is no global URL resolution fallback.
- **`PrismaPg` API changed.** `@prisma/adapter-pg` v7 accepts `new PrismaPg({ connectionString })` directly — passing a `pg.Pool` instance no longer works.
- **Generator provider is `prisma-client`.** The old `prisma-client-js` provider is replaced. The generated output directory is set via `output` in the generator block (here: `app/generated/prisma`).
- **Import from the generated path, not `@prisma/client`.** Import `PrismaClient` and generated types from `@/app/generated/prisma/client`. There is no barrel `index.ts` in the output directory; always import the specific module file.
- **Multi-file schema is supported.** Additional `.prisma` files placed under `prisma/` (e.g. `prisma/models/project.prisma`) are composed automatically when `prisma.config.ts` sets `schema: "prisma/"`.



# Feature 07 Implementation Notes

## Differences From The Spec

- **Spec:** The editor home page is a server component and fetches project lists server-side.
  **Implemented:** Project fetching happens in `app/editor/layout.tsx`, which is a server component, then passes owned/shared projects into the client `EditorShell`. The `/editor` page still renders the existing client `EditorHome` because it only needs the create-dialog interaction.

- **Spec:** Use the existing project data helper.
  **Implemented:** There was no dedicated project-list helper yet, so `lib/project-data.ts` was added as the server-only helper for owned/shared project loading and workspace access checks.

- **Spec:** The project ID and Liveblocks room ID should stay aligned.
  **Implemented:** `POST /api/projects` now accepts a validated optional `id`. The create hook generates the room ID client-side from the slug plus suffix and sends it as the project ID, so `/editor/[projectId]` and the future Liveblocks room ID can use the same value.

- **Spec:** Create navigates to the new workspace.
  **Implemented:** Added a minimal `/editor/[projectId]` route so create navigation has a real protected destination before the full collaborative canvas feature exists.
