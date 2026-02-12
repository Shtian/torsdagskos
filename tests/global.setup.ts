import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Ensures that Clerk setup is done before any tests run
setup.describe.configure({
  mode: 'serial',
});

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

setup('global setup', async () => {
  await clerkSetup();
  const identifier =
    process.env.E2E_CLERK_USER_EMAIL || process.env.E2E_CLERK_USER_USERNAME;
  if (!identifier) {
    throw new Error(
      'Please provide E2E_CLERK_USER_EMAIL or E2E_CLERK_USER_USERNAME environment variables.',
    );
  }
  if (!identifier.includes('@') && !process.env.E2E_CLERK_USER_PASSWORD) {
    throw new Error(
      'Please provide E2E_CLERK_USER_PASSWORD when using a non-email identifier.',
    );
  }
});

const authFile = path.join(__dirname, '../playwright/.clerk/user.json');

setup('authenticate', async ({ page }) => {
  await page.goto('/sign-in');
  await clerk.loaded({ page });
  const identifier =
    process.env.E2E_CLERK_USER_EMAIL || process.env.E2E_CLERK_USER_USERNAME!;
  if (identifier.includes('@')) {
    await clerk.signIn({
      page,
      emailAddress: identifier,
    });
  } else {
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier,
        password: process.env.E2E_CLERK_USER_PASSWORD!,
      },
    });
  }
  await page.goto('/');
  await page.waitForSelector("h1:has-text('Kommende arrangementer')");

  // Verify auth state is properly saved and session is valid
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Small delay to ensure Clerk session is stable

  await page.context().storageState({ path: authFile });
});
