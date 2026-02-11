import type { APIRoute } from 'astro';
import { db, Users, eq } from 'astro:db';

/**
 * Get current authenticated user's database record
 * Only available in development mode
 *
 * GET /api/test/current-user
 */
export const GET: APIRoute = async ({ locals, cookies }) => {
  // Only allow in development
  if (import.meta.env.PROD) {
    return new Response(JSON.stringify({ error: 'Not available in production' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const auth = locals.auth();
    const { userId } = auth;

    if (!userId) {
      // Try to get from cookies as fallback
      const sessionCookie = cookies.get('__session');
      return new Response(JSON.stringify({
        error: 'Not authenticated',
        debug: { hasAuth: !!auth, hasSession: !!sessionCookie }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await db
      .select()
      .from(Users)
      .where(eq(Users.clerkUserId, userId))
      .get();

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found in database', userId }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Current user error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
