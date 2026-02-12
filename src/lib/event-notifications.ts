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
  return new Intl.DateTimeFormat('en-GB', {
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
    input.description?.trim() || 'No description provided.';
  const safeTitle = escapeHtml(input.title);
  const safeLocation = escapeHtml(input.location);
  const safeDescriptionHtml = escapeHtml(safeDescription);

  return {
    subject: `New Torsdagskos event: ${input.title}`,
    text: [
      'A new event has been created.',
      '',
      `Title: ${input.title}`,
      `Date & time: ${formattedDate} (Europe/Oslo)`,
      `Location: ${input.location}`,
      `Description: ${safeDescription}`,
    ].join('\n'),
    html: `
      <h2>New Torsdagskos Event</h2>
      <p>A new event has been created:</p>
      <ul>
        <li><strong>Title:</strong> ${safeTitle}</li>
        <li><strong>Date &amp; time:</strong> ${formattedDate} (Europe/Oslo)</li>
        <li><strong>Location:</strong> ${safeLocation}</li>
      </ul>
      <p><strong>Description:</strong></p>
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
    event.description.trim() || 'No description provided.';
  const safeDescriptionHtml = escapeHtml(safeDescription);
  const safeMapLink = event.mapLink ? escapeHtml(event.mapLink) : null;

  return {
    subject: `Reminder: ${event.title} is tomorrow`,
    text: [
      'Reminder: You have an event tomorrow.',
      '',
      `Title: ${event.title}`,
      `Date & time: ${formattedDate} (Europe/Oslo)`,
      `Location: ${event.location}`,
      `Description: ${safeDescription}`,
      event.mapLink ? `Map link: ${event.mapLink}` : 'Map link: (not provided)',
    ].join('\n'),
    html: `
      <h2>Torsdagskos Reminder</h2>
      <p>Your event is happening tomorrow:</p>
      <ul>
        <li><strong>Title:</strong> ${safeTitle}</li>
        <li><strong>Date &amp; time:</strong> ${formattedDate} (Europe/Oslo)</li>
        <li><strong>Location:</strong> ${safeLocation}</li>
        ${safeMapLink ? `<li><strong>Map link:</strong> <a href="${safeMapLink}">${safeMapLink}</a></li>` : '<li><strong>Map link:</strong> Not provided</li>'}
      </ul>
      <p><strong>Description:</strong></p>
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
      label: 'Title',
      previous: input.previous.title,
      updated: input.updated.title,
    });
  }

  if (previousDescription !== updatedDescription) {
    changes.push({
      label: 'Description',
      previous: previousDescription || '(empty)',
      updated: updatedDescription || '(empty)',
    });
  }

  if (input.previous.dateTime.getTime() !== input.updated.dateTime.getTime()) {
    changes.push({
      label: 'Date & time',
      previous: `${formatEventDate(input.previous.dateTime)} (Europe/Oslo)`,
      updated: `${formatEventDate(input.updated.dateTime)} (Europe/Oslo)`,
    });
  }

  if (
    normalizeText(input.previous.location) !==
    normalizeText(input.updated.location)
  ) {
    changes.push({
      label: 'Location',
      previous: input.previous.location,
      updated: input.updated.location,
    });
  }

  if (previousMapLink !== updatedMapLink) {
    changes.push({
      label: 'Map link',
      previous: previousMapLink || '(none)',
      updated: updatedMapLink || '(none)',
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
      subject: `Event updated: ${titleForSubject}`,
      text: [
        `The event "${titleForSubject}" was updated, but no user-visible fields changed.`,
        '',
        `Date & time: ${formatEventDate(input.updated.dateTime)} (Europe/Oslo)`,
        `Location: ${input.updated.location}`,
      ].join('\n'),
      html: `
        <h2>Torsdagskos Event Updated</h2>
        <p>The event <strong>${escapeHtml(titleForSubject)}</strong> was updated, but no user-visible fields changed.</p>
        <ul>
          <li><strong>Date &amp; time:</strong> ${formatEventDate(input.updated.dateTime)} (Europe/Oslo)</li>
          <li><strong>Location:</strong> ${escapeHtml(input.updated.location)}</li>
        </ul>
      `,
    };
  }

  const textChanges = changedFields
    .map(
      (change) =>
        `${change.label}\n- Before: ${change.previous}\n- After: ${change.updated}`,
    )
    .join('\n\n');

  const htmlChanges = changedFields
    .map(
      (change) => `
        <li>
          <strong>${escapeHtml(change.label)}</strong><br />
          <span>Before: ${escapeHtml(change.previous)}</span><br />
          <span>After: ${escapeHtml(change.updated)}</span>
        </li>
      `,
    )
    .join('');

  return {
    subject: `Event updated: ${titleForSubject}`,
    text: [
      `An event has been updated: ${titleForSubject}`,
      '',
      'What changed:',
      textChanges,
    ].join('\n'),
    html: `
      <h2>Torsdagskos Event Updated</h2>
      <p>An event has been updated: <strong>${escapeHtml(titleForSubject)}</strong></p>
      <p><strong>What changed:</strong></p>
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
      title: `New event: ${input.title}`,
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
      title: `Event updated: ${title}`,
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
        title: `Reminder: ${event.title} is tomorrow`,
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
