# shadcn Migration Checklist

Status: Complete

This checklist maps legacy UI patterns to their shadcn replacements and records migration completion status.

| Legacy pattern | shadcn replacement | Where used now | Status |
| --- | --- | --- | --- |
| Custom button/link classes (`.btn`, ad-hoc utility stacks) | `Button` and `buttonVariants()` | `src/layouts/Layout.astro`, `src/pages/**/*.astro` | Done |
| Native text fields with custom classes | `Input` | `src/pages/events/new.astro`, `src/pages/events/[id]/edit.astro` | Done |
| Native labels with custom classes | `Label` | Event create/edit forms | Done |
| Native textareas with custom classes | `Textarea` | Event create/edit forms | Done |
| Native select markup with custom classes | `Select` primitives | `src/components/ShadcnIslandDemo.tsx` (reference implementation) | Done |
| Hand-rolled event/panel containers | `Card` primitives (`CardHeader`, `CardContent`, `CardFooter`) | Home, auth wrappers, event pages, history, settings | Done |
| Custom badge chips/count pills | `Badge` | `src/components/EventCard.tsx`, event detail/status areas | Done |
| Manual section divider markup | `Separator` | Homepage section split and demo | Done |
| Custom loading placeholder blocks | `Skeleton` | React island demo and primitive coverage | Done |
| Bespoke modal/menu/tab patterns | `Dialog`, `DropdownMenu`, `Tabs` | `src/components/ShadcnIslandDemo.tsx` | Done |
| Toast-style transient feedback selectors | Inline feedback panels in shadcn card/form shells | `events/new`, `events/[id]/edit`, `events/[id]`, `settings` | Done |
| Starter/legacy Astro assets and duplicate CSS paths | Removed deprecated artifacts | `src/components/Welcome.astro`, `src/assets/*`, stale global selectors | Done |

## Usage Conventions (Approved)

- Import shared primitives from `@/components/ui` whenever available.
- For button-styled links in `.astro` pages, use `buttonVariants()` on `<a>` elements instead of adding extra client islands.
- Keep shared shell sections on card slot primitives (`CardHeader`, `CardContent`, `CardFooter`) for consistent page structure.
- Keep form and RSVP feedback inline with stable panel IDs/test IDs instead of toast nodes.
- Use semantic design tokens from `src/styles/global.css`; avoid introducing route-local color/spacing systems.

## Approved Exceptions

- Clerk auth widgets (`<SignIn />`, `<SignUp />`) remain provider-rendered components. Only the surrounding Astro shell is styled with project shadcn patterns.
- UI primitive showcase coverage remains in `src/components/ShadcnIslandDemo.tsx` for interaction/regression testing, not as production page UI.

## Follow-up Items

- If additional routes/components are added, default to `@/components/ui` primitives and update this checklist when introducing new replacement mappings.
- If future UX requirements need new primitives (for example toast or command palette), add them through shadcn first and document the convention updates in `README.md` and this checklist.
