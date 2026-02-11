import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/access-denied',
  '/service-worker.js',
  '/api/test/(.*)',
  '/api/cron/(.*)',
]);

export const onRequest = clerkMiddleware((auth, context) => {
  const { userId } = auth();

  if (!userId && !isPublicRoute(context.request)) {
    const requestUrl = new URL(context.request.url);
    const targetUrl = new URL('/access-denied', requestUrl.origin);
    const attemptedPath = `${requestUrl.pathname}${requestUrl.search}`;

    if (attemptedPath) {
      targetUrl.searchParams.set('from', attemptedPath);
    }

    return context.redirect(targetUrl.pathname + targetUrl.search);
  }
});
