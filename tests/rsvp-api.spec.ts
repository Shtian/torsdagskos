import { test, expect } from './fixtures';
import {
  cleanupTestData,
  createTestEvent,
  createTestUser,
  uniqueEmail,
} from './helpers/api-helpers';

async function getAuthenticatedClerkUserId(
  page: import('@playwright/test').Page,
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await page.evaluate(async () => {
      const response = await fetch('/api/test/current-user');
      const contentType = response.headers.get('content-type') || '';
      const body = contentType.includes('application/json')
        ? await response.json()
        : null;

      if (response.status === 404 && body?.userId) {
        return { clerkUserId: body.userId as string, ok: true };
      }

      if (response.ok && body?.clerkUserId) {
        return { clerkUserId: body.clerkUserId as string, ok: true };
      }

      return { clerkUserId: '', ok: false };
    });

    if (result.ok) {
      return result.clerkUserId;
    }

    await page.waitForTimeout(300);
  }

  throw new Error(
    'Unable to resolve authenticated Clerk user from /api/test/current-user',
  );
}

test.describe('RSVP API event validation', () => {
  test.beforeEach(async () => {
    await cleanupTestData();
  });

  test('returns structured 404 payload for unknown event id', async ({
    page,
  }) => {
    await page.goto('/');
    const clerkUserId = await getAuthenticatedClerkUserId(page);

    await createTestUser({
      clerkUserId,
      email: uniqueEmail(),
      name: 'Authenticated RSVP API Tester',
    });

    const response = await page.evaluate(async () => {
      const requestBody = {
        eventId: 999_999_999,
        status: 'going',
      } as const;

      const result = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      return {
        body: await result.json(),
        status: result.status,
      };
    });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      code: 'EVENT_NOT_FOUND',
      error: 'Not Found',
      eventId: 999_999_999,
      message: 'Event not found.',
    });
  });

  test('rejects RSVPs to past events with controlled 4xx payload', async ({
    page,
  }) => {
    await page.goto('/');
    const clerkUserId = await getAuthenticatedClerkUserId(page);

    await createTestUser({
      clerkUserId,
      email: uniqueEmail(),
      name: 'Authenticated RSVP API Tester',
    });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const event = await createTestEvent({
      title: `Past RSVP Guard ${Date.now()}`,
      description: 'Past event for RSVP API validation',
      dateTime: pastDate,
      location: 'Oslo',
    });

    const response = await page.evaluate(async (eventId) => {
      const requestBody = {
        eventId,
        status: 'maybe',
      } as const;

      const result = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      return {
        body: await result.json(),
        status: result.status,
      };
    }, event.id);

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      code: 'EVENT_CLOSED',
      error: 'Conflict',
      eventId: event.id,
      message: 'Cannot RSVP to past events.',
    });
  });
});
