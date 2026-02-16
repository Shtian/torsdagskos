import type { APIRoute } from 'astro';
import { db, Users, eq } from 'astro:db';
import { ensureLocalUser } from '../../../lib/local-user-sync';

export const POST: APIRoute = async (context) => {
  const { userId } = context.locals.auth();

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await context.request.json();
    const subscription = body?.subscription ?? null;

    if (subscription !== null && typeof subscription !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const localUser = await ensureLocalUser(context, userId);

    await db
      .update(Users)
      .set({
        pushSubscription: subscription ? JSON.stringify(subscription) : null,
        pushSubscriptionUpdatedAt: new Date(),
        browserNotificationsEnabled: !!subscription,
      })
      .where(eq(Users.id, localUser.id));

    return new Response(
      JSON.stringify({
        success: true,
        hasSubscription: !!subscription,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error updating push subscription:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update push subscription' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
