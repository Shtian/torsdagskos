import type { APIRoute } from 'astro';
import { ensureLocalUser } from '../../lib/local-user-sync';

export const POST: APIRoute = async (context) => {
  const { userId } = context.locals.auth();

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await ensureLocalUser(context, userId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    return new Response(JSON.stringify({ error: 'Failed to sync user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
