import { z } from "zod";

/**
 * Schema for .cc-dash/portfolio.json — per-scan-dir project metadata.
 *
 * Lives at <scan_dir>/.cc-dash/portfolio.json and stores project ordering
 * and status groups. Projects not listed are treated as unranked active.
 */

export const ProjectStatus = z.enum(["active", "inactive", "maintenance"]);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

/** Position on the canvas-mode home view, in CSS pixels. */
export const CanvasPositionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

export type CanvasPosition = z.infer<typeof CanvasPositionSchema>;

export const ProjectEntrySchema = z.object({
  status: ProjectStatus.default("active"),
  /** Sort order within active projects. Lower = higher priority. */
  order: z.number().int().min(0).optional(),
  /** Position when rendered on the canvas-mode home view. */
  canvas: CanvasPositionSchema.optional(),
});

export type ProjectEntry = z.infer<typeof ProjectEntrySchema>;

export const PortfolioFileSchema = z.object({
  schema: z.literal("cc-dash/portfolio@1"),
  projects: z.record(z.string(), ProjectEntrySchema).default({}),
});

export type PortfolioFile = z.infer<typeof PortfolioFileSchema>;
