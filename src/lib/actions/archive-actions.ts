"use server";

import { revalidatePath } from "next/cache";
import { loadConfig } from "@/lib/config";
import { saveConfig } from "@/lib/actions/settings-actions";
import { discoverProjects } from "@/lib/fs";

/** A minimal project record for the archived projects list. */
export interface ArchivedProjectInfo {
  slug: string;
  name: string;
  path: string;
}

/**
 * Archive a project by adding its slug to config.archived_projects.
 * The project is hidden from the dashboard, sidebar, and search results.
 * Does not modify any project files.
 */
export async function archiveProject(
  slug: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const config = await loadConfig();
  const archived = new Set(config.archived_projects ?? []);
  archived.add(slug);
  const result = await saveConfig({ archived_projects: [...archived] });
  if (result.success) {
    revalidatePath("/", "layout");
  }
  return result;
}

/**
 * Unarchive a project by removing its slug from config.archived_projects.
 * The project is restored to the dashboard.
 */
export async function unarchiveProject(
  slug: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const config = await loadConfig();
  const archived = new Set(config.archived_projects ?? []);
  archived.delete(slug);
  const result = await saveConfig({ archived_projects: [...archived] });
  if (result.success) {
    revalidatePath("/", "layout");
  }
  return result;
}

/**
 * Get full project info for all archived projects (for the settings page).
 * Discovers all projects (including archived) and returns only the archived ones.
 */
export async function getArchivedProjects(): Promise<ArchivedProjectInfo[]> {
  const config = await loadConfig();
  const archivedSlugs = new Set(config.archived_projects ?? []);

  if (archivedSlugs.size === 0) return [];

  // Discover all projects including archived ones
  const allProjects = await discoverProjects(config, { includeArchived: true });

  return allProjects
    .filter((p) => archivedSlugs.has(p.slug))
    .map((p) => ({ slug: p.slug, name: p.name, path: p.path }));
}
