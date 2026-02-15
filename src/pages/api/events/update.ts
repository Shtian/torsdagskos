import type { APIRoute } from 'astro';
import { clerkClient } from '@clerk/astro/server';
import { db, Events, Users, eq } from 'astro:db';
import {
  createValidationErrorPayload,
  emptyNotificationSummary,
  validateNotificationSummary,
  validateUpdateEventApiRequest,
} from '../../../lib/api-validation';
import { sendEventUpdateNotifications } from '../../../lib/event-notifications';

export const POST: APIRoute = async (context) => {
  try {
    const { userId } = context.locals.auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let body: unknown;
    try {
      body = await context.request.json();
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

    const parsedBody = validateUpdateEventApiRequest(body);
    if (!parsedBody.success) {
      return new Response(JSON.stringify(parsedBody.error), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { dateTime, description, eventId, location, mapLink, title } =
      parsedBody.data;

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

    const clerkUser = await clerkClient(context).users.getUser(userId);

    const isAdmin =
      clerkUser.publicMetadata?.role === 'admin' ||
      clerkUser.privateMetadata?.role === 'admin' ||
      clerkUser.unsafeMetadata?.role === 'admin' ||
      clerkUser.publicMetadata?.isAdmin === true ||
      clerkUser.privateMetadata?.isAdmin === true ||
      clerkUser.unsafeMetadata?.isAdmin === true;

    let currentUser = await db
      .select()
      .from(Users)
      .where(eq(Users.clerkUserId, userId))
      .get();

    if (!currentUser) {
      try {
        await db.insert(Users).values({
          clerkUserId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name:
            `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
            clerkUser.emailAddresses[0]?.emailAddress ||
            'User',
          createdAt: new Date(),
        });
      } catch (error) {
        if (
          !(error instanceof Error && error.message.includes('UNIQUE constraint'))
        ) {
          throw error;
        }
      }

      currentUser = await db
        .select()
        .from(Users)
        .where(eq(Users.clerkUserId, userId))
        .get();
    }

    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'User sync failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isOwner = existingEvent.ownerId === currentUser.id;
    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
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

    let notificationSummary = emptyNotificationSummary;

    try {
      const notificationResult = await sendEventUpdateNotifications({
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

      const parsedSummary = validateNotificationSummary(notificationResult);
      if (parsedSummary.success) {
        notificationSummary = parsedSummary.data;
      } else {
        console.error(
          'Notification summary shape mismatch in /api/events/update:',
          parsedSummary.error,
        );
      }
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
