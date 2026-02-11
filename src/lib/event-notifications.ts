import { db, NotificationLog, Users } from 'astro:db';
import { sendEmail } from './email';

interface NewEventNotificationInput {
  eventId: number;
  title: string;
  description: string;
  dateTime: Date;
  location: string;
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
