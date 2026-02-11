import type { APIRoute } from 'astro';
import { db, Events, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { userId } = locals.auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { eventId, title, description, dateTime, location, mapLink } = body;

    if (!eventId || !title || !dateTime || !location) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: eventId, title, dateTime, location' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const existingEvent = await db
      .select()
      .from(Events)
      .where(eq(Events.id, Number(eventId)))
      .get();

    if (!existingEvent) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (new Date(existingEvent.dateTime) < new Date()) {
      return new Response(JSON.stringify({ error: 'Past events cannot be edited' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db
      .update(Events)
      .set({
        title,
        description: description || '',
        dateTime: new Date(dateTime),
        location,
        mapLink: mapLink || null,
        updatedAt: new Date(),
      })
      .where(eq(Events.id, Number(eventId)));

    return new Response(JSON.stringify({ success: true, eventId: Number(eventId) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
