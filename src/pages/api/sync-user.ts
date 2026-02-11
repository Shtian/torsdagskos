import type { APIRoute } from 'astro';
import { db, Users, eq } from 'astro:db';
import { clerkClient } from '@clerk/astro/server';

export const POST: APIRoute = async (context) => {
  const { userId } = context.locals.auth();

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const user = await clerkClient(context).users.getUser(userId);

    // Check if user exists in local database
    const existingUser = await db
      .select()
      .from(Users)
      .where(eq(Users.clerkUserId, userId))
      .get();

    if (!existingUser) {
      // Sync user to local database
      await db.insert(Users).values({
        clerkUserId: userId,
        email: user.emailAddresses[0]?.emailAddress || '',
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0]?.emailAddress || 'User',
        createdAt: new Date()
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    return new Response(JSON.stringify({ error: 'Failed to sync user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
