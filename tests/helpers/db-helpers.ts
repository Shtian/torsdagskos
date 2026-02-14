import {
  db,
  Users,
  Events,
  Rsvps,
  Invites,
  NotificationLog,
  eq,
} from 'astro:db';

/**
 * Database helper utilities for tests
 *
 * These helpers provide common database operations needed during testing,
 * such as seeding test data and cleaning up after tests.
 */

/**
 * Creates a test user in the database
 */
export async function createTestUser(data: {
  clerkUserId: string;
  email: string;
  name: string;
}) {
  const [user] = await db
    .insert(Users)
    .values({
      clerkUserId: data.clerkUserId,
      email: data.email,
      name: data.name,
      createdAt: new Date(),
    })
    .returning();

  return user;
}

/**
 * Creates a test event in the database
 */
export async function createTestEvent(data: {
  title: string;
  description: string;
  dateTime: Date;
  location: string;
  mapLink?: string;
}) {
  const [event] = await db
    .insert(Events)
    .values({
      title: data.title,
      description: data.description,
      dateTime: data.dateTime,
      location: data.location,
      mapLink: data.mapLink,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return event;
}

/**
 * Creates a test RSVP in the database
 */
export async function createTestRsvp(data: {
  userId: number;
  eventId: number;
  status: 'going' | 'maybe' | 'not_going';
}) {
  const [rsvp] = await db
    .insert(Rsvps)
    .values({
      userId: data.userId,
      eventId: data.eventId,
      status: data.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return rsvp;
}

/**
 * Cleans up all test data from the database
 * WARNING: This deletes ALL data - use only in test environments
 */
export async function cleanupTestData() {
  // Delete in reverse order of dependencies
  await db.delete(NotificationLog);
  await db.delete(Rsvps);
  await db.delete(Events);
  await db.delete(Invites);
  await db.delete(Users);
}

/**
 * Gets a user by Clerk user ID
 */
export async function getUserByClerkId(clerkUserId: string) {
  const [user] = await db
    .select()
    .from(Users)
    .where(eq(Users.clerkUserId, clerkUserId));
  return user;
}
