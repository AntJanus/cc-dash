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
  port: z.number().int().default(3737),

  /** Absolute or ~-relative path to PROJECT_IDEAS.md file */
  ideas_file: z.string().optional(),

  /**
   * Portfolio-level directory the orchestrator agent runs from, and where
   * TODAYS_DIRECTIONS.md is written. Sits above the individual projects.
   */
  orchestrator_dir: z.string().default("~/projects"),

  /** Project slugs that have been archived (hidden from dashboard) */
  archived_projects: z.array(z.string()).default([]),

  /** Display preferences for the dashboard UI */
  display: z
    .object({
      /** Default view mode for roadmap pages */
      default_view: z.enum(["board", "list"]).default("board"),
      /** Default sort order for project lists */
      sort_order: z
        .enum(["last_updated", "name", "status"])
        .default("last_updated"),
      /** Color theme */
      theme: z.enum(["light", "dark", "system"]).default("light"),
    })
    .default({
      default_view: "board",
      sort_order: "last_updated",
      theme: "light",
    }),
});

/** Typed config object inferred from the schema. */
export type Config = z.infer<typeof ConfigSchema>;
