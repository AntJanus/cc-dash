/**
 * Data loading function for the roadmap page.
 *
 * Loads a project's roadmap data by URL slug (directory basename),
 * along with session reference lookups for linking board cards
 * to active sessions.
 */

import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { loadConfig } from "@/lib/config";
import { discoverProjects, parseRoadmap, parseSession } from "@/lib/fs";
import type { RoadmapFile } from "@/lib/schemas/roadmap";

/** View-model data for the roadmap page. */
export interface RoadmapPageData {
  roadmap: RoadmapFile;
  projectName: string;
  /** Maps roadmap item ID -> session page URL if a session references it */
  sessionRefs: Record<string, string>;
}

/**
 * Load roadmap data for a project identified by its URL slug.
 *
 * The slug is derived from `basename(project.path)` (the directory name),
 * NOT from the frontmatter `project` field. This matches the dashboard
 * home page's slug derivation in get-projects.ts.
 *
 * Returns null if: slug matches no project, project has no roadmap file,
 * or roadmap file fails to parse.
 */
export async function getRoadmapBySlug(
  slug: string,
): Promise<RoadmapPageData | null> {
  const config = await loadConfig();
  const projects = await discoverProjects(config);
  const project = projects.find((p) => basename(p.path) === slug);
  if (!project || !project.roadmapPath) return null;

  const raw = await readFile(project.roadmapPath, "utf-8");
  const result = parseRoadmap(raw, project.roadmapPath);
  if (!result.success) return null;

  // Build session reference lookup
  const sessionRefs: Record<string, string> = {};
  if (project.sessionPath) {
    try {
      const sessionRaw = await readFile(project.sessionPath, "utf-8");
      const sessionResult = parseSession(sessionRaw, project.sessionPath);
      if (sessionResult.success && sessionResult.data.roadmap_ref) {
        sessionRefs[sessionResult.data.roadmap_ref] =
          `/project/${slug}/session`;
      }
    } catch {
      // Session unreadable, degrade gracefully
    }
  }

  return {
    roadmap: result.data,
    projectName: project.name,
    sessionRefs,
  };
}
