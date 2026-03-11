/**
 * Project data aggregation for the dashboard home page.
 *
 * Bridges the discovery engine and parser (Phases 2-3) to the UI layer.
 * Loads all project data in parallel, computes derived view-model objects
 * (progress, staleness, session status), and returns a sorted array of
 * ProjectCardData suitable for Server Component -> Client Component boundary.
 */

import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { loadConfig } from "@/lib/config";
import { discoverProjects, parseRoadmap, parseSession } from "@/lib/fs";
import type { RoadmapFile } from "@/lib/schemas/roadmap";
import type { SessionFile } from "@/lib/schemas/session";

/** 7 days in milliseconds */
const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

/** Derived data for a single project card on the dashboard home. */
export interface ProjectCardData {
  /** URL-safe identifier (directory basename) */
  slug: string;
  /** Display name from frontmatter or directory */
  name: string;
  /** Project description from roadmap frontmatter, or empty string */
  description: string;
  /** Absolute path to project directory */
  path: string;
  /** Roadmap progress: items with status "done" */
  doneCount: number;
  /** Roadmap progress: total items across all categories */
  totalCount: number;
  /** Whether a session exists with status "in-progress" */
  hasActiveSession: boolean;
  /** Session "Working on:" text, or null */
  sessionStatusText: string | null;
  /** Most recent last_updated across roadmap and session files (ISO string) */
  lastUpdated: string | null;
  /** True if lastUpdated is more than 7 days ago (or null) */
  isStale: boolean;
  /** Derived status for filtering */
  status: "active" | "stalled" | "complete" | "inactive";
}

/**
 * Extract "Working on:" text from a session's currentStatus string.
 * Handles plain and bold markdown formats. Returns null if not found.
 */
export function extractWorkingOn(currentStatus: string): string | null {
  // Match "Working on:" or "**Working on:**" with optional bold markers
  const match = currentStatus.match(/\*{0,2}Working on:\*{0,2}\s*(.+)/i);
  return match ? match[1].trim() : null;
}

/**
 * Derive project status from roadmap, session, and staleness.
 *
 * Priority: active session > all-done roadmap > stale check > inactive default.
 */
export function deriveStatus(
  roadmap: RoadmapFile | null,
  session: SessionFile | null,
  isStale: boolean,
): "active" | "stalled" | "complete" | "inactive" {
  // Active session always wins
  if (session?.status === "in-progress") return "active";

  // Check if all roadmap items are done
  if (roadmap) {
    const allItems = roadmap.categories.flatMap((c) => c.items);
    if (allItems.length > 0 && allItems.every((i) => i.status === "done")) {
      return "complete";
    }
  }

  // Stale projects with incomplete work are "stalled"
  if (isStale) return "stalled";

  return "inactive";
}

/**
 * Load all project data and compute derived view-model objects.
 *
 * 1. Loads config and discovers projects
 * 2. Reads and parses roadmap/session files in parallel
 * 3. Computes progress counts, staleness, session status
 * 4. Returns sorted array (most recently updated first, nulls last)
 */
export async function getProjectCards(): Promise<ProjectCardData[]> {
  const config = await loadConfig();
  const discovered = await discoverProjects(config);

  const cards = await Promise.allSettled(
    discovered.map(async (project) => {
      let roadmap: RoadmapFile | null = null;
      let session: SessionFile | null = null;

      // Read and parse roadmap file if it exists
      if (project.roadmapPath) {
        try {
          const raw = await readFile(project.roadmapPath, "utf-8");
          const result = parseRoadmap(raw, project.roadmapPath);
          if (result.success) roadmap = result.data;
        } catch {
          /* file unreadable, degrade gracefully */
        }
      }

      // Read and parse session file if it exists
      if (project.sessionPath) {
        try {
          const raw = await readFile(project.sessionPath, "utf-8");
          const result = parseSession(raw, project.sessionPath);
          if (result.success) session = result.data;
        } catch {
          /* file unreadable, degrade gracefully */
        }
      }

      // Compute progress counts from all roadmap items
      const allItems = roadmap?.categories.flatMap((c) => c.items) ?? [];
      const doneCount = allItems.filter((i) => i.status === "done").length;
      const totalCount = allItems.length;

      // Determine most recent timestamp across both files
      const timestamps = [roadmap?.last_updated, session?.last_updated].filter(
        Boolean,
      ) as string[];
      const lastUpdated =
        timestamps.length > 0 ? timestamps.sort().reverse()[0] : null;

      // Stale detection: no timestamp or older than 7 days
      const isStale = lastUpdated
        ? Date.now() - new Date(lastUpdated).getTime() > STALE_THRESHOLD_MS
        : true;

      return {
        slug: basename(project.path),
        name: project.name,
        description: roadmap?.description ?? "",
        path: project.path,
        doneCount,
        totalCount,
        hasActiveSession: session?.status === "in-progress",
        sessionStatusText:
          session?.status === "in-progress"
            ? extractWorkingOn(session.currentStatus)
            : null,
        lastUpdated,
        isStale,
        status: deriveStatus(roadmap, session, isStale),
      } satisfies ProjectCardData;
    }),
  );

  // Filter out rejected promises (catastrophic errors) and sort
  return cards
    .filter(
      (r): r is PromiseFulfilledResult<ProjectCardData> =>
        r.status === "fulfilled",
    )
    .map((r) => r.value)
    .sort((a, b) => {
      if (!a.lastUpdated && !b.lastUpdated) return 0;
      if (!a.lastUpdated) return 1;
      if (!b.lastUpdated) return -1;
      return (
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      );
    });
}
