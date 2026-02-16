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
    const enabled = body?.enabled;

    if (typeof enabled !== 'boolean') {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const localUser = await ensureLocalUser(context, userId);

    await db
      .update(Users)
      .set({ browserNotificationsEnabled: enabled })
      .where(eq(Users.id, localUser.id));

    return new Response(
      JSON.stringify({
        success: true,
        browserNotificationsEnabled: enabled,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error updating notification preference:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update notification preference' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
