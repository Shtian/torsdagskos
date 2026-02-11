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
    const enabled = body?.enabled;

    if (typeof enabled !== 'boolean') {
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

      await db.insert(Users).values({
        clerkUserId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name:
          `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
          clerkUser.emailAddresses[0]?.emailAddress ||
          'User',
        browserNotificationsEnabled: enabled,
        createdAt: new Date(),
      });
    } else {
      await db
        .update(Users)
        .set({ browserNotificationsEnabled: enabled })
        .where(eq(Users.id, existingUser.id));
    }

    return new Response(
      JSON.stringify({
        success: true,
        browserNotificationsEnabled: enabled,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating notification preference:', error);
    return new Response(JSON.stringify({ error: 'Failed to update notification preference' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
