import { db, Events, NotificationLog, Users, and, eq, gte } from 'astro:db';
import { sendEmail } from './email';
import {
  isPushDeliveryConfigured,
  sendPushNotification,
} from './push-notifications';

interface NewEventNotificationInput {
  eventId: number;
  title: string;
  description: string;
  dateTime: Date;
  location: string;
}

interface EventSnapshot {
  title: string;
  description: string;
  dateTime: Date;
  location: string;
  mapLink: string | null;
}

interface EventUpdateNotificationInput {
  eventId: number;
  previous: EventSnapshot;
  updated: EventSnapshot;
}

interface ReminderNotificationInput {
  now?: Date;
}

interface NotificationSummary {
  totalUsers: number;
  sent: number;
  failed: number;
  skipped: number;
}

interface ReminderNotificationSummary extends NotificationSummary {
  eventsConsidered: number;
  eventsTargeted: number;
}

interface PushDeliveryInput {
  eventId: number;
  type: 'new_event' | 'event_update' | 'reminder';
  title: string;
  body: string;
  url: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatEventDate(dateTime: Date): string {
  return new Intl.DateTimeFormat('nb-NO', {
    timeZone: 'Europe/Oslo',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateTime);
}

function normalizeText(value: string): string {
  return value.trim();
}

function normalizeNullableText(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildNewEventEmailContent(input: NewEventNotificationInput): {
  subject: string;
  html: string;
  text: string;
} {
  const formattedDate = formatEventDate(input.dateTime);
  const safeDescription =
    input.description?.trim() || 'Ingen beskrivelse oppgitt.';
  const safeTitle = escapeHtml(input.title);
  const safeLocation = escapeHtml(input.location);
  const safeDescriptionHtml = escapeHtml(safeDescription);

  return {
    subject: `Nytt Torsdagskos-arrangement: ${input.title}`,
    text: [
      'Et nytt arrangement er opprettet.',
      '',
      `Tittel: ${input.title}`,
      `Dato og tid: ${formattedDate} (Europe/Oslo)`,
      `Sted: ${input.location}`,
      `Beskrivelse: ${safeDescription}`,
    ].join('\n'),
    html: `
      <h2>Nytt Torsdagskos-arrangement</h2>
      <p>Et nytt arrangement er opprettet:</p>
      <ul>
        <li><strong>Tittel:</strong> ${safeTitle}</li>
        <li><strong>Dato og tid:</strong> ${formattedDate} (Europe/Oslo)</li>
        <li><strong>Sted:</strong> ${safeLocation}</li>
      </ul>
      <p><strong>Beskrivelse:</strong></p>
      <p>${safeDescriptionHtml}</p>
    `,
  };
}

function buildReminderEmailContent(event: {
  title: string;
  description: string;
  dateTime: Date;
  location: string;
  mapLink: string | null;
}): {
  subject: string;
  html: string;
  text: string;
} {
  const formattedDate = formatEventDate(event.dateTime);
  const safeTitle = escapeHtml(event.title);
  const safeLocation = escapeHtml(event.location);
  const safeDescription =
    event.description.trim() || 'Ingen beskrivelse oppgitt.';
  const safeDescriptionHtml = escapeHtml(safeDescription);
  const safeMapLink = event.mapLink ? escapeHtml(event.mapLink) : null;

  return {
    subject: `Påminnelse: ${event.title} er i morgen`,
    text: [
      'Påminnelse: Du har et arrangement i morgen.',
      '',
      `Tittel: ${event.title}`,
      `Dato og tid: ${formattedDate} (Europe/Oslo)`,
      `Sted: ${event.location}`,
      `Beskrivelse: ${safeDescription}`,
      event.mapLink
        ? `Kartlenke: ${event.mapLink}`
        : 'Kartlenke: (ikke oppgitt)',
    ].join('\n'),
    html: `
      <h2>Torsdagskos-påminnelse</h2>
      <p>Arrangementet ditt skjer i morgen:</p>
      <ul>
        <li><strong>Tittel:</strong> ${safeTitle}</li>
        <li><strong>Dato og tid:</strong> ${formattedDate} (Europe/Oslo)</li>
        <li><strong>Sted:</strong> ${safeLocation}</li>
        ${safeMapLink ? `<li><strong>Kartlenke:</strong> <a href="${safeMapLink}">${safeMapLink}</a></li>` : '<li><strong>Kartlenke:</strong> Ikke oppgitt</li>'}
      </ul>
      <p><strong>Beskrivelse:</strong></p>
      <p>${safeDescriptionHtml}</p>
    `,
  };
}

type ChangedField = {
  label: string;
  previous: string;
  updated: string;
};

function getChangedFields(input: EventUpdateNotificationInput): ChangedField[] {
  const previousDescription = normalizeText(input.previous.description || '');
  const updatedDescription = normalizeText(input.updated.description || '');
  const previousMapLink = normalizeNullableText(input.previous.mapLink);
  const updatedMapLink = normalizeNullableText(input.updated.mapLink);

  const changes: ChangedField[] = [];

  if (
    normalizeText(input.previous.title) !== normalizeText(input.updated.title)
  ) {
    changes.push({
      label: 'Tittel',
      previous: input.previous.title,
      updated: input.updated.title,
    });
  }

  if (previousDescription !== updatedDescription) {
    changes.push({
      label: 'Beskrivelse',
      previous: previousDescription || '(tom)',
      updated: updatedDescription || '(tom)',
    });
  }

  if (input.previous.dateTime.getTime() !== input.updated.dateTime.getTime()) {
    changes.push({
      label: 'Dato og tid',
      previous: `${formatEventDate(input.previous.dateTime)} (Europe/Oslo)`,
      updated: `${formatEventDate(input.updated.dateTime)} (Europe/Oslo)`,
    });
  }

  if (
    normalizeText(input.previous.location) !==
    normalizeText(input.updated.location)
  ) {
    changes.push({
      label: 'Sted',
      previous: input.previous.location,
      updated: input.updated.location,
    });
  }

  if (previousMapLink !== updatedMapLink) {
    changes.push({
      label: 'Kartlenke',
      previous: previousMapLink || '(ingen)',
      updated: updatedMapLink || '(ingen)',
    });
  }

  return changes;
}

function buildEventUpdateEmailContent(input: EventUpdateNotificationInput): {
  subject: string;
  html: string;
  text: string;
} {
  const changedFields = getChangedFields(input);
  const titleForSubject = input.updated.title || input.previous.title;

  if (changedFields.length === 0) {
    return {
      subject: `Arrangement oppdatert: ${titleForSubject}`,
      text: [
        `Arrangementet "${titleForSubject}" ble oppdatert, men ingen synlige felt ble endret.`,
        '',
        `Dato og tid: ${formatEventDate(input.updated.dateTime)} (Europe/Oslo)`,
        `Sted: ${input.updated.location}`,
      ].join('\n'),
      html: `
        <h2>Torsdagskos-arrangement oppdatert</h2>
        <p>Arrangementet <strong>${escapeHtml(titleForSubject)}</strong> ble oppdatert, men ingen synlige felt ble endret.</p>
        <ul>
          <li><strong>Dato og tid:</strong> ${formatEventDate(input.updated.dateTime)} (Europe/Oslo)</li>
          <li><strong>Sted:</strong> ${escapeHtml(input.updated.location)}</li>
        </ul>
      `,
    };
  }

  const textChanges = changedFields
    .map(
      (change) =>
        `${change.label}\n- Før: ${change.previous}\n- Etter: ${change.updated}`,
    )
    .join('\n\n');

  const htmlChanges = changedFields
    .map(
      (change) => `
        <li>
          <strong>${escapeHtml(change.label)}</strong><br />
          <span>Før: ${escapeHtml(change.previous)}</span><br />
          <span>Etter: ${escapeHtml(change.updated)}</span>
        </li>
      `,
    )
    .join('');

  return {
    subject: `Arrangement oppdatert: ${titleForSubject}`,
    text: [
      `Et arrangement har blitt oppdatert: ${titleForSubject}`,
      '',
      'Hva ble endret:',
      textChanges,
    ].join('\n'),
    html: `
      <h2>Torsdagskos-arrangement oppdatert</h2>
      <p>Et arrangement har blitt oppdatert: <strong>${escapeHtml(titleForSubject)}</strong></p>
      <p><strong>Hva ble endret:</strong></p>
      <ul>
        ${htmlChanges}
      </ul>
    `,
  };
}

function getOsloDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Oslo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function getTomorrowOsloDateKey(now: Date): string {
  const nowParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Oslo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = Number(
    nowParts.find((part) => part.type === 'year')?.value || '0',
  );
  const month = Number(
    nowParts.find((part) => part.type === 'month')?.value || '1',
  );
  const day = Number(
    nowParts.find((part) => part.type === 'day')?.value || '1',
  );

  const osloTodayAsUtcMidnight = new Date(Date.UTC(year, month - 1, day));
  osloTodayAsUtcMidnight.setUTCDate(osloTodayAsUtcMidnight.getUTCDate() + 1);

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(osloTodayAsUtcMidnight);
}

async function sendPushNotificationsToOptedInUsers(
  input: PushDeliveryInput,
): Promise<void> {
  if (!isPushDeliveryConfigured()) {
    return;
  }

  const users = await db.select().from(Users);
  const pushEligibleUsers = users.filter(
    (user) => user.browserNotificationsEnabled && !!user.pushSubscription,
  );

  if (pushEligibleUsers.length === 0) {
    return;
  }

  await Promise.all(
    pushEligibleUsers.map(async (user) => {
      const hasAlreadyReceived = await db
        .select({ id: NotificationLog.id })
        .from(NotificationLog)
        .where(
          and(
            eq(NotificationLog.userId, user.id),
            eq(NotificationLog.eventId, input.eventId),
            eq(NotificationLog.type, input.type),
            eq(NotificationLog.channel, 'push'),
          ),
        )
        .get();

      if (hasAlreadyReceived) {
        return;
      }

      const result = await sendPushNotification(user.pushSubscription!, {
        title: input.title,
        body: input.body,
        url: input.url,
      });

      if (result.expired) {
        await db
          .update(Users)
          .set({
            browserNotificationsEnabled: false,
            pushSubscription: null,
            pushSubscriptionUpdatedAt: new Date(),
          })
          .where(eq(Users.id, user.id));
        return;
      }

      if (result.success) {
        await db.insert(NotificationLog).values({
          userId: user.id,
          eventId: input.eventId,
          type: input.type,
          channel: 'push',
          sentAt: new Date(),
        });
      }
    }),
  );
}

export async function sendNewEventNotifications(
  input: NewEventNotificationInput,
): Promise<NotificationSummary> {
  const users = await db.select().from(Users);
  if (users.length === 0) {
    return {
      totalUsers: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    };
  }

  const emailContent = buildNewEventEmailContent(input);

  const results = await Promise.all(
    users.map(async (user) => {
      const sendResult = await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      if (sendResult.success) {
        await db.insert(NotificationLog).values({
          userId: user.id,
          eventId: input.eventId,
          type: 'new_event',
          channel: 'email',
          sentAt: new Date(),
        });
      }

      return sendResult;
    }),
  );

  const sent = results.filter((result) => result.success).length;
  const failed = results.filter(
    (result) => !result.success && !result.skipped,
  ).length;
  const skipped = results.filter((result) => result.skipped).length;

  try {
    await sendPushNotificationsToOptedInUsers({
      eventId: input.eventId,
      type: 'new_event',
      title: `Nytt arrangement: ${input.title}`,
      body: `${formatEventDate(input.dateTime)} · ${input.location}`,
      url: `/events/${input.eventId}`,
    });
  } catch (error) {
    console.error('Push notification delivery failed for new event:', error);
  }

  return {
    totalUsers: users.length,
    sent,
    failed,
    skipped,
  };
}

export async function sendEventUpdateNotifications(
  input: EventUpdateNotificationInput,
): Promise<NotificationSummary> {
  const users = await db.select().from(Users);
  if (users.length === 0) {
    return {
      totalUsers: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    };
  }

  const emailContent = buildEventUpdateEmailContent(input);

  const results = await Promise.all(
    users.map(async (user) => {
      const sendResult = await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      if (sendResult.success) {
        await db.insert(NotificationLog).values({
          userId: user.id,
          eventId: input.eventId,
          type: 'event_update',
          channel: 'email',
          sentAt: new Date(),
        });
      }

      return sendResult;
    }),
  );

  const sent = results.filter((result) => result.success).length;
  const failed = results.filter(
    (result) => !result.success && !result.skipped,
  ).length;
  const skipped = results.filter((result) => result.skipped).length;

  try {
    const title = input.updated.title || input.previous.title;
    await sendPushNotificationsToOptedInUsers({
      eventId: input.eventId,
      type: 'event_update',
      title: `Arrangement oppdatert: ${title}`,
      body: `${formatEventDate(input.updated.dateTime)} · ${input.updated.location}`,
      url: `/events/${input.eventId}`,
    });
  } catch (error) {
    console.error('Push notification delivery failed for event update:', error);
  }

  return {
    totalUsers: users.length,
    sent,
    failed,
    skipped,
  };
}

export async function sendEventReminderNotifications(
  input: ReminderNotificationInput = {},
): Promise<ReminderNotificationSummary> {
  const now = input.now || new Date();
  const tomorrowOsloDateKey = getTomorrowOsloDateKey(now);

  const users = await db.select().from(Users);
  if (users.length === 0) {
    return {
      totalUsers: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      eventsConsidered: 0,
      eventsTargeted: 0,
    };
  }

  const upcomingEvents = await db
    .select()
    .from(Events)
    .where(gte(Events.dateTime, now));

  const targetEvents = upcomingEvents.filter(
    (event) => getOsloDateKey(new Date(event.dateTime)) === tomorrowOsloDateKey,
  );

  if (targetEvents.length === 0) {
    return {
      totalUsers: users.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      eventsConsidered: upcomingEvents.length,
      eventsTargeted: 0,
    };
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const event of targetEvents) {
    const emailContent = buildReminderEmailContent({
      title: event.title,
      description: event.description || '',
      dateTime: new Date(event.dateTime),
      location: event.location,
      mapLink: event.mapLink || null,
    });

    const results = await Promise.all(
      users.map(async (user) => {
        const alreadySent = await db
          .select({ id: NotificationLog.id })
          .from(NotificationLog)
          .where(
            and(
              eq(NotificationLog.userId, user.id),
              eq(NotificationLog.eventId, event.id),
              eq(NotificationLog.type, 'reminder'),
              eq(NotificationLog.channel, 'email'),
            ),
          )
          .get();

        if (alreadySent) {
          return {
            success: false,
            skipped: true,
          };
        }

        const sendResult = await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        if (sendResult.success) {
          await db.insert(NotificationLog).values({
            userId: user.id,
            eventId: event.id,
            type: 'reminder',
            channel: 'email',
            sentAt: new Date(),
          });
        }

        return sendResult;
      }),
    );

    sent += results.filter((result) => result.success).length;
    failed += results.filter(
      (result) => !result.success && !result.skipped,
    ).length;
    skipped += results.filter((result) => result.skipped).length;

    try {
      await sendPushNotificationsToOptedInUsers({
        eventId: event.id,
        type: 'reminder',
        title: `Påminnelse: ${event.title} er i morgen`,
        body: `${formatEventDate(new Date(event.dateTime))} · ${event.location}`,
        url: `/events/${event.id}`,
      });
    } catch (error) {
      console.error('Push notification delivery failed for reminder:', error);
    }
  }

  return {
    totalUsers: users.length,
    sent,
    failed,
    skipped,
    eventsConsidered: upcomingEvents.length,
    eventsTargeted: targetEvents.length,
  };
}
