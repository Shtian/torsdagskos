/**
 * API-based test helpers for database operations
 *
 * These helpers use API endpoints to manage test data,
 * avoiding the need to import Astro's virtual modules in Playwright tests.
 */

const API_BASE = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:4321';

interface User {
  id: number;
  clerkUserId: string;
  email: string;
  name: string;
  createdAt: Date;
}

interface Event {
  id: number;
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

async function seedAPI(action: string, data?: any) {
  const response = await fetch(`${API_BASE}/api/test/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Seed API error: ${error.error}`);
  }

  return response.json();
}

export async function createTestUser(data: {
  clerkUserId: string;
  email: string;
  name: string;
}): Promise<User> {
  return seedAPI('create_user', data);
}

export async function createTestEvent(data: {
  title: string;
  description: string;
  dateTime: Date;
  location: string;
  mapLink?: string;
}): Promise<Event> {
  return seedAPI('create_event', data);
}

export async function createTestRsvp(data: {
  userId: number;
  eventId: number;
  status: 'going' | 'maybe' | 'not_going';
}): Promise<Rsvp> {
  return seedAPI('create_rsvp', data);
}

export async function cleanupTestData(): Promise<void> {
  await seedAPI('cleanup');
}
