import type { APIRoute } from 'astro';
import { db, Events } from 'astro:db';
import { sendNewEventNotifications } from '../../../lib/event-notifications';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Ensure user is authenticated
    const { userId } = locals.auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const body = await request.json();
    const { title, description, dateTime, location, mapLink } = body;

    // Validate required fields
    if (!title || !dateTime || !location) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, dateTime, location' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const eventDate = new Date(dateTime);

    // Insert event into database
    const result = await db.insert(Events).values({
      title,
      description: description || '',
      dateTime: eventDate,
      location,
      mapLink: mapLink || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get the inserted event ID (convert BigInt to Number for JSON serialization)
    const eventId = Number(result.lastInsertRowid);
    let notificationSummary = {
      totalUsers: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    try {
      notificationSummary = await sendNewEventNotifications({
        eventId,
        title,
        description: description || '',
        dateTime: eventDate,
        location,
      });
    } catch (notificationError) {
      console.error('Error sending new event notifications:', notificationError);
    }

    return new Response(
      JSON.stringify({ success: true, eventId, notifications: notificationSummary }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error creating event:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
