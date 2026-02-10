import { clerkSetup } from '@clerk/testing/playwright';

/**
 * Global setup for Playwright tests
 *
 * This configures Clerk testing with the necessary environment variables
 * for generating test tokens that bypass Clerk's UI during E2E tests.
 *
 * See: https://clerk.com/docs/testing/playwright/overview
 */
export default async function globalSetup() {
  await clerkSetup();

  console.log('✓ Clerk testing setup complete');
}
