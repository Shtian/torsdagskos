import { test as base } from '@playwright/test';

/**
 * Extended test fixtures with Clerk authentication support
 *
 * Usage in tests:
 * ```typescript
 * import { test, expect } from './fixtures';
 *
 * test('authenticated test', async ({ page }) => {
 *   await clerk.signIn({ page });
 *   // Your test code here
 * });
 * ```
 *
 * See: https://clerk.com/docs/testing/playwright/overview
 */
export const test = base.extend({
  // No custom fixtures needed yet, but this structure allows
  // easy extension for shared state, database connections, etc.
});

export { expect } from '@playwright/test';
