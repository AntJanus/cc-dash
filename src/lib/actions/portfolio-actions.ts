"use server";

/**
 * Server actions for portfolio management.
 *
 * Updates .cc-dash/portfolio.json files in scan directories
 * to manage project ordering and status groups.
 */

import { revalidatePath } from "next/cache";
import { loadConfig } from "@/lib/config";
import { discoverProjects } from "@/lib/fs";
import { expandTilde } from "@/lib/fs/discovery";
import { loadPortfolio, savePortfolio } from "@/lib/fs/portfolio";
import { CanvasPositionSchema, ProjectStatus } from "@/lib/schemas/portfolio";

/** Find which scan dir a project path belongs to. */
function findScanDir(projectPath: string, scanDirs: string[]): string | null {
  for (const dir of scanDirs) {
    if (
      projectPath.startsWith(dir + "/") ||
      projectPath.startsWith(dir + "\\")
    ) {
      return dir;
    }
  }
  return null;
}

/**
 * Set a project's portfolio status (active, inactive, maintenance).
 */
export async function setProjectStatus(
  slug: string,
  status: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = ProjectStatus.safeParse(status);
  if (!parsed.success) {
    return { success: false, error: "Invalid status" };
  }

  const config = await loadConfig();
  const projects = await discoverProjects(config, { includeArchived: true });
  const project = projects.find((p) => p.slug === slug);
  if (!project) {
    return { success: false, error: "Project not found" };
  }

  const resolvedDirs = config.scan_dirs.map((d) => expandTilde(d));
  const scanDir = findScanDir(project.path, resolvedDirs);
  if (!scanDir) {
    return { success: false, error: "Could not determine scan directory" };
  }

  const portfolio = await loadPortfolio(scanDir);
  if (!portfolio.projects[slug]) {
    portfolio.projects[slug] = {
      status: parsed.data,
      cadence: null,
      dormant_until: null,
    };
  } else {
    portfolio.projects[slug].status = parsed.data;
  }
  await savePortfolio(scanDir, portfolio);

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Set a project's saved canvas position (x, y) for the home canvas view.
 * Pass null to clear the saved position.
 */
export async function setProjectCanvasPosition(
  slug: string,
  position: { x: number; y: number } | null,
): Promise<{ success: true } | { success: false; error: string }> {
  if (position !== null) {
    const parsed = CanvasPositionSchema.safeParse(position);
    if (!parsed.success) {
      return { success: false, error: "Invalid canvas position" };
    }
  }

  const config = await loadConfig();
  const projects = await discoverProjects(config, { includeArchived: true });
  const project = projects.find((p) => p.slug === slug);
  if (!project) {
    return { success: false, error: "Project not found" };
  }

  const resolvedDirs = config.scan_dirs.map((d) => expandTilde(d));
  const scanDir = findScanDir(project.path, resolvedDirs);
  if (!scanDir) {
    return { success: false, error: "Could not determine scan directory" };
  }

  const portfolio = await loadPortfolio(scanDir);
  if (!portfolio.projects[slug]) {
    portfolio.projects[slug] = {
      status: "active",
      cadence: null,
      dormant_until: null,
    };
  }
  if (position === null) {
    delete portfolio.projects[slug].canvas;
  } else {
    portfolio.projects[slug].canvas = {
      x: Math.round(position.x),
      y: Math.round(position.y),
    };
  }
  await savePortfolio(scanDir, portfolio);

  // Don't revalidate the layout — canvas position is a client-side concern,
  // saved in the background while the user keeps dragging. Revalidating
  // would force a full re-render and snap the card mid-drag.
  return { success: true };
}
