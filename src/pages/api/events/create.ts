import type { APIRoute } from 'astro';
import { db, Events } from 'astro:db';
import {
  createValidationErrorPayload,
  emptyNotificationSummary,
  validateCreateEventApiRequest,
  validateNotificationSummary,
} from '../../../lib/api-validation';
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
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    const parsedBody = validateCreateEventApiRequest(body);
    if (!parsedBody.success) {
      return new Response(JSON.stringify(parsedBody.error), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const {
      dateTime: eventDate,
      description,
      location,
      mapLink,
      title,
    } = parsedBody.data;

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
    let notificationSummary = emptyNotificationSummary;

    try {
      const notificationResult = await sendNewEventNotifications({
        eventId,
        title,
        description: description || '',
        dateTime: eventDate,
        location,
      });

      const parsedSummary = validateNotificationSummary(notificationResult);
      if (parsedSummary.success) {
        notificationSummary = parsedSummary.data;
      } else {
        console.error(
          'Notification summary shape mismatch in /api/events/create:',
          parsedSummary.error,
        );
      }
    } catch (notificationError) {
      console.error(
        'Error sending new event notifications:',
        notificationError,
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        eventId,
        notifications: notificationSummary,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error creating event:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
