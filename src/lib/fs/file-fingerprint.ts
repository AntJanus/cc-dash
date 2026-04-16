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

/**
 * Compute a SHA-256 fingerprint from file mtimes of all discovered
 * ROADMAP.md and SESSION_PROGRESS.md files.
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

  // Sort for deterministic hashing
  mtimes.sort();
  const hash = createHash("sha256").update(mtimes.join("\n")).digest("hex");
  return hash.slice(0, 16);
}
