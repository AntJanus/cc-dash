import { basename } from "node:path";
import { readFile } from "node:fs/promises";
import { loadConfig } from "@/lib/config";
import { discoverProjects, parseSession } from "@/lib/fs";

export interface ProjectNavItem {
  slug: string;
  name: string;
  hasActiveSession: boolean;
}

/**
 * Get lightweight project list for sidebar navigation.
 * Uses discovery and checks session files for active status.
 */
export async function getProjectNav(): Promise<ProjectNavItem[]> {
  const config = await loadConfig();
  const discovered = await discoverProjects(config);

  const items = await Promise.all(
    discovered.map(async (p) => {
      let hasActiveSession = false;
      if (p.sessionPath) {
        try {
          const raw = await readFile(p.sessionPath, "utf-8");
          const result = parseSession(raw, p.sessionPath);
          if (result.success && result.data.status === "in-progress") {
            hasActiveSession = true;
          }
        } catch {
          /* degrade gracefully */
        }
      }
      return {
        slug: basename(p.path),
        name: p.name,
        hasActiveSession,
      };
    }),
  );

  return items.sort((a, b) => a.name.localeCompare(b.name));
}
