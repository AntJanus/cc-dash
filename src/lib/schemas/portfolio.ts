import { z } from "zod";

/**
 * True when `value` is a real YYYY-MM-DD date. Guards against well-formed but
 * impossible dates (e.g. 2026-02-30) that `Date.parse` silently rolls over.
 */
function isRealCalendarDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Schema for .cc-dash/portfolio.json — per-scan-dir project metadata.
 *
 * Lives at <scan_dir>/.cc-dash/portfolio.json and stores project ordering
 * and status groups. Projects not listed are treated as unranked active.
 */

export const ProjectStatus = z.enum(["active", "inactive", "maintenance"]);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

/** How often a project is meant to come round again. Drives almanac cadence. */
export const ProjectCadence = z.enum(["weekly", "monthly", "quarterly"]);
export type ProjectCadence = z.infer<typeof ProjectCadence>;

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
  /**
   * Intended working rhythm. `null` when unset — the almanac then infers
   * cadence from activity instead of an explicit declaration.
   */
  cadence: ProjectCadence.nullable().default(null),
  /**
   * Deliberate dormancy until this calendar date (YYYY-MM-DD). While in the
   * future it suppresses the stale badge and drives a "Returns in X days"
   * label. `null` when the project has no scheduled return.
   */
  dormant_until: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      error: "dormant_until must be a YYYY-MM-DD calendar date",
    })
    .refine(isRealCalendarDate, {
      error: "dormant_until must be a real calendar date",
    })
    .nullable()
    .default(null),
});

export type ProjectEntry = z.infer<typeof ProjectEntrySchema>;

export const PortfolioFileSchema = z.object({
  schema: z.literal("cc-dash/portfolio@1"),
  projects: z.record(z.string(), ProjectEntrySchema).default({}),
});

export type PortfolioFile = z.infer<typeof PortfolioFileSchema>;
