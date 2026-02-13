import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { normalizeValidationError, parseWithSchema } from './validation';

describe('validation helpers', () => {
  it('returns typed data when schema parsing succeeds', () => {
    const schema = z.object({
      count: z.number().int().min(1),
      name: z.string().min(1),
    });

    const result = parseWithSchema(schema, {
      count: 3,
      name: 'Torsdagskos',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        count: 3,
        name: 'Torsdagskos',
      });
    }
  });

  it('normalizes validation errors with consistent shape', () => {
    const schema = z.object({
      event: z.object({
        attendees: z.array(z.string().min(2)),
        title: z.string().min(3),
      }),
    });

    const parsed = schema.safeParse({
      event: {
        attendees: ['a'],
        title: '',
      },
    });

    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      const normalized = normalizeValidationError(parsed.error);

      expect(normalized.error).toBe('Validation failed');
      expect(normalized.fieldErrors).toEqual({
        'event.attendees.0': [
          'Too small: expected string to have >=2 characters',
        ],
        'event.title': ['Too small: expected string to have >=3 characters'],
      });
      expect(normalized.issues).toEqual([
        {
          code: 'too_small',
          message: 'Too small: expected string to have >=2 characters',
          path: 'event.attendees.0',
        },
        {
          code: 'too_small',
          message: 'Too small: expected string to have >=3 characters',
          path: 'event.title',
        },
      ]);
    }
  });

  it('uses _form for root-level validation issues', () => {
    const schema = z.string().min(5);
    const result = parseWithSchema(schema, 'hey');

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.fieldErrors).toEqual({
        _form: ['Too small: expected string to have >=5 characters'],
      });
      expect(result.error.issues).toEqual([
        {
          code: 'too_small',
          message: 'Too small: expected string to have >=5 characters',
          path: '_form',
        },
      ]);
    }
  });
});
