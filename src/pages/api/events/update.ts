import type { APIRoute } from 'astro';
import { db, Events, eq } from 'astro:db';
import { sendEventUpdateNotifications } from '../../../lib/event-notifications';

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
        JSON.stringify({
          error: 'Missing required fields: eventId, title, dateTime, location',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
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
      return new Response(
        JSON.stringify({ error: 'Past events cannot be edited' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const updatedEvent = {
      title,
      description: description || '',
      dateTime: new Date(dateTime),
      location,
      mapLink: mapLink || null,
    };

    await db
      .update(Events)
      .set({
        ...updatedEvent,
        updatedAt: new Date(),
      })
      .where(eq(Events.id, Number(eventId)));

    let notificationSummary = {
      totalUsers: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    try {
      notificationSummary = await sendEventUpdateNotifications({
        eventId: Number(eventId),
        previous: {
          title: existingEvent.title,
          description: existingEvent.description || '',
          dateTime: new Date(existingEvent.dateTime),
          location: existingEvent.location,
          mapLink: existingEvent.mapLink || null,
        },
        updated: updatedEvent,
      });
    } catch (notificationError) {
      console.error(
        'Error sending event update notifications:',
        notificationError,
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        eventId: Number(eventId),
        notifications: notificationSummary,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error updating event:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
