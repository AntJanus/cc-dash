import { z } from "zod";

/**
 * Schema for ~/.config/cc-dash/config.json.
 * All fields have sensible defaults so an empty {} is valid.
 */
export const ConfigSchema = z.object({
  /** Directories to scan for projects containing ROADMAP.md / SESSION_PROGRESS.md */
  scan_dirs: z.array(z.string()).default([]),

  /** Directories to skip during scanning */
  exclude_dirs: z.array(z.string()).default(["node_modules", ".git", "vendor"]),

  /** Explicitly registered projects (bypass discovery) */
  explicit_projects: z
    .array(
      z.object({
        path: z.string(),
        name: z.string(),
      }),
    )
    .default([]),

  /** Maximum directory depth when scanning for project files */
  scan_depth: z.number().int().min(1).max(10).default(2),

  /** Port for the dashboard dev server */
  port: z.number().int().default(3000),
});

/** Typed config object inferred from the schema. */
export type Config = z.infer<typeof ConfigSchema>;
