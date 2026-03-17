import { z } from "zod";
import { validate, type Result } from "./shared";

// --- ID and status patterns ---

const IDEA_ID_REGEX = /^i_[a-z0-9]{5}$/;

/**
 * Idea statuses: not-started -> started -> complete
 */
export const IdeaStatus = z.enum(["not-started", "started", "complete"]);

// --- Frontmatter schema ---

/**
 * YAML frontmatter for PROJECT_IDEAS.md files.
 * Schema literal ensures forward compatibility via version checks.
 */
export const IdeasFrontmatterSchema = z.object({
  schema: z.literal("cc-dash/ideas@1"),
  last_updated: z.string().datetime({ offset: true }),
});

export type IdeasFrontmatter = z.infer<typeof IdeasFrontmatterSchema>;

// --- Item schema ---

/**
 * A single project idea parsed from a ### heading with HTML comment metadata.
 * The body contains all content under the heading (paragraphs, #### subsections, lists).
 */
export const IdeaItemSchema = z.object({
  id: z.string().regex(IDEA_ID_REGEX, {
    error: "Idea ID must match i_ + 5 lowercase alphanumeric chars",
  }),
  status: IdeaStatus,
  /** Project path (required when started) */
  path: z.string().optional(),
  /** Tech stack tags */
  stack: z.array(z.string()).optional(),
  /** Title from the ### heading */
  title: z.string(),
  /** Raw markdown body (everything under ### heading until next ### or end) */
  body: z.string(),
});

export type IdeaItem = z.infer<typeof IdeaItemSchema>;

// --- Full file ---

/**
 * Complete parsed PROJECT_IDEAS.md file including frontmatter, ideas, and source path.
 */
export const IdeasFileSchema = IdeasFrontmatterSchema.extend({
  ideas: z.array(IdeaItemSchema),
  filePath: z.string(),
});

export type IdeasFile = z.infer<typeof IdeasFileSchema>;

// --- Validation wrappers (Result type pattern) ---

export function validateIdeasFrontmatter(
  input: unknown,
): Result<IdeasFrontmatter> {
  return validate(IdeasFrontmatterSchema, input);
}

export function validateIdeasFile(input: unknown): Result<IdeasFile> {
  return validate(IdeasFileSchema, input);
}
