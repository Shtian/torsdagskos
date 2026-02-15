# Playwright Tests (Project Conventions)

- Use `tests/fixtures.ts` (`import { test, expect } from './fixtures'`).
- Tag unauthenticated coverage with `@unauth` (tests or describes). Auth tests are the default.
- Do not set `storageState` in tests. Auth is handled by the Playwright project and `tests/global.setup.ts`.
- Prefer explicit, user-visible assertions (URL, title, headings, key UI).
- Keep tests independent; no shared state across tests.
- Many specs mutate shared DB state via `/api/test/seed` cleanup; full parallel runs can race across files. Prefer `pnpm test --workers=1` for stable full-suite verification, or isolate data/cleanup per spec when adding new tests.
- Use stable selectors and roles; avoid brittle text where possible.
- Shadcn primitives in this repo expose `data-slot` attributes (for example `data-slot="input"`/`"textarea"`); use these for resilient component-level assertions when roles/text are ambiguous.
- Avoid adding `aria-label` to controls that already have clear visible text unless necessary; it overrides the accessible name and can break existing `getByRole({ name: ... })` locators.
- Playwright config uses `testIdAttribute: 'data-test-id'`; prefer `page.getByTestId(...)` over manual `[data-test-id=...]` selectors.
- For responsive checks, set explicit viewport sizes in-spec (`page.setViewportSize`) and assert no horizontal overflow with `document.documentElement.scrollWidth <= window.innerWidth`.
- For mobile accessibility touch targets, assert clickable control dimensions with `locator.boundingBox()` and keep both width/height `>= 44`.
- Keep specs focused: one behavior per test, minimal setup.
- Avoid sign-out side effects in shared authenticated suites: asserting the presence/order/keyboard behavior of account-menu actions is stable, while executing logout can invalidate auth context used by later tests.
- Unauthenticated route assertions should target local `/access-denied` first; validate the invite-only message and sign-in link instead of expecting direct middleware redirects to Clerk-hosted domains.
- For Clerk wrapper page migrations (`/sign-in`, `/sign-up`), add stable `data-test-id` hooks on the local shell and assert both wrapper content and Clerk heading presence to ensure visual migration without breaking auth UI.
- For event create/edit form migrations, use the shared inline feedback contract (`data-test-id="form-feedback-panel"`) and assert panel text plus submit `aria-busy`/disabled transitions instead of toast-style selectors.
- Zod-backed client-side validation for event create/edit should keep `novalidate` on the form, expose per-field error hooks (`data-test-id="field-error-<field>"`), and assert invalid submits do not call the API route.
- For timezone-sensitive create/edit submissions, intercept `/api/events/create` or `/api/events/update` and assert the outbound `dateTime` ISO payload directly; this avoids locale-dependent UI rendering assertions.
- For event detail RSVP flows, use the inline feedback panel (`data-test-id="rsvp-feedback-panel"`) and assert the `#rsvp-feedback` message instead of ephemeral toast selectors.
- For settings page UI refactors, keep `#permission-status`, `#saved-preference`, `#request-permission`, and `#feedback` selectors stable because both page scripts and settings specs rely on them.
- For page UI migrations, keep existing behavior-focused specs intact and add a dedicated `*-ui.spec.ts` file for shell/list surface and mobile overflow assertions.
- For global CSS/token assertions, prefer `@unauth` tests on `/access-denied` and verify computed styles from `document.documentElement`/`document.body` to avoid auth state coupling.
- For typography assertions, validate computed `fontFamily` with `toContain('<Font Name>')` instead of exact string equality because browser/platform fallback stacks can vary.
- Keep the invite-only title on `/access-denied` as a semantic heading element; typography and theme unauth specs use that route for heading style assertions.
- For React-island interaction tests on `/`, wait for `data-hydrated="true"` on `page.getByTestId('shadcn-island')` before clicking tabs/select/dialog/dropdown triggers to avoid pre-hydration flakiness.
- For auth-sensitive `page.evaluate()` calls to `/api/test/current-user`, guard for intermittent `401` + non-JSON responses and retry a few times before failing to reduce suite flakes.
- When occasional dev-server navigation flakes (`net::ERR_ABORTED` / detached frame) occur, wrap critical `page.goto()` calls in a small bounded retry helper inside the spec.
- In long serial Playwright runs, apply the same bounded `page.goto()` retry helper in setup/navigation-heavy specs (not just one route) to reduce random `ERR_ABORTED`/timeout failures.
- With localized UI copy, prefer stable `data-test-id` selectors for badges/count pills where translated labels can overlap (for example `1 kommer` vs `1 kommer ikke`) and trigger strict-mode locator collisions.
- During translation-focused stories, keep assertions for app-owned shell text localized, but keep Clerk widget heading checks regex-tolerant because Clerk-rendered copy can vary by provider locale/configuration.
- RSVP buttons on event detail keep `aria-label` values (`Kommer`/`Kanskje`/`Kommer ikke`) even when button text temporarily changes to loading labels, so loading/error assertions should target feedback panel text and button state attributes instead of role-name text swaps.
- Spacing regression checks should use stable page-shell test ids (`*-shell`) plus computed style assertions for `margin-top` and horizontal padding to validate shared shell contracts across breakpoints.

## Test Helpers (tests/helpers/api-helpers.ts)

### Creating Events in Tests
- Use `createEvent(page, {...})` helper for creating events as authenticated user
- Helper uses `page.evaluate()` with `window.location.origin` to call `/api/events/create`
- Always call `await page.goto('/')` before using `createEvent()` to ensure proper browser context
- This pattern simulates real user actions and includes authentication cookies automatically
- `createTestEvent({...})` accepts optional `ownerId`; use it to validate owner-restricted behaviors (for example edit authorization) without relying on UI creation flows.
- `createEvent(page, ...)` expects optional fields (for example `mapLink`) to be omitted when absent; pass `undefined`/omit instead of `null` to satisfy the helper's typed payload.

### Flexible Selectors
- For elements that may be rendered as different types (button vs link), use:
  ```typescript
  page.locator('button:has-text("Text"), a:has-text("Text")').first()
  ```
- This handles conditional rendering without brittle test failures

### Browser Notification Testing
- For deterministic browser notification tests, mock the `window.Notification` API via `page.addInitScript()` before `page.goto()`.
- Control the simulated permission result (`granted`/`denied`) by updating a local `permissionState` in the injected mock.
- To verify persisted user preference, fetch `/api/test/current-user` from `page.evaluate()` so auth cookies are included.
- For service worker coverage, prefer validating the static worker script via `page.request.get('/service-worker.js')` instead of waiting on browser registration network events (those can be non-deterministic).
- Push subscription persistence can be tested end-to-end by posting to `/api/settings/push-subscription` from `page.evaluate()` and asserting the stored `Users.pushSubscription` value via `/api/test/current-user`.

Run: `pnpm test` or `pnpm test tests/<file>.spec.ts`
