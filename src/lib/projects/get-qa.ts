/**
 * Data loading function for the per-project QA page.
 *
 * Loads a project's QA.md file by URL slug, plus a flag indicating whether
 * the project has a ROADMAP.md (used by the UI to disable the Fail action
 * when a roadmap issue cannot be filed).
 */

import { readFile } from "node:fs/promises";
import { loadConfig } from "@/lib/config";
import { discoverProjects, parseQa } from "@/lib/fs";
import type { QaFile } from "@/lib/schemas/qa";

export interface QaPageData {
  qa: QaFile;
  projectName: string;
  /** True when the project has a ROADMAP.md, allowing failQaItem to file an issue. */
  hasRoadmap: boolean;
}

/**
 * Load QA data for a project identified by its URL slug.
 * Returns null when slug matches no project, project has no QA file,
 * or the QA file fails to parse.
 */
export async function getQaBySlug(slug: string): Promise<QaPageData | null> {
  const config = await loadConfig();
  const projects = await discoverProjects(config);
  const project = projects.find((p) => p.slug === slug);
  if (!project || !project.qaPath) return null;

  const raw = await readFile(project.qaPath, "utf-8");
  const result = parseQa(raw, project.qaPath);
  if (!result.success) return null;

  return {
    qa: result.data,
    projectName: project.name,
    hasRoadmap: project.roadmapPath !== null,
  };
}
