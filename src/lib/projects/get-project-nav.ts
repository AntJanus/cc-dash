import { basename } from "node:path";
import { loadConfig } from "@/lib/config";
import { discoverProjects } from "@/lib/fs";

export interface ProjectNavItem {
  slug: string;
  name: string;
}

/**
 * Get lightweight project list for sidebar navigation.
 * Uses discovery but only extracts slug + name (no parsing).
 */
export async function getProjectNav(): Promise<ProjectNavItem[]> {
  const config = await loadConfig();
  const discovered = await discoverProjects(config);

  return discovered
    .map((p) => ({
      slug: basename(p.path),
      name: p.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
