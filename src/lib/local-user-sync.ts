import { clerkClient } from '@clerk/astro/server';
import { db, Users, eq } from 'astro:db';

type ClerkContext = Parameters<typeof clerkClient>[0];
type ClerkUser = Awaited<
  ReturnType<ReturnType<typeof clerkClient>['users']['getUser']>
>;
type LocalUser = Awaited<ReturnType<typeof getLocalUserByClerkId>>;

function getUserDisplayName(clerkUser: ClerkUser): string {
  return (
    `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    'User'
  );
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('UNIQUE constraint');
}

export async function getLocalUserByClerkId(clerkUserId: string) {
  return db
    .select()
    .from(Users)
    .where(eq(Users.clerkUserId, clerkUserId))
    .get();
}

export async function ensureLocalUser(
  clerkContext: ClerkContext,
  clerkUserId: string,
  options?: { clerkUser?: ClerkUser },
): Promise<NonNullable<LocalUser>> {
  let localUser = await getLocalUserByClerkId(clerkUserId);
  if (localUser) {
    return localUser;
  }

  const clerkUser =
    options?.clerkUser ??
    (await clerkClient(clerkContext).users.getUser(clerkUserId));

  try {
    await db.insert(Users).values({
      clerkUserId,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      name: getUserDisplayName(clerkUser),
      createdAt: new Date(),
    });
  } catch (error) {
    // Ignore race on unique clerkUserId. Another request may have created the row.
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
  }

  localUser = await getLocalUserByClerkId(clerkUserId);
  if (!localUser) {
    throw new Error(`Failed to sync local user for Clerk user ${clerkUserId}`);
  }

  return localUser;
}
