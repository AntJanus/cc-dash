"use server";

/**
 * Server action for toggling session status.
 *
 * Accepts a project slug (not raw filePath) and resolves the session
 * file path through discovery for safety (Pitfall 3 from research).
 * Validates the new status against the SessionStatus enum, reads the
 * current file to preserve round-trip content, updates the status
 * field, and writes atomically via writeSessionFile.
 */

import { readFile } from "node:fs/promises";
import { loadConfig } from "@/lib/config";
import { discoverProjects, parseSession, writeSessionFile } from "@/lib/fs";
import { SessionStatus } from "@/lib/schemas/session";
import type { Result } from "@/lib/schemas/shared";
import { revalidateProjectPaths } from "@/lib/actions/revalidate-helpers";

/**
 * Update the status of a project's session file.
 *
 * @param slug - Project slug (directory basename) for safe path resolution
 * @param newStatus - New status value (must be a valid SessionStatus)
 * @returns Result<void> with success or validation/file errors
 */
export async function updateSessionStatus(
  slug: string,
  newStatus: string,
): Promise<Result<void>> {
  // Validate the status value first (fast-fail before any I/O)
  const parsed = SessionStatus.safeParse(newStatus);
  if (!parsed.success) {
    return {
      success: false,
      errors: [
        { field: "status", message: "Invalid status", received: newStatus },
      ],
    };
  }

  // Resolve session file path through discovery (safe path resolution)
  const config = await loadConfig();
  const projects = await discoverProjects(config);
  const project = projects.find((p) => p.slug === slug);
  if (!project || !project.sessionPath) {
    return {
      success: false,
      errors: [
        {
          field: "slug",
          message: "Project not found or has no session file",
          received: slug,
        },
      ],
    };
  }

  // Read current file to get preserved content for round-trip
  const raw = await readFile(project.sessionPath, "utf-8");
  const result = parseSession(raw, project.sessionPath);
  if (!result.success) return result;

  // Update status
  const updated = { ...result.data, status: parsed.data };

  // Write atomically with preserved content
  const writeResult = await writeSessionFile(
    project.sessionPath,
    updated,
    result.preserved,
  );
  if (writeResult.success) {
    revalidateProjectPaths(slug, "session");
  }
  return writeResult;
}
