import { test, expect } from './fixtures';
import {
  cleanupTestData,
  createTestEvent,
  createTestRsvp,
  createTestUser,
  uniqueEmail,
} from './helpers/api-helpers';

async function ensureAuthenticatedUserInDatabase(page: import('@playwright/test').Page): Promise<number> {
  await page.goto('/');

  const authInfo = await page.evaluate(async () => {
    const response = await fetch('/api/test/current-user');
    const data = await response.json();

    if (response.ok) {
      return {
        userId: data.id as number,
        clerkUserId: data.clerkUserId as string,
        exists: true,
      };
    }

    if (response.status === 404 && data.userId) {
      return {
        userId: null,
        clerkUserId: data.userId as string,
        exists: false,
      };
    }

    throw new Error(`Unexpected response from /api/test/current-user: ${response.status}`);
  });

  if (authInfo.exists && authInfo.userId) {
    return authInfo.userId;
  }

  const createdUser = await createTestUser({
    clerkUserId: authInfo.clerkUserId,
    email: uniqueEmail(),
    name: 'Authenticated Test User',
  });

  return createdUser.id;
}

test.describe('RSVP history page', () => {
  test.use({ storageState: './playwright/.clerk/user.json' });

  test('shows My History link in header and navigates to history page', async ({ page }) => {
    await page.goto('/');

    const historyLink = page.getByRole('link', { name: 'My History' });
    await expect(historyLink).toBeVisible();

    await historyLink.click();
    await expect(page).toHaveURL('/history');
    await expect(page.getByRole('heading', { name: 'My RSVP History', level: 1 })).toBeVisible();
  });

  test('shows only current user RSVPs sorted by event date descending', async ({ page }) => {
    await cleanupTestData();
    const currentUserId = await ensureAuthenticatedUserInDatabase(page);

    const otherUser = await createTestUser({
      clerkUserId: `history_other_${Date.now()}`,
      email: uniqueEmail(),
      name: 'Other User',
    });

    const futureEvent = await createTestEvent({
      title: 'Future RSVP Event',
      description: 'Event in the future',
      dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      location: 'Future Venue',
    });

    const pastEvent = await createTestEvent({
      title: 'Past RSVP Event',
      description: 'Event in the past',
      dateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      location: 'Past Venue',
    });

    const unrelatedEvent = await createTestEvent({
      title: 'Other User Event',
      description: 'Should not be shown in current user history',
      dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      location: 'Hidden Venue',
    });

    await createTestRsvp({
      userId: currentUserId,
      eventId: futureEvent.id,
      status: 'going',
    });

    await createTestRsvp({
      userId: currentUserId,
      eventId: pastEvent.id,
      status: 'not_going',
    });

    await createTestRsvp({
      userId: otherUser.id,
      eventId: unrelatedEvent.id,
      status: 'maybe',
    });

    await page.goto('/history');

    const historyItems = page.getByTestId('history-item');
    await expect(historyItems).toHaveCount(2);

    const firstItem = historyItems.nth(0);
    await expect(firstItem.getByRole('heading', { name: 'Future RSVP Event', level: 2 })).toBeVisible();
    await expect(firstItem.getByText('Future Venue')).toBeVisible();
    await expect(firstItem.getByTestId('history-status')).toHaveText('Going');

    const secondItem = historyItems.nth(1);
    await expect(secondItem.getByRole('heading', { name: 'Past RSVP Event', level: 2 })).toBeVisible();
    await expect(secondItem.getByText('Past Venue')).toBeVisible();
    await expect(secondItem.getByTestId('history-status')).toHaveText('Not Going');

    await expect(page.getByRole('heading', { name: 'Other User Event', level: 2 })).toHaveCount(0);

    const firstLink = firstItem.getByRole('link');
    const secondLink = secondItem.getByRole('link');
    await expect(firstLink).toHaveAttribute('href', `/events/${futureEvent.id}`);
    await expect(secondLink).toHaveAttribute('href', `/events/${pastEvent.id}`);
  });

  test('shows empty state when current user has no RSVP history', async ({ page }) => {
    await cleanupTestData();
    await ensureAuthenticatedUserInDatabase(page);

    await page.goto('/history');

    await expect(page.getByRole('heading', { name: 'My RSVP History', level: 1 })).toBeVisible();
    await expect(page.getByText("You haven't RSVPd to any events yet.")).toBeVisible();
    await expect(page.getByTestId('history-item')).toHaveCount(0);
  });
});
