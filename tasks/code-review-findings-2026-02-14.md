# Code Review Findings (2026-02-14)

## Critical

- [ ] Replace client-side cookie deletion logout with Clerk sign-out flow (`SignOutButton`, `signOut()`, or server sign-out endpoint) and remove manual cookie mutation.
  - Why: current logout only tries deleting selected cookie names on the current path and can leave auth state inconsistent.
  - Refs: `src/layouts/Layout.astro:297`, `src/components/HeaderMobileSheet.tsx:20`

- [ ] Define and enforce event edit authorization (owner/admin policy) before allowing updates.
  - Why: any authenticated user can update any future event; there is no ownership/role check in the update API.
  - Refs: `src/pages/api/events/update.ts:13`, `db/config.ts:22`

- [ ] Fix event datetime construction to correctly interpret `date` + `time` in `Europe/Oslo` before posting ISO.
  - Why: `new Date(YYYY-MM-DDTHH:mm)` uses the browser local timezone, which conflicts with comments and can shift stored event times for users outside Oslo.
  - Refs: `src/pages/events/new.astro:278`, `src/pages/events/[id]/edit.astro:308`

## High

- [ ] Convert desktop header profile menu from imperative DOM scripting to a React island using existing shadcn primitives (`DropdownMenu`).
  - Why: manual query/select/listener orchestration increases fragility and duplicates accessibility/menu behavior already handled by component primitives.
  - Refs: `src/layouts/Layout.astro:231`

- [ ] Move event create form behavior into a typed React island and remove inline DOM controller.
  - Why: form state, validation, error rendering, and async submit are manually coordinated via element IDs and className toggles.
  - Refs: `src/pages/events/new.astro:176`

- [ ] Move event edit form behavior into a typed React island and de-duplicate with create form logic.
  - Why: nearly identical imperative script duplicated from new-event page, raising maintenance and regression risk.
  - Refs: `src/pages/events/[id]/edit.astro:201`, `src/pages/events/new.astro:176`

- [ ] Move RSVP interaction to a React island with local optimistic state instead of page reload.
  - Why: manual button disabling and `window.location.reload()` causes coarse UX and brittle UI state restoration.
  - Refs: `src/pages/events/[id].astro:371`, `src/pages/events/[id].astro:448`

- [ ] Migrate settings notification script to a typed island (remove `@ts-nocheck`).
  - Why: this script owns permission state, push subscription sync, and API writes with no static type checks.
  - Refs: `src/pages/settings.astro:108`

- [ ] Add server-side validation in RSVP endpoint for event existence and editability (e.g., block RSVPs on past/nonexistent events with 4xx).
  - Why: current handler trusts `eventId`; invalid IDs can fall through to DB constraint/runtime behavior instead of predictable API errors.
  - Refs: `src/pages/api/rsvp.ts:42`

## Medium

- [ ] Remove unnecessary hydration on `EventCard` components (render server-only unless interactivity is added).
  - Why: cards are static links/content but are loaded as React islands, adding avoidable JS and hydration cost per card.
  - Refs: `src/pages/index.astro:166`, `src/components/EventCard.tsx:22`

- [ ] Replace per-event RSVP count queries with grouped aggregation query.
  - Why: homepage currently executes one RSVP query per event (`N+1`).
  - Refs: `src/pages/index.astro:59`

- [ ] Replace per-RSVP user lookup on event detail with join/batched fetch.
  - Why: event detail loads users in a `Promise.all` loop (`N+1`).
  - Refs: `src/pages/events/[id].astro:39`

- [ ] Replace per-history-item event lookup on history page with join/batched fetch.
  - Why: history page maps RSVP rows to event queries one-by-one (`N+1`).
  - Refs: `src/pages/history.astro:44`

- [ ] Reduce notification send-time `N+1` checks against `NotificationLog` by prefetching existing logs for the target event/type/channel.
  - Why: reminder and push delivery loops issue one existence query per user.
  - Refs: `src/lib/event-notifications.ts:355`, `src/lib/event-notifications.ts:585`

## Odd Solutions To Revisit

- [ ] Decide whether `ShadcnIslandDemo` should stay on production homepage or move to a dedicated dev/demo route.
  - Why: this appears to be a component showcase embedded in primary user flow.
  - Refs: `src/pages/index.astro:114`, `src/components/ShadcnIslandDemo.tsx:35`

- [ ] Centralize user-sync behavior to avoid repeated ad-hoc create-on-read logic across pages/endpoints.
  - Why: similar sync logic appears in multiple locations with slightly different handling.
  - Refs: `src/pages/index.astro:15`, `src/pages/history.astro:15`, `src/pages/api/sync-user.ts:15`, `src/pages/api/settings/notifications.ts:26`, `src/pages/api/settings/push-subscription.ts:26`
