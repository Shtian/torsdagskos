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
      expect(normalized.fieldErrors['event.attendees.0']?.[0]).toContain('>=2');
      expect(normalized.fieldErrors['event.title']?.[0]).toContain('>=3');
      expect(normalized.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'too_small',
            path: 'event.attendees.0',
          }),
          expect.objectContaining({
            code: 'too_small',
            path: 'event.title',
          }),
        ]),
      );
    }
  });

  it('uses _form for root-level validation issues', () => {
    const schema = z.string().min(5);
    const result = parseWithSchema(schema, 'hey');

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.fieldErrors._form?.[0]).toContain('>=5');
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'too_small',
            path: '_form',
          }),
        ]),
      );
    }
  });
});
