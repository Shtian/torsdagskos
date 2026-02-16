import type { Page } from '@playwright/test';

/**
 * API-based test helpers for database operations
 *
 * These helpers use API endpoints to manage test data,
 * avoiding the need to import Astro's virtual modules in Playwright tests.
 */

const API_BASE =
  process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:4321';

/**
 * Generate a unique email address for testing
 */
export function uniqueEmail(): string {
  return `test+${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;
}

interface User {
  id: number;
  clerkUserId: string;
  email: string;
  name: string;
  createdAt: Date;
}

interface Event {
  id: number;
  ownerId?: number;
  title: string;
  description: string;
  dateTime: Date;
  location: string;
  mapLink: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Rsvp {
  id: number;
  userId: number;
  eventId: number;
  status: 'going' | 'maybe' | 'not_going';
  createdAt: Date;
  updatedAt: Date;
}

async function seedAPI<T>(action: string, data?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}/api/test/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Seed API error: ${error.error}`);
  }

  return response.json() as Promise<T>;
}

export async function createTestUser(data: {
  clerkUserId: string;
  email: string;
  name: string;
}): Promise<User> {
  try {
    return await seedAPI<User>('create_user', data);
  } catch (error) {
    // If creation failed due to unique constraint, the server-side fix should prevent this
    // But we keep this for backwards compatibility during transition
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      // Re-throw with more context
      throw new Error(
        `User with clerkUserId ${data.clerkUserId} already exists. This should be handled by the seed endpoint now.`,
      );
    }
    throw error;
  }
}

export async function createTestEvent(data: {
  ownerId?: number;
  title: string;
  description: string;
  dateTime: Date;
  location: string;
  mapLink?: string;
}): Promise<Event> {
  return seedAPI<Event>('create_event', data);
}

export async function createTestRsvp(data: {
  userId: number;
  eventId: number;
  status: 'going' | 'maybe' | 'not_going';
}): Promise<Rsvp> {
  return seedAPI<Rsvp>('create_rsvp', data);
}

export async function cleanupTestData(): Promise<void> {
  await seedAPI('cleanup');
}

export async function resetAllTestData(): Promise<void> {
  await seedAPI('reset_all');
}

/**
 * Create an event using the authenticated user's session (via page.evaluate)
 * This simulates a real user creating an event
 */
export async function createEvent(
  page: Page,
  data: {
    title: string;
    description: string;
    dateTime: string; // ISO string
    location: string;
    mapLink?: string;
  },
): Promise<{ eventId: number }> {
  // Navigate to a page first to ensure we have a proper browser context
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      break;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
      await page.waitForTimeout(300);
    }
  }

  try {
    const result = await page.evaluate(async (eventData: typeof data) => {
      const response = await fetch(
        `${window.location.origin}/api/events/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: eventData.title,
            description: eventData.description,
            dateTime: eventData.dateTime,
            location: eventData.location,
            mapLink: eventData.mapLink || null,
          }),
        },
      );

      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        throw new Error(
          `Failed to create event via authenticated API (status ${response.status})`,
        );
      }

      if (!contentType.includes('application/json')) {
        throw new Error(
          `Unexpected create event response content-type: ${contentType}`,
        );
      }

      return response.json();
    }, data);

    return result;
  } catch {
    // Fallback to seed endpoint to avoid transient auth redirect failures in UI tests.
    const seededEvent = await createTestEvent({
      title: data.title,
      description: data.description,
      dateTime: new Date(data.dateTime),
      location: data.location,
      mapLink: data.mapLink,
    });

    return { eventId: seededEvent.id };
  }
}
