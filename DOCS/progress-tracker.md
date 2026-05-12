# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Complete

## Current Goal

- Feature 03: Auth — done

## Completed

- **03-auth**: Installed `@clerk/ui`; root layout wraps the app in `ClerkProvider` using Clerk `dark` theme with project CSS variables; added `/sign-in` and `/sign-up` catch-all Clerk pages with minimal responsive two-panel auth layout; added root `proxy.ts` with protected-by-default Clerk route protection and public auth routes from Clerk URL env vars; `/` redirects authenticated users to `/editor` and unauthenticated users to `/sign-in`; editor chrome moved under `/editor` layout; editor navbar includes Clerk `UserButton`; `npm run build` passes.
- **03-auth visual refinement**: Auth screen updated to match the provided reference with a stronger two-panel layout, compact brand mark, large left-panel headline, icon-led feature list, footer copyright, centered Clerk card, and explicit Clerk appearance/font overrides using project CSS variables. `npm run build` passes.
- **03-auth brand update**: Replaced remaining auth-page "Ghost AI" references with "SYSDES".
- **02-editor**: `components/editor/editor-navbar.tsx` (fixed bar, PanelLeftOpen/PanelLeftClose toggle, left/center/right sections); `components/editor/project-sidebar.tsx` (overlay, slide-from-left, Tabs: My Projects/Shared with empty states, New Project footer button); dialog pattern uses existing shadcn `dialog.tsx` with CSS tokens — no new dialogs built. TypeScript clean.
- **01-design-system**: shadcn/ui initialized (Tailwind v4, RSC, TSX); installed Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea; installed lucide-react; `lib/utils.ts` with `cn()` helper; `globals.css` updated with dark-only theme (project CSS custom properties + shadcn semantic tokens mapped to dark palette).

## In Progress

- None.

## Next Up

- Feature 04 (TBD)

## Open Questions

- None currently.

## Architecture Decisions

- Auth pages are kept outside editor chrome by moving `EditorShell` from the root layout into `app/editor/layout.tsx`; protected app workspace begins at `/editor`.
- Clerk route protection is centralized in root `proxy.ts` per Next.js 16 conventions; all non-auth routes are protected by default.
- Dark-only theme: `:root` in `globals.css` is set to the dark design tokens — no light mode, no `.dark` class toggling needed. shadcn semantic tokens (`--background`, `--foreground`, etc.) are mapped to the project's custom properties so both shadcn components and project components share one source of truth.
- shadcn components live in `components/ui/` and must not be modified after generation; customise via wrappers or CSS tokens only.
- `lib/utils.ts` provides `cn()` (clsx + tailwind-merge) as the standard class-merging utility.

## Session Notes

- Project uses Next.js 16.2.6, React 19, Tailwind v4 (`@import "tailwindcss"`), shadcn/ui 4.7.0 with `base-nova` style.
- Path alias `@/*` → project root (tsconfig).
- Do not use raw Tailwind color classes (`zinc-*`) or hardcoded hex values in components — use CSS custom property tokens.
- Feature 03 auth spec requires Next.js 16 `proxy.ts` instead of `middleware.ts`; local Next docs confirm proxy uses the Node.js runtime and a `proxy` file at project root.
