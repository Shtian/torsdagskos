import type { APIRoute } from 'astro';
import { sendEventReminderNotifications } from '../../../lib/event-notifications';

function getOsloHour(date: Date): number {
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Oslo',
    hour: '2-digit',
    hour12: false,
  }).format(date);

  return Number(hour);
}

function isAuthorized(request: Request): boolean {
  const configuredSecret = process.env.CRON_SECRET;

  if (!configuredSecret) {
    return false;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length) === configuredSecret;
  }

  const cronSecretHeader = request.headers.get('x-cron-secret');
  return cronSecretHeader === configuredSecret;
}

export const GET: APIRoute = async ({ request }) => {
  if (!isAuthorized(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized cron request' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const now = new Date();

  if (getOsloHour(now) !== 18) {
    return new Response(
      JSON.stringify({
        ok: true,
        skipped: true,
        reason: 'Outside 18:00 Europe/Oslo execution window',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const summary = await sendEventReminderNotifications({ now });
    return new Response(
      JSON.stringify({
        ok: true,
        skipped: false,
        summary,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending reminder notifications:', error);
    return new Response(JSON.stringify({ error: 'Failed to send reminder notifications' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
