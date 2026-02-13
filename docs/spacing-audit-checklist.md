# Spacing Audit Checklist

This audit captures spacing inconsistencies across primary routes and shared shells.
It is intentionally scoped for follow-up implementation in `US-005`.

## Conventions To Preserve

- Keep the existing spacing scale from `src/styles/global.css` (`--space-*`) and equivalent Tailwind spacing utilities.
- Keep card shell structure consistent with shadcn slot sections (`card-header`, `card-content`, `card-footer`).
- Keep existing touch-target minimum sizing (`min-h-11 min-w-11`) on interactive controls.
- Do not introduce a new spacing system, custom per-page scales, or one-off wrapper conventions.

## Route Audit (Desktop + Mobile)

| Area | Desktop Observation | Mobile Observation | Status |
| --- | --- | --- | --- |
| `src/layouts/Layout.astro` main container | Main wrapper uses `p-4 sm:p-6 lg:p-8`, while several pages add another top-level `p/px` wrapper. | Combined padding can feel oversized at small widths when pages nest `p-4` inside main. | Open |
| `src/pages/index.astro` | Home page adds nested `p-4 sm:p-6` inside layout main, creating double horizontal/vertical spacing compared with other pages. | Intro content starts deeper than other routes because of nested page + layout padding. | Open |
| `src/pages/events/new.astro` and `src/pages/events/[id]/edit.astro` | Uses `mt-6 sm:mt-10`; cards use `px-6 sm:px-8`, matching most app forms. | Uses `px-4 sm:px-0` on section, which differs from list/detail pages using `sm:px-6`. | Open |
| `src/pages/events/[id].astro` | Detail cards have consistent internal spacing, but section wrapper width/padding differs from create/edit forms. | `px-4 sm:px-6` feels denser than form routes at `sm` due to mismatch with `sm:px-0` pattern there. | Open |
| `src/pages/history.astro` | History shell matches detail route spacing, but diverges from form pages and auth wrappers. | List card rhythm is consistent, but page edge gutters differ from form/auth shells. | Open |
| `src/pages/settings.astro` | Matches form page rhythm (`mt-6 sm:mt-10`, `px-6 sm:px-8`). | Same `sm:px-0` section pattern as forms; differs from history/detail behavior. | Open |
| `src/pages/profile.astro` | Missing outer shell spacing wrapper (`mt`, `px`, `pb`) used by other authenticated pages. | Profile card starts immediately in main area with no top offset, visually inconsistent with adjacent routes. | Open |
| `src/pages/sign-in.astro`, `src/pages/sign-up.astro`, `src/pages/access-denied.astro` | Uses `mt-10 sm:mt-16`, larger top spacing than authenticated app pages (`mt-6 sm:mt-10`). | Top spacing jumps notably between auth and app routes on small screens. | Open |
| `src/components/HeaderMobileSheet.tsx` + `src/layouts/Layout.astro` header | Desktop and mobile nav share `min-h-11` targets but use different horizontal spacing/grouping conventions. | Mobile sheet item padding (`px-3 py-2.5`) and header top-row spacing do not fully mirror desktop nav rhythm. | Open |

## Actionable Fix Checklist (For US-005)

- [x] **SP-001**: Define one page-shell spacing recipe for authenticated content pages and apply consistently.
  - Target: `src/pages/index.astro`, `src/pages/history.astro`, `src/pages/events/[id].astro`, `src/pages/settings.astro`, `src/pages/profile.astro`
- [x] **SP-002**: Remove double outer padding on homepage by aligning inner wrapper with `Layout` main container responsibilities.
  - Target: `src/pages/index.astro`, `src/layouts/Layout.astro`
- [x] **SP-003**: Normalize top spacing (`mt-*`) across authenticated pages so route changes do not shift content unexpectedly.
  - Target: `src/pages/events/new.astro`, `src/pages/events/[id]/edit.astro`, `src/pages/events/[id].astro`, `src/pages/history.astro`, `src/pages/settings.astro`, `src/pages/profile.astro`
- [x] **SP-004**: Add a consistent outer page wrapper to `profile` route to match spacing rhythm used elsewhere.
  - Target: `src/pages/profile.astro`
- [x] **SP-005**: Align `sm` breakpoint horizontal gutters between form pages (`sm:px-0`) and list/detail pages (`sm:px-6`) to one shared convention.
  - Target: `src/pages/events/new.astro`, `src/pages/events/[id]/edit.astro`, `src/pages/settings.astro`, `src/pages/events/[id].astro`, `src/pages/history.astro`
- [x] **SP-006**: Align auth wrapper vertical spacing policy (keep distinction if intentional, otherwise reduce jump from app routes).
  - Target: `src/pages/sign-in.astro`, `src/pages/sign-up.astro`, `src/pages/access-denied.astro`
- [x] **SP-007**: Standardize card section paddings (`px-6 sm:px-8`, `py-*`) across key page shells where visual rhythm is intended to match.
  - Target: `src/pages/events/new.astro`, `src/pages/events/[id]/edit.astro`, `src/pages/events/[id].astro`, `src/pages/history.astro`, `src/pages/settings.astro`, `src/pages/profile.astro`
- [x] **SP-008**: Harmonize header/mobile-menu spacing rhythm with desktop nav spacing while preserving touch targets and accessibility.
  - Target: `src/layouts/Layout.astro`, `src/components/HeaderMobileSheet.tsx`

## Audit Scope Notes

- Primary routes reviewed: `/`, `/events/new`, `/events/[id]`, `/events/[id]/edit`, `/history`, `/settings`, `/profile`, `/sign-in`, `/sign-up`, `/access-denied`.
- This checklist is the source of truth for spacing work in `US-005`.
