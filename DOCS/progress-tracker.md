# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Complete

## Current Goal

- Feature 07: Wire editor home to project APIs - done

## Completed

- **07-wire-editor-home**: Wired the editor shell/sidebar/dialog flow to real project data. `app/editor/layout.tsx` fetches owned and shared projects server-side via `lib/project-data.ts` and passes them into the client shell; the sidebar now renders real projects, links project rows to `/editor/[projectId]`, and keeps owner-only rename/delete actions. Added `hooks/use-project-actions.ts` to manage create/rename/delete dialog state and API mutations: create generates a slug plus short suffix room ID, posts it as the project ID so the project ID and room ID stay aligned, then navigates to the workspace; rename patches and refreshes; delete redirects to `/editor` when deleting the active workspace and otherwise refreshes. Added a minimal authenticated `/editor/[projectId]` workspace route. `POST /api/projects` now accepts a validated optional project ID and returns `409` on ID collision. `npm run lint` and `npm run build` pass.

- **06-project-apis**: Added backend-only REST routes for `GET /api/projects`, `POST /api/projects`, `PATCH /api/projects/[projectId]`, and `DELETE /api/projects/[projectId]`; routes use Clerk `auth()` user IDs, return `401` for unauthenticated requests, enforce owner-only rename/delete with `403` for non-owner mutations, default missing create names to `Untitled Project`, validate JSON request bodies, serialize project timestamps as ISO strings, keep shared route logic in `lib/project-api.ts`, and let project API routes pass through `proxy.ts` so route handlers can return the required API status codes. UI remains mock-only and unwired per spec. `npm run lint` and `npm run build` pass.

- **05-prisma**: Created `prisma/models/project.prisma` with `Project` (ownerId, name, description, status enum DRAFT/ARCHIVED, canvasJsonPath, timestamps, indexes on ownerId and createdAt) and `ProjectCollaborator` (projectId cascade-delete relation, email, createdAt, unique on project/email, indexes on email and project/date); created `lib/prisma.ts` as a cached singleton that branches on `DATABASE_URL` — `prisma+postgres://` uses Accelerate (`{ accelerateUrl }`), otherwise `@prisma/adapter-pg` with `PrismaPg({ connectionString })`; ran `prisma migrate dev --name init` and `prisma generate`; `npm run build` passes. Note: Prisma v7 no longer allows `url` in schema.prisma datasource block — URL is configured in `prisma.config.ts` for migrations and passed via adapter/accelerateUrl to the client constructor.
- **04-project-dialogs**: Added the `/editor` home empty state with a wired `New Project` button; added a dedicated project dialog controller/provider for create, rename, and delete dialog state, form state, and loading state; sidebar now uses mock owned/shared project data, shows rename/delete actions only for owned projects, hides shared project actions, and has a mobile backdrop scrim. No API calls or persistence added. `npm run lint` and `npm run build` pass.
- **04-project-dialogs refinement**: Create Project slug preview now shows only the generated slug value without explanatory label text.
- **03-auth**: Installed `@clerk/ui`; root layout wraps the app in `ClerkProvider` using Clerk `dark` theme with project CSS variables; added `/sign-in` and `/sign-up` catch-all Clerk pages with minimal responsive two-panel auth layout; added root `proxy.ts` with protected-by-default Clerk route protection and public auth routes from Clerk URL env vars; `/` redirects authenticated users to `/editor` and unauthenticated users to `/sign-in`; editor chrome moved under `/editor` layout; editor navbar includes Clerk `UserButton`; `npm run build` passes.
- **03-auth visual refinement**: Auth screen updated to match the provided reference with a stronger two-panel layout, compact brand mark, large left-panel headline, icon-led feature list, footer copyright, centered Clerk card, and explicit Clerk appearance/font overrides using project CSS variables. `npm run build` passes.
- **03-auth brand update**: Replaced remaining auth-page "Ghost AI" references with "SYSDES".
- **02-editor**: `components/editor/editor-navbar.tsx` (fixed bar, PanelLeftOpen/PanelLeftClose toggle, left/center/right sections); `components/editor/project-sidebar.tsx` (overlay, slide-from-left, Tabs: My Projects/Shared with empty states, New Project footer button); dialog pattern uses existing shadcn `dialog.tsx` with CSS tokens — no new dialogs built. TypeScript clean.
- **01-design-system**: shadcn/ui initialized (Tailwind v4, RSC, TSX); installed Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea; installed lucide-react; `lib/utils.ts` with `cn()` helper; `globals.css` updated with dark-only theme (project CSS custom properties + shadcn semantic tokens mapped to dark palette).

## In Progress

- None.

## Next Up

- Implement the collaborative workspace canvas when specified by the next feature.

## Open Questions

- None currently.

## Architecture Decisions

- Auth pages are kept outside editor chrome by moving `EditorShell` from the root layout into `app/editor/layout.tsx`; protected app workspace begins at `/editor`.
- Clerk route protection is centralized in root `proxy.ts` per Next.js 16 conventions; all non-auth routes are protected by default.
- Dark-only theme: `:root` in `globals.css` is set to the dark design tokens — no light mode, no `.dark` class toggling needed. shadcn semantic tokens (`--background`, `--foreground`, etc.) are mapped to the project's custom properties so both shadcn components and project components share one source of truth.
- shadcn components live in `components/ui/` and must not be modified after generation; customise via wrappers or CSS tokens only.
- `lib/utils.ts` provides `cn()` (clsx + tailwind-merge) as the standard class-merging utility.

## Session Notes

- Feature 06 intentionally lists only owned projects because collaborator lookup/listing by email is not specified yet.

- Project uses Next.js 16.2.6, React 19, Tailwind v4 (`@import "tailwindcss"`), shadcn/ui 4.7.0 with `base-nova` style.
- Path alias `@/*` → project root (tsconfig).
- Do not use raw Tailwind color classes (`zinc-*`) or hardcoded hex values in components — use CSS custom property tokens.
- Feature 03 auth spec requires Next.js 16 `proxy.ts` instead of `middleware.ts`; local Next docs confirm proxy uses the Node.js runtime and a `proxy` file at project root.
