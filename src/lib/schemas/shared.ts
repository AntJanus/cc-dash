import { z } from "zod";

/**
 * Structured validation error with field path, message, and received value.
 * Used instead of throwing ZodError for predictable error handling.
 */
export type ValidationError = {
  field: string;
  message: string;
  received: unknown;
};

/**
 * Discriminated union result type for schema validation.
 * Consumers use pattern matching (if result.success) instead of try/catch.
 */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

/**
 * Wraps Zod safeParse into the Result type pattern.
 * Maps Zod issues into structured ValidationError objects.
 *
 * NOTE: In Zod v4, .strip() is the default behavior (unknown keys are dropped).
 * Do NOT call .strip() explicitly -- it is deprecated in v4.
 */
export function validate<T>(
  schema: z.ZodType<T>,
  input: unknown,
): Result<T> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: ValidationError[] = result.error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
    received: "received" in issue ? issue.received : undefined,
  }));
  return { success: false, errors };
}
