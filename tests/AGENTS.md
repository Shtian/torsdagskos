# Playwright Tests (Project Conventions)

- Use `tests/fixtures.ts` (`import { test, expect } from './fixtures'`).
- Tag unauthenticated coverage with `@unauth` (tests or describes). Auth tests are the default.
- Do not set `storageState` in tests. Auth is handled by the Playwright project and `tests/global.setup.ts`.
- Prefer explicit, user-visible assertions (URL, title, headings, key UI).
- Keep tests independent; no shared state across tests.
- Many specs mutate shared DB state via `/api/test/seed` cleanup; full parallel runs can race across files. Prefer `pnpm test --workers=1` for stable full-suite verification, or isolate data/cleanup per spec when adding new tests.
- Use stable selectors and roles; avoid brittle text where possible.
- Keep specs focused: one behavior per test, minimal setup.

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

Run: `pnpm test` or `pnpm test tests/<file>.spec.ts`
