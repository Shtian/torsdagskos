import type { APIRoute } from 'astro';
import { db, Users, Rsvps, Events, eq, and } from 'astro:db';
import {
  createValidationErrorPayload,
  validateRsvpApiRequest,
} from '../../lib/api-validation';

export const POST: APIRoute = async ({ request, locals }) => {
  const { userId } = locals.auth();

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify(
          createValidationErrorPayload('Request body must be valid JSON.'),
        ),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const parsedBody = validateRsvpApiRequest(body);
    if (!parsedBody.success) {
      return new Response(JSON.stringify(parsedBody.error), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { eventId, status } = parsedBody.data;

    const targetEvent = await db
      .select()
      .from(Events)
      .where(eq(Events.id, eventId))
      .get();

    if (!targetEvent) {
      return new Response(
        JSON.stringify({
          code: 'EVENT_NOT_FOUND',
          error: 'Not Found',
          eventId,
          message: 'Event not found.',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (new Date(targetEvent.dateTime) < new Date()) {
      return new Response(
        JSON.stringify({
          code: 'EVENT_CLOSED',
          error: 'Conflict',
          eventId,
          message: 'Cannot RSVP to past events.',
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        },
      );
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
