# Playwright Tests (Project Conventions)

- Use `tests/fixtures.ts` (`import { test, expect } from './fixtures'`).
- Tag unauthenticated coverage with `@unauth` (tests or describes). Auth tests are the default.
- Do not set `storageState` in tests. Auth is handled by the Playwright project and `tests/global.setup.ts`.
- Prefer explicit, user-visible assertions (URL, title, headings, key UI).
- Keep tests independent; no shared state across tests.
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

Run: `pnpm test` or `pnpm test tests/<file>.spec.ts`
