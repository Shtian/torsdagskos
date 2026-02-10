import type { APIRoute } from 'astro';
import { db, Users, Events, Rsvps, NotificationLog, Invites } from 'astro:db';

/**
 * Test data seeding API endpoint
 * Only available in development mode
 *
 * POST /api/test/seed
 * Body: { action: 'create_user' | 'create_event' | 'create_rsvp' | 'cleanup', data: {...} }
 */
export const POST: APIRoute = async ({ request }) => {
  // Only allow in development
  if (import.meta.env.PROD) {
    return new Response(JSON.stringify({ error: 'Not available in production' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'create_user': {
        const [user] = await db
          .insert(Users)
          .values({
            clerkUserId: data.clerkUserId,
            email: data.email,
            name: data.name,
            createdAt: new Date(),
          })
          .returning();
        return new Response(JSON.stringify(user), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'create_event': {
        const [event] = await db
          .insert(Events)
          .values({
            title: data.title,
            description: data.description,
            dateTime: new Date(data.dateTime),
            location: data.location,
            mapLink: data.mapLink,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        return new Response(JSON.stringify(event), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'create_rsvp': {
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
        return new Response(JSON.stringify(rsvp), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'cleanup': {
        // Delete in reverse order of dependencies
        await db.delete(NotificationLog);
        await db.delete(Rsvps);
        await db.delete(Events);
        await db.delete(Invites);
        // Don't delete users - they will be reused across tests
        // This prevents issues with the authenticated test user being re-synced
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Test seed error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
