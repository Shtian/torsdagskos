import type { APIRoute } from 'astro';
import { db, Users, Rsvps, eq, and } from 'astro:db';

export const POST: APIRoute = async ({ request, locals }) => {
  const { userId } = locals.auth();

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { eventId, status } = body;

    // Validate input
    if (!eventId || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing eventId or status' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (!['going', 'maybe', 'not_going'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get current user's local database ID
    const currentUser = await db
      .select()
      .from(Users)
      .where(eq(Users.clerkUserId, userId))
      .get();

    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if RSVP already exists
    const existingRsvp = await db
      .select()
      .from(Rsvps)
      .where(and(eq(Rsvps.userId, currentUser.id), eq(Rsvps.eventId, eventId)))
      .get();

    const now = new Date();

    if (existingRsvp) {
      // Update existing RSVP
      await db
        .update(Rsvps)
        .set({ status, updatedAt: now })
        .where(eq(Rsvps.id, existingRsvp.id));
    } else {
      // Insert new RSVP
      await db.insert(Rsvps).values({
        userId: currentUser.id,
        eventId,
        status,
        createdAt: now,
        updatedAt: now,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('RSVP error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
