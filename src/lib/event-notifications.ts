import { db, NotificationLog, Users } from 'astro:db';
import { sendEmail } from './email';

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

interface NotificationSummary {
  totalUsers: number;
  sent: number;
  failed: number;
  skipped: number;
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
  const safeDescription = input.description?.trim() || 'No description provided.';
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

  if (normalizeText(input.previous.title) !== normalizeText(input.updated.title)) {
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

  if (normalizeText(input.previous.location) !== normalizeText(input.updated.location)) {
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
        `${change.label}\n- Before: ${change.previous}\n- After: ${change.updated}`
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
      `
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

export async function sendNewEventNotifications(
  input: NewEventNotificationInput
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
    })
  );

  const sent = results.filter((result) => result.success).length;
  const failed = results.filter((result) => !result.success && !result.skipped).length;
  const skipped = results.filter((result) => result.skipped).length;

  return {
    totalUsers: users.length,
    sent,
    failed,
    skipped,
  };
}

export async function sendEventUpdateNotifications(
  input: EventUpdateNotificationInput
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
    })
  );

  const sent = results.filter((result) => result.success).length;
  const failed = results.filter((result) => !result.success && !result.skipped).length;
  const skipped = results.filter((result) => result.skipped).length;

  return {
    totalUsers: users.length,
    sent,
    failed,
    skipped,
  };
}
