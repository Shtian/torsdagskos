# Testing Guide

This document describes the E2E testing setup for Torsdagskos using Playwright and Clerk authentication.

## Prerequisites

- Node.js 18+ and pnpm installed
- Clerk API keys configured in `.env` file (see CLERK_SETUP.md)
- Development server running or ability to start it automatically

## Installation

Playwright and Clerk testing dependencies are already installed. If you need to reinstall:

```bash
pnpm install
```

To install Playwright browsers:

```bash
pnpm exec playwright install
```

## Running Tests

### Run all tests (headless mode)
```bash
pnpm test
```

### Run tests with browser visible (headed mode)
```bash
pnpm test:headed
```

### Debug tests with Playwright Inspector
```bash
pnpm test:debug
```

### Run tests with Playwright UI mode
```bash
pnpm test:ui
```

### Run specific test file
```bash
pnpm test tests/smoke.spec.ts
```

### Run tests in specific browser
```bash
pnpm test --project=chromium
pnpm test --project=firefox
pnpm test --project=webkit
```

## Test Structure

```
tests/
├── global-setup.ts       # Clerk setup for test environment
├── fixtures.ts           # Custom Playwright fixtures
├── helpers/
│   └── db-helpers.ts     # Database utilities for tests
└── smoke.spec.ts         # Basic smoke tests
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from './fixtures';

test.describe('Feature name', () => {
  test('should do something', async ({ page }) => {
    // Your test code here
  });
});
```

### Testing with Authentication

Clerk provides a `clerk` helper for authentication in tests:

```typescript
import { test, expect } from './fixtures';
import { clerk } from '@clerk/testing/playwright';

test.describe('Authenticated feature', () => {
  test('should access protected page', async ({ page }) => {
    // Sign in using Clerk test credentials
    await clerk.signIn({
      page,
      // Optional: specify strategy or credentials
      // See: https://clerk.com/docs/testing/playwright/overview
    });

    // Now you can test authenticated functionality
    await page.goto('/');
    await expect(page.getByText('Events')).toBeVisible();
  });
});
```

### Using Database Helpers

```typescript
import { test, expect } from './fixtures';
import { createTestEvent, cleanupTestData } from './helpers/db-helpers';

test.describe('Events', () => {
  test.beforeEach(async () => {
    // Seed test data
    await createTestEvent({
      title: 'Test Event',
      description: 'A test event',
      dateTime: new Date('2026-03-15T19:00:00+01:00'),
      location: 'Oslo, Norway',
    });
  });

  test.afterEach(async () => {
    // Clean up test data
    await cleanupTestData();
  });

  test('should display event', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Test Event')).toBeVisible();
  });
});
```

## Best Practices

### 1. Use User-Facing Locators

Prefer locators that match how users interact with the page:

```typescript
// Good: Using roles and text
await page.getByRole('button', { name: 'Sign Out' });
await page.getByText('Welcome');

// Avoid: Using CSS selectors
await page.locator('.btn-primary');
```

### 2. Use Web-First Assertions

Playwright has built-in waiting and retrying:

```typescript
// Good: Web-first assertions
await expect(page.getByText('Success')).toBeVisible();
await expect(page.getByRole('heading')).toHaveText('Events');

// Avoid: Manual waits
await page.waitForTimeout(1000);
```

### 3. Test Isolation

Each test should be independent and not rely on other tests:

```typescript
// Use beforeEach/afterEach for setup and cleanup
test.beforeEach(async () => {
  // Setup test data
});

test.afterEach(async () => {
  // Clean up
});
```

### 4. Serial Execution for Clerk Tests

According to Clerk documentation, tests using authentication should run serially:

```typescript
// In playwright.config.ts, serial execution is configured per-project
test.describe.serial('Auth flow', () => {
  // These tests run one after another
  test('sign in', async ({ page }) => {
    // ...
  });

  test('sign out', async ({ page }) => {
    // ...
  });
});
```

## Configuration

### Environment Variables

Tests use the same `.env` file as the application. Required variables:

```env
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Playwright Configuration

See `playwright.config.ts` for full configuration. Key settings:

- **baseURL**: `http://localhost:4321` (dev server)
- **Browsers**: Chromium, Firefox, WebKit
- **Retries**: 2 on CI, 0 locally
- **Trace**: Captured on first retry
- **Screenshot**: Only on failure

### CI Configuration

Tests are configured to run in GitHub Actions CI. The configuration:

- Runs on pull requests and main branch pushes
- Installs Playwright browsers
- Runs tests with retries enabled
- Uploads traces and screenshots on failure

See `.github/workflows/playwright.yml` (to be created in US-023) for CI setup.

## Troubleshooting

### Tests fail with "Server did not start"

Make sure the dev server can start:

```bash
pnpm dev
```

If it works manually, try increasing `webServer.timeout` in `playwright.config.ts`.

### Authentication tests fail

1. Verify Clerk API keys are in `.env`
2. Check that `globalSetup` runs successfully (look for "✓ Clerk testing setup complete" in output)
3. Ensure Clerk test credentials are configured correctly

### Database tests fail

1. Ensure Astro DB is running: `pnpm astro db verify`
2. Check that database migrations are up to date
3. Verify test database isolation (tests should clean up after themselves)

### Browser issues

Install/update Playwright browsers:

```bash
pnpm exec playwright install --with-deps
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Clerk Testing with Playwright](https://clerk.com/docs/testing/playwright/overview)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Astro Testing Guide](https://docs.astro.build/en/guides/testing/)
