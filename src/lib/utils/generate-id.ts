/**
 * ID generation utilities for roadmap items and categories.
 *
 * - generateRoadmapId(): produces `r_` + 5 lowercase alphanumeric chars
 * - generateCategorySlug(): converts a title string to a URL-safe slug
 */

const CHARSET = "abcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generate a unique roadmap item ID.
 * Format: r_ + 5 lowercase alphanumeric characters.
 * Uses crypto.getRandomValues for secure randomness.
 */
export function generateRoadmapId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  const chars = Array.from(bytes, (b) => CHARSET[b % CHARSET.length]);
  return `r_${chars.join("")}`;
}

/**
 * Convert a category title to a URL-safe slug.
 * - Lowercases the string
 * - Replaces non-alphanumeric runs with hyphens
 * - Trims leading/trailing hyphens
 * - Returns "untitled" for empty/whitespace-only strings
 */
export function generateCategorySlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "untitled";
}
