import { z } from 'zod';
import { type ValidationErrorPayload, parseWithSchema } from './validation';

function normalizeOptionalText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function normalizeOptionalUrl(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

const createEventApiRequestSchema = z.object({
  dateTime: z.coerce.date({
    error: 'dateTime must be a valid ISO datetime string.',
  }),
  description: z.preprocess(normalizeOptionalText, z.string().max(4000)),
  location: z
    .string()
    .trim()
    .min(1, 'location is required.')
    .max(150, 'location must be 150 characters or fewer.'),
  mapLink: z.preprocess(normalizeOptionalUrl, z.union([z.null(), z.url()])),
  title: z
    .string()
    .trim()
    .min(1, 'title is required.')
    .max(120, 'title must be 120 characters or fewer.'),
});

const updateEventApiRequestSchema = createEventApiRequestSchema.extend({
  eventId: z.coerce
    .number({
      error: 'eventId must be a number.',
    })
    .int('eventId must be an integer.')
    .positive('eventId must be a positive number.'),
});

const rsvpApiRequestSchema = z.object({
  eventId: z.coerce
    .number({
      error: 'eventId must be a number.',
    })
    .int('eventId must be an integer.')
    .positive('eventId must be a positive number.'),
  status: z.enum(['going', 'maybe', 'not_going']),
});

const notificationSummarySchema = z.object({
  failed: z.number().int().nonnegative(),
  sent: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  totalUsers: z.number().int().nonnegative(),
});

export type CreateEventApiInput = z.infer<typeof createEventApiRequestSchema>;
export type UpdateEventApiInput = z.infer<typeof updateEventApiRequestSchema>;
export type RsvpApiInput = z.infer<typeof rsvpApiRequestSchema>;
export type NotificationSummary = z.infer<typeof notificationSummarySchema>;

export const emptyNotificationSummary: NotificationSummary = {
  failed: 0,
  sent: 0,
  skipped: 0,
  totalUsers: 0,
};

export function validateCreateEventApiRequest(input: unknown) {
  return parseWithSchema(createEventApiRequestSchema, input);
}

export function validateUpdateEventApiRequest(input: unknown) {
  return parseWithSchema(updateEventApiRequestSchema, input);
}

export function validateRsvpApiRequest(input: unknown) {
  return parseWithSchema(rsvpApiRequestSchema, input);
}

export function validateNotificationSummary(input: unknown) {
  return parseWithSchema(notificationSummarySchema, input);
}

export function createValidationErrorPayload(
  message: string,
): ValidationErrorPayload {
  return {
    error: 'Validation failed',
    fieldErrors: {
      _form: [message],
    },
    issues: [
      {
        code: 'custom',
        message,
        path: '_form',
      },
    ],
  };
}
