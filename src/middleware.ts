import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/service-worker.js',
  '/api/test/(.*)',
  '/api/cron/(.*)',
]);

export const onRequest = clerkMiddleware((auth, context) => {
  const { redirectToSignIn, userId } = auth();

  if (!userId && !isPublicRoute(context.request)) {
    return redirectToSignIn();
  }
});
