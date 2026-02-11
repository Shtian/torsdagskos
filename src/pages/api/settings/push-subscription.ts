import type { APIRoute } from 'astro';
import { clerkClient } from '@clerk/astro/server';
import { db, Users, eq } from 'astro:db';

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

    let existingUser = await db
      .select()
      .from(Users)
      .where(eq(Users.clerkUserId, userId))
      .get();

    if (!existingUser) {
      const clerkUser = await clerkClient(context).users.getUser(userId);

      const [newUser] = await db
        .insert(Users)
        .values({
          clerkUserId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name:
            `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
            clerkUser.emailAddresses[0]?.emailAddress ||
            'User',
          browserNotificationsEnabled: !!subscription,
          pushSubscription: subscription ? JSON.stringify(subscription) : null,
          pushSubscriptionUpdatedAt: new Date(),
          createdAt: new Date(),
        })
        .returning();

      existingUser = newUser;
    } else {
      await db
        .update(Users)
        .set({
          pushSubscription: subscription ? JSON.stringify(subscription) : null,
          pushSubscriptionUpdatedAt: new Date(),
          browserNotificationsEnabled: !!subscription,
        })
        .where(eq(Users.id, existingUser.id));
    }

    return new Response(
      JSON.stringify({
        success: true,
        hasSubscription: !!subscription,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating push subscription:', error);
    return new Response(JSON.stringify({ error: 'Failed to update push subscription' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
