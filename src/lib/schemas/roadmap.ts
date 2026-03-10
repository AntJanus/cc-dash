import { z } from "zod";
import { validate, type Result } from "./shared";

// --- ID and status patterns ---

const ROADMAP_ID_REGEX = /^r_[a-z0-9]{5}$/;

/**
 * Roadmap item statuses: idea -> planned -> in-progress -> done
 */
export const RoadmapStatus = z.enum(["planned", "in-progress", "done", "idea"]);

// --- Frontmatter schema ---

/**
 * YAML frontmatter for ROADMAP.md v2 files.
 * Schema literal ensures forward compatibility via version checks.
 */
export const RoadmapFrontmatterSchema = z.object({
  schema: z.literal("cc-dash/roadmap@1"),
  project: z.string(),
  description: z.string(),
  last_updated: z.string().datetime({ offset: true }),
});

export type RoadmapFrontmatter = z.infer<typeof RoadmapFrontmatterSchema>;

// --- Item metadata (parsed from HTML comments) ---

/**
 * Metadata extracted from HTML comments on roadmap list items.
 * Example: <!-- id:r_k8x2m status:planned started:2026-02-15 depends:r_abc12,r_def34 -->
 *
 * The depends field is a raw comma-separated string here;
 * the parser (Phase 2) splits it into an array for RoadmapItemSchema.
 */
export const RoadmapItemMetadataSchema = z.object({
  id: z.string().regex(ROADMAP_ID_REGEX, {
    error: "Roadmap item ID must match r_ + 5 lowercase alphanumeric chars",
  }),
  status: RoadmapStatus,
  started: z.string().date().optional(),
  completed: z.string().date().optional(),
  depends: z.string().optional(),
});

export type RoadmapItemMetadata = z.infer<typeof RoadmapItemMetadataSchema>;

// --- Full item (after parsing, with name/description from markdown) ---

/**
 * A complete roadmap item combining metadata and markdown content.
 * The depends field is an array of IDs (split by parser from comma-separated string).
 */
export const RoadmapItemSchema = z.object({
  id: z.string().regex(ROADMAP_ID_REGEX, {
    error: "Roadmap item ID must match r_ + 5 lowercase alphanumeric chars",
  }),
  status: RoadmapStatus,
  name: z.string(),
  description: z.string(),
  started: z.string().date().optional(),
  completed: z.string().date().optional(),
  depends: z.array(z.string()).optional(),
});

export type RoadmapItem = z.infer<typeof RoadmapItemSchema>;

// --- Category ---

/**
 * A roadmap category (## heading) with its items.
 * Example: ## Core Features <!-- category:core -->
 */
export const RoadmapCategorySchema = z.object({
  title: z.string(),
  slug: z.string(),
  items: z.array(RoadmapItemSchema),
});

export type RoadmapCategory = z.infer<typeof RoadmapCategorySchema>;

// --- Full file ---

/**
 * Complete parsed ROADMAP.md file including frontmatter, categories, and source path.
 */
export const RoadmapFileSchema = RoadmapFrontmatterSchema.extend({
  categories: z.array(RoadmapCategorySchema),
  filePath: z.string(),
});

export type RoadmapFile = z.infer<typeof RoadmapFileSchema>;

// --- Validation wrappers (Result type pattern) ---

export function validateRoadmapFrontmatter(
  input: unknown,
): Result<RoadmapFrontmatter> {
  return validate(RoadmapFrontmatterSchema, input);
}

export function validateRoadmapItem(input: unknown): Result<RoadmapItem> {
  return validate(RoadmapItemSchema, input);
}

export function validateRoadmapFile(input: unknown): Result<RoadmapFile> {
  return validate(RoadmapFileSchema, input);
}
