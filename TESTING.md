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

Tests are configured to run in GitHub Actions CI. The workflow file is located at `.github/workflows/playwright.yml`.

#### CI Features

- **Trigger**: Runs on pull requests and pushes to main branch
- **Test Sharding**: Tests are split across 3 parallel shards for faster execution
- **Browser Support**: All three browsers (Chromium, Firefox, WebKit) run in parallel
- **Artifact Upload**: Test reports, traces, screenshots, and videos are uploaded on failure
- **Report Merging**: All shard reports are merged into a single HTML report
- **Retries**: Configured with 2 retries on CI (via playwright.config.ts)

#### Setting Up CI Secrets

To run tests in CI, you need to configure the following GitHub repository secrets:

1. Go to your repository Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
   - `CLERK_SECRET_KEY`: Your Clerk secret key
   - `TEST_PASSWORD`: Test user password for authentication tests

#### Viewing Test Results

After a workflow run completes:

1. Go to the Actions tab in your GitHub repository
2. Click on the workflow run
3. Scroll to the bottom to find the artifacts:
   - `playwright-report-merged`: Combined HTML report from all shards
   - `playwright-report-1`, `playwright-report-2`, `playwright-report-3`: Individual shard reports
4. Download and extract the HTML report to view detailed test results

#### Test Sharding

Tests are split across 3 shards to improve CI performance. Each shard runs approximately 1/3 of the tests in parallel. You can adjust the number of shards by modifying the `shardTotal` value in `.github/workflows/playwright.yml`.

#### CI Troubleshooting

**Tests pass locally but fail in CI:**
- Verify all required secrets are configured in GitHub
- Check that Clerk API keys are valid and not rate-limited
- Review the uploaded test artifacts (traces, screenshots) for debugging
- Ensure database operations don't have timing issues (use web-first assertions)

**Sharded tests are unbalanced:**
- Playwright automatically distributes tests across shards
- If one shard takes much longer, consider increasing `shardTotal` for better distribution

**Artifacts not uploading:**
- Check that the workflow has write permissions for Actions
- Verify the artifact paths in the workflow match the actual output directories

**Merge reports job fails:**
- Ensure all test shards completed (even with failures)
- Check that artifact names match the pattern `playwright-report-*`

#### Status Badge

The repository README includes a status badge showing the current test status:

```markdown
[![Playwright Tests](https://github.com/shtian/torsdagskos/actions/workflows/playwright.yml/badge.svg)](https://github.com/shtian/torsdagskos/actions/workflows/playwright.yml)
```

The badge updates automatically based on the latest workflow run.

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
