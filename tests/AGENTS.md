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
- Unauthenticated route assertions should target local `/access-denied` first; validate the invite-only message and sign-in link instead of expecting direct middleware redirects to Clerk-hosted domains.
- For Clerk wrapper page migrations (`/sign-in`, `/sign-up`), add stable `data-test-id` hooks on the local shell and assert both wrapper content and Clerk heading presence to ensure visual migration without breaking auth UI.
- For event create/edit form migrations, use the shared inline feedback contract (`data-test-id="form-feedback-panel"`) and assert panel text plus submit `aria-busy`/disabled transitions instead of toast-style selectors.
- For global CSS/token assertions, prefer `@unauth` tests on `/access-denied` and verify computed styles from `document.documentElement`/`document.body` to avoid auth state coupling.
- For typography assertions, validate computed `fontFamily` with `toContain('<Font Name>')` instead of exact string equality because browser/platform fallback stacks can vary.
- Keep the invite-only title on `/access-denied` as a semantic heading element; typography and theme unauth specs use that route for heading style assertions.
- For React-island interaction tests on `/`, wait for `data-hydrated="true"` on `page.getByTestId('shadcn-island')` before clicking tabs/select/dialog/dropdown triggers to avoid pre-hydration flakiness.
- For auth-sensitive `page.evaluate()` calls to `/api/test/current-user`, guard for intermittent `401` + non-JSON responses and retry a few times before failing to reduce suite flakes.

## Test Helpers (tests/helpers/api-helpers.ts)

### Creating Events in Tests
- Use `createEvent(page, {...})` helper for creating events as authenticated user
- Helper uses `page.evaluate()` with `window.location.origin` to call `/api/events/create`
- Always call `await page.goto('/')` before using `createEvent()` to ensure proper browser context
- This pattern simulates real user actions and includes authentication cookies automatically

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
