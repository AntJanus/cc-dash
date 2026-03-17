/**
 * Data loading function for the ideas page.
 *
 * Loads project ideas from the configured ideas_file path.
 * Unlike roadmap/session which use per-project discovery,
 * ideas use a single portfolio-level file path from config.
 */

import { readFile } from "node:fs/promises";
import { loadConfig } from "@/lib/config";
import { expandTilde } from "@/lib/fs/discovery";
import { parseIdeas } from "@/lib/fs";
import type { IdeasFile } from "@/lib/schemas/ideas";
import type { IdeasParseResult } from "@/lib/fs/types";

/** Data returned by getIdeasData for page rendering and CRUD operations. */
export interface IdeasData {
  data: IdeasFile;
  preserved: IdeasParseResult;
}

/**
 * Load ideas data from the configured ideas_file path.
 *
 * Returns null if: ideas_file not configured, file does not exist,
 * or file fails to parse.
 */
export async function getIdeasData(): Promise<IdeasData | null> {
  const config = await loadConfig();
  if (!config.ideas_file) return null;

  const filePath = expandTilde(config.ideas_file);
  try {
    const raw = await readFile(filePath, "utf-8");
    const result = parseIdeas(raw, filePath);
    if (!result.success) return null;
    return { data: result.data, preserved: result.preserved };
  } catch {
    return null;
  }
}
