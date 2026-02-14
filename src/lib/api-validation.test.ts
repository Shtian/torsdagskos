import { describe, expect, it } from 'vitest';
import {
  createValidationErrorPayload,
  emptyNotificationSummary,
  validateCreateEventApiRequest,
  validateNotificationSummary,
  validateRsvpApiRequest,
  validateUpdateEventApiRequest,
} from './api-validation';

describe('api validation helpers', () => {
  it('parses create event payloads with normalized optional fields', () => {
    const result = validateCreateEventApiRequest({
      dateTime: '2026-06-01T18:30:00.000Z',
      description: null,
      location: '  Oslo  ',
      mapLink: '   ',
      title: '  Torsdagskos  ',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toMatchObject({
        description: '',
        location: 'Oslo',
        mapLink: null,
        title: 'Torsdagskos',
      });
      expect(result.data.dateTime).toBeInstanceOf(Date);
    }
  });

  it('returns normalized validation errors for invalid update payloads', () => {
    const result = validateUpdateEventApiRequest({
      dateTime: 'not-a-date',
      eventId: 0,
      location: '',
      title: '',
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.error).toBe('Validation failed');
      expect(result.error.fieldErrors).toHaveProperty('eventId');
      expect(result.error.fieldErrors).toHaveProperty('dateTime');
      expect(result.error.fieldErrors).toHaveProperty('title');
      expect(result.error.fieldErrors).toHaveProperty('location');
    }
  });

  it('rejects invalid RSVP status values', () => {
    const result = validateRsvpApiRequest({
      eventId: 12,
      status: 'yes',
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.fieldErrors).toHaveProperty('status');
    }
  });

  it('validates notification summary payload shape', () => {
    const validSummary = validateNotificationSummary({
      failed: 0,
      sent: 2,
      skipped: 1,
      totalUsers: 3,
    });

    const invalidSummary = validateNotificationSummary({
      failed: -1,
      sent: 2,
      skipped: 1,
      totalUsers: 3,
    });

    expect(validSummary.success).toBe(true);
    expect(invalidSummary.success).toBe(false);
    expect(emptyNotificationSummary).toEqual({
      failed: 0,
      sent: 0,
      skipped: 0,
      totalUsers: 0,
    });
  });

  it('creates a consistent form-level validation payload', () => {
    const errorPayload = createValidationErrorPayload(
      'Request body must be valid JSON.',
    );

    expect(errorPayload).toEqual({
      error: 'Validation failed',
      fieldErrors: {
        _form: ['Request body must be valid JSON.'],
      },
      issues: [
        {
          code: 'custom',
          message: 'Request body must be valid JSON.',
          path: '_form',
        },
      ],
    });
  });
});
