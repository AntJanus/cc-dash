import { z } from "zod";
import { validate, type Result } from "./shared";

/**
 * YAML frontmatter for TODAYS_DIRECTIONS.md.
 *
 * Body is treated as opaque markdown for rendering; only frontmatter is
 * Zod-validated. QA checkbox refs are extracted from the body via regex
 * markers (`<!-- ref:q_xxxxx slug:project -->`) at read time.
 */
export const TodayDirectionsFrontmatterSchema = z.object({
  schema: z.literal("cc-dash/today-directions@1"),
  generated: z.string().datetime({ offset: true }),
  for_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    error: "for_date must be a YYYY-MM-DD calendar date",
  }),
});

export type TodayDirectionsFrontmatter = z.infer<
  typeof TodayDirectionsFrontmatterSchema
>;

export function validateTodayDirectionsFrontmatter(
  input: unknown,
): Result<TodayDirectionsFrontmatter> {
  return validate(TodayDirectionsFrontmatterSchema, input);
}
