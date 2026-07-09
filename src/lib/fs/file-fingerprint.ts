/**
 * Compute a fingerprint of markdown file modification times across all projects.
 *
 * Used by the auto-refresh API to detect when files have changed on disk.
 * Returns a hash string that changes whenever any tracked file is modified.
 */

import { createHash } from "node:crypto";
import { stat } from "node:fs/promises";
import { loadConfig } from "@/lib/config";
import { discoverProjects } from "@/lib/fs";
import { expandTilde } from "@/lib/fs/discovery";
import { resolveTodayDirectionsPath } from "@/lib/projects/get-today-directions";

/**
 * Compute a SHA-256 fingerprint from file mtimes of all discovered
 * ROADMAP.md and SESSION_PROGRESS.md files, plus the portfolio-level
 * TODAYS_DIRECTIONS.md (so /today auto-refreshes when the agent
 * writes the file).
 */
export async function computeFileFingerprint(): Promise<string> {
  const config = await loadConfig();
  const discovered = await discoverProjects(config);

  const mtimes: string[] = [];

  await Promise.allSettled(
    discovered.flatMap((project) => {
      const paths = [project.roadmapPath, project.sessionPath].filter(
        Boolean,
      ) as string[];
      return paths.map(async (filePath) => {
        try {
          const s = await stat(filePath);
          mtimes.push(`${filePath}:${s.mtimeMs}`);
        } catch {
          // file missing — skip
        }
      });
    }),
  );

  // Stat the portfolio-level directions file too. Resolved against the
  // user's home so the fingerprint changes when the orchestrator agent
  // writes a new TODAYS_DIRECTIONS.md.
  const directionsPath = expandTilde(await resolveTodayDirectionsPath());
  try {
    const s = await stat(directionsPath);
    mtimes.push(`${directionsPath}:${s.mtimeMs}`);
  } catch {
    // file missing — skip; absence is itself a stable state
  }

  // Sort for deterministic hashing
  mtimes.sort();
  const hash = createHash("sha256").update(mtimes.join("\n")).digest("hex");
  return hash.slice(0, 16);
}
