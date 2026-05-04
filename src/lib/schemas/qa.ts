import { z } from "zod";
import { validate, type Result } from "./shared";

// --- ID and status patterns ---

const QA_ID_REGEX = /^q_[a-z0-9]{5}$/;
const ROADMAP_ID_REGEX = /^r_[a-z0-9]{5}$/;

/**
 * QA item statuses.
 * - pending: not yet executed
 * - passed: executed successfully
 * - failed: executed and failed (typically paired with a roadmap issue via roadmapRef)
 * - needs-decision: blocked on a design conversation, not pure execution
 * - skipped: intentionally bypassed (e.g., not applicable to current build)
 */
export const QaStatus = z.enum([
  "pending",
  "passed",
  "failed",
  "needs-decision",
  "skipped",
]);

// --- Frontmatter schema ---

/**
 * YAML frontmatter for QA.md files.
 * Schema literal ensures forward compatibility via version checks.
 */
export const QaFrontmatterSchema = z.object({
  schema: z.literal("cc-dash/qa@1"),
  project: z.string(),
  last_updated: z.string().datetime({ offset: true }),
});

export type QaFrontmatter = z.infer<typeof QaFrontmatterSchema>;

// --- Item metadata (parsed from HTML comments) ---

/**
 * Metadata extracted from HTML comments on QA list items.
 * Example: <!-- id:q_a1b2c status:failed at:2026-05-04T10:20:00-06:00 ref:r_xyz12 -->
 *
 * The parser maps `ref` to `roadmapRef` on the full QaItem.
 */
export const QaItemMetadataSchema = z.object({
  id: z.string().regex(QA_ID_REGEX, {
    error: "QA item ID must match q_ + 5 lowercase alphanumeric chars",
  }),
  status: QaStatus,
  at: z.string().datetime({ offset: true }).optional(),
  ref: z.string().regex(ROADMAP_ID_REGEX).optional(),
});

export type QaItemMetadata = z.infer<typeof QaItemMetadataSchema>;

// --- Full item (after parsing, with description and optional note) ---

/**
 * A complete QA item combining metadata, description text, and optional note.
 * Notes are blockquotes immediately following the item line.
 */
export const QaItemSchema = z
  .object({
    id: z.string().regex(QA_ID_REGEX, {
      error: "QA item ID must match q_ + 5 lowercase alphanumeric chars",
    }),
    status: QaStatus,
    description: z.string(),
    at: z.string().datetime({ offset: true }).optional(),
    roadmapRef: z
      .string()
      .regex(ROADMAP_ID_REGEX, {
        error: "Roadmap ref must match r_ + 5 lowercase alphanumeric chars",
      })
      .optional(),
    note: z.string().optional(),
  })
  .refine((item) => item.status === "pending" || item.at !== undefined, {
    error: "Non-pending QA items must record an `at` timestamp",
    path: ["at"],
  });

export type QaItem = z.infer<typeof QaItemSchema>;

// --- Full file ---

/**
 * Complete parsed QA.md file including frontmatter, the free-form Setup block,
 * the parsed checklist items, and the source file path.
 */
export const QaFileSchema = QaFrontmatterSchema.extend({
  setup: z.string(),
  items: z.array(QaItemSchema),
  filePath: z.string(),
});

export type QaFile = z.infer<typeof QaFileSchema>;

// --- Validation wrappers (Result type pattern) ---

export function validateQaFrontmatter(input: unknown): Result<QaFrontmatter> {
  return validate(QaFrontmatterSchema, input);
}

export function validateQaItem(input: unknown): Result<QaItem> {
  return validate(QaItemSchema, input);
}

export function validateQaFile(input: unknown): Result<QaFile> {
  return validate(QaFileSchema, input);
}
