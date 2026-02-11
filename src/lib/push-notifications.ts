import * as webpush from 'web-push';

interface PushPayload {
  title: string;
  body: string;
  url: string;
}

interface PushSendResult {
  success: boolean;
  skipped?: boolean;
  expired?: boolean;
  error?: string;
}

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  const publicKey = process.env.PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    return false;
  }

  if (!vapidConfigured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
  }

  return true;
}

export function isPushDeliveryConfigured(): boolean {
  return ensureVapidConfigured();
}

export async function sendPushNotification(
  subscriptionJson: string,
  payload: PushPayload
): Promise<PushSendResult> {
  if (!ensureVapidConfigured()) {
    return {
      success: false,
      skipped: true,
      error: 'Push delivery is not configured',
    };
  }

  try {
    const subscription = JSON.parse(subscriptionJson);
    await webpush.sendNotification(subscription, JSON.stringify(payload), {
      TTL: 60,
    });

    return {
      success: true,
    };
  } catch (error) {
    const errorStatusCode =
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof error.statusCode === 'number'
        ? error.statusCode
        : undefined;

    const expired = errorStatusCode === 404 || errorStatusCode === 410;

    return {
      success: false,
      skipped: !expired && !errorStatusCode,
      expired,
      error: error instanceof Error ? error.message : 'Unknown push error',
    };
  }
}
