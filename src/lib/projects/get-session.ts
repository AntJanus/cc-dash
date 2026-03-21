/**
 * Data loading function for the session page.
 *
 * Loads a project's session data by URL slug (directory basename),
 * along with verification sections and task name lookups for
 * rendering the session progress view.
 */

import { readFile } from "node:fs/promises";
import { loadConfig } from "@/lib/config";
import { discoverProjects, parseSession } from "@/lib/fs";
import type { SessionFile } from "@/lib/schemas/session";
import type { SessionParseResult, UnknownSection } from "@/lib/fs";

/** View-model data for the session page. */
export interface SessionPageData {
  session: SessionFile;
  /** Verification Results sections (from parser unknownSections) */
  verificationSections: UnknownSection[];
  /** Preserved parse result for write-back (status toggle) */
  preserved: SessionParseResult;
  /** Display name of the project */
  projectName: string;
  /** Absolute path to the session file (for server action use) */
  sessionFilePath: string;
}

/**
 * Load session data for a project identified by its URL slug.
 *
 * The slug is derived from the project name (via slugify) and set during
 * discovery. This matches the dashboard home page's slug in get-projects.ts.
 *
 * Returns null if: slug matches no project, project has no session file,
 * or session file fails to parse.
 */
export async function getSessionBySlug(
  slug: string,
): Promise<SessionPageData | null> {
  const config = await loadConfig();
  const projects = await discoverProjects(config);
  const project = projects.find((p) => p.slug === slug);
  if (!project || !project.sessionPath) return null;

  const raw = await readFile(project.sessionPath, "utf-8");
  const result = parseSession(raw, project.sessionPath);
  if (!result.success) return null;

  // Extract verification sections from unknown sections
  const verificationSections = result.preserved.unknownSections.filter(
    (s) => s.heading === "Verification Results",
  );

  return {
    session: result.data,
    verificationSections,
    preserved: result.preserved,
    projectName: project.name,
    sessionFilePath: project.sessionPath,
  };
}
