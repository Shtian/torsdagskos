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
  // Map Astro's environment variables to what Clerk expects
  // Astro uses PUBLIC_CLERK_PUBLISHABLE_KEY, but @clerk/testing expects CLERK_PUBLISHABLE_KEY
  if (process.env.PUBLIC_CLERK_PUBLISHABLE_KEY && !process.env.CLERK_PUBLISHABLE_KEY) {
    process.env.CLERK_PUBLISHABLE_KEY = process.env.PUBLIC_CLERK_PUBLISHABLE_KEY;
  }

  await clerkSetup();

  console.log('✓ Clerk testing setup complete');
}
