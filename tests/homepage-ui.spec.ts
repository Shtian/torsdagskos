import { test, expect } from './fixtures';
import { cleanupTestData, createTestEvent } from './helpers/api-helpers';

test.describe('Homepage shadcn migration', () => {
  test('renders shadcn section shells and preserves event links in populated state', async ({
    page,
  }) => {
    await cleanupTestData();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const upcomingEvent = await createTestEvent({
      title: 'US-008 Upcoming Event',
      description: 'Upcoming event for homepage migration test',
      dateTime: tomorrow,
      location: 'Future Venue',
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastEvent = await createTestEvent({
      title: 'US-008 Past Event',
      description: 'Past event for homepage migration test',
      dateTime: yesterday,
      location: 'Past Venue',
    });

    await page.goto('/');

    const upcomingSection = page.getByTestId('homepage-upcoming');
    await expect(upcomingSection.locator('> [data-slot="card"]')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Kommende arrangementer', level: 1 }),
    ).toBeVisible();

    const duplicateAction = page.getByTestId('duplicate-last-event');
    await expect(duplicateAction).toBeVisible();
    await expect(duplicateAction).toHaveAttribute('href', /.+/);

    await expect(
      page.getByRole('link', { name: 'US-008 Upcoming Event' }),
    ).toHaveAttribute('href', `/events/${upcomingEvent.id}`);
    await expect(
      page.getByRole('link', { name: 'US-008 Past Event' }),
    ).toHaveAttribute('href', `/events/${pastEvent.id}`);

    await expect(page.getByTestId('section-separator')).toHaveAttribute(
      'data-slot',
      'separator',
    );
    await expect(page.getByTestId('empty-state')).toHaveCount(0);
  });

  test('renders shadcn empty state and disabled duplicate action when there are no events', async ({
    page,
  }) => {
    await cleanupTestData();
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'Kommende arrangementer', level: 1 }),
    ).toBeVisible();

    const duplicateAction = page.getByTestId('duplicate-last-event');
    await expect(duplicateAction).toBeVisible();
    await expect(duplicateAction).toBeDisabled();

    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toHaveAttribute('data-slot', 'card');
    await expect(emptyState).toContainText(
      'Ingen arrangementer ennå. Kom tilbake snart!',
    );
  });
});
