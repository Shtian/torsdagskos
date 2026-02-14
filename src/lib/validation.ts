import type { z } from 'zod';

export type ValidationIssue = {
  code: string;
  message: string;
  path: string;
};

export type ValidationErrorPayload = {
  error: 'Validation failed';
  fieldErrors: Record<string, string[]>;
  issues: ValidationIssue[];
};

export type ValidationResult<T> =
  | {
      data: T;
      success: true;
    }
  | {
      error: ValidationErrorPayload;
      success: false;
    };

function toPathKey(path: ReadonlyArray<PropertyKey>): string {
  if (path.length === 0) {
    return '_form';
  }

  return path.map(String).join('.');
}

export function normalizeValidationError(
  error: z.ZodError,
): ValidationErrorPayload {
  const fieldErrors: Record<string, string[]> = {};
  const issues = error.issues.map((issue) => {
    const path = toPathKey(issue.path);
    fieldErrors[path] = [...(fieldErrors[path] ?? []), issue.message];

    return {
      code: issue.code,
      message: issue.message,
      path,
    };
  });

  return {
    error: 'Validation failed',
    fieldErrors,
    issues,
  };
}

export function parseWithSchema<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  input: unknown,
): ValidationResult<z.infer<TSchema>> {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    return {
      error: normalizeValidationError(parsed.error),
      success: false,
    };
  }

  return {
    data: parsed.data,
    success: true,
  };
}
