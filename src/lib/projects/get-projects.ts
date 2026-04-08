/**
 * Project data aggregation for the dashboard home page.
 *
 * Bridges the discovery engine and parser (Phases 2-3) to the UI layer.
 * Loads all project data in parallel, computes derived view-model objects
 * (progress, staleness, session status), and returns a sorted array of
 * ProjectCardData suitable for Server Component -> Client Component boundary.
 */

import { readFile, stat } from "node:fs/promises";
import matter from "gray-matter";
import { loadConfig } from "@/lib/config";
import { discoverProjects, parseRoadmap, parseSession } from "@/lib/fs";
import { loadAllPortfolios } from "@/lib/fs/portfolio";
import { expandTilde } from "@/lib/fs/discovery";
import type { RoadmapFile } from "@/lib/schemas/roadmap";
import type { SessionFile } from "@/lib/schemas/session";
import type { ProjectStatus } from "@/lib/schemas/portfolio";

/** 7 days in milliseconds */
const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

/** Session metadata used by deriveStatus to determine project status. */
export interface SessionMeta {
  /** Parsed session status, or null if no session / parse failed */
  status: "in-progress" | "paused" | "completed" | "blocked" | null;
  /** Whether the session has at least one unchecked task */
  hasUncheckedTasks: boolean;
  /** Whether a session file exists on disk */
  exists: boolean;
  /** Whether the session file mtime is older than 7 days */
  isSessionStale: boolean;
}

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
  /** Portfolio status from .cc-dash/portfolio.json */
  portfolioStatus: ProjectStatus;
  /** Portfolio priority order (lower = higher priority) */
  portfolioOrder: number | undefined;
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
 * Derive project status from roadmap and session metadata.
 *
 * Priority: active > complete > stalled > inactive.
 *
 * - **active**: session in-progress OR session has unchecked tasks
 * - **complete**: all roadmap items done
 * - **stalled**: session exists AND (paused/blocked OR session file stale)
 * - **inactive**: default fallback
 */
export function deriveStatus(
  roadmap: RoadmapFile | null,
  sessionMeta: SessionMeta,
): "active" | "stalled" | "complete" | "inactive" {
  // Active: session in-progress or has unchecked tasks
  if (sessionMeta.status === "in-progress" || sessionMeta.hasUncheckedTasks)
    return "active";

  // Check if all roadmap items are done
  if (roadmap) {
    const allItems = roadmap.categories.flatMap((c) => c.items);
    if (allItems.length > 0 && allItems.every((i) => i.status === "done")) {
      return "complete";
    }
  }

  // Stalled: session file exists AND (paused/blocked/stale)
  if (
    sessionMeta.exists &&
    (sessionMeta.status === "paused" ||
      sessionMeta.status === "blocked" ||
      sessionMeta.isSessionStale)
  )
    return "stalled";

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
  const resolvedDirs = config.scan_dirs.map((d) => expandTilde(d));
  const allMeta = await loadAllPortfolios(resolvedDirs);

  const cards = await Promise.allSettled(
    discovered.map(async (project) => {
      let roadmap: RoadmapFile | null = null;
      let session: SessionFile | null = null;
      let sessionRaw: string | null = null;

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
          sessionRaw = await readFile(project.sessionPath, "utf-8");
          const result = parseSession(sessionRaw, project.sessionPath);
          if (result.success) session = result.data;
        } catch {
          /* file unreadable, degrade gracefully */
        }
      }

      // Fallback: when full parse fails, extract session status from frontmatter
      let fallbackSessionStatus: string | null = null;
      if (!session && sessionRaw) {
        try {
          const { data } = matter(sessionRaw);
          if (data?.status) fallbackSessionStatus = data.status;
        } catch {
          /* ignore */
        }
      }

      // Collect file mtimes — always check, not just on parse failure.
      // Frontmatter last_updated may be stale (set weeks ago) while the
      // actual file was modified recently.
      const fileMtimes: string[] = [];
      let sessionMtime: Date | null = null;
      if (project.roadmapPath) {
        try {
          const s = await stat(project.roadmapPath);
          fileMtimes.push(s.mtime.toISOString());
        } catch {
          /* ignore */
        }
      }
      if (project.sessionPath) {
        try {
          const s = await stat(project.sessionPath);
          fileMtimes.push(s.mtime.toISOString());
          sessionMtime = s.mtime;
        } catch {
          /* ignore */
        }
      }

      // Compute progress counts from all roadmap items
      const allItems = roadmap?.categories.flatMap((c) => c.items) ?? [];
      const doneCount = allItems.filter((i) => i.status === "done").length;
      const totalCount = allItems.length;

      // Determine most recent timestamp: use MAX of parsed last_updated and file mtime
      const timestamps = [
        roadmap?.last_updated,
        session?.last_updated,
        ...fileMtimes,
      ].filter(Boolean) as string[];
      const lastUpdated =
        timestamps.length > 0 ? timestamps.sort().reverse()[0] : null;

      // Stale detection: no timestamp or older than 7 days
      const isStale = lastUpdated
        ? Date.now() - new Date(lastUpdated).getTime() > STALE_THRESHOLD_MS
        : true;

      // Build SessionMeta for deriveStatus
      const effectiveStatus =
        (session?.status as SessionMeta["status"]) ??
        (fallbackSessionStatus as SessionMeta["status"]) ??
        null;
      const hasUncheckedTasks = session?.tasks.some((t) => !t.checked) ?? false;
      const isSessionStale = sessionMtime
        ? Date.now() - sessionMtime.getTime() > STALE_THRESHOLD_MS
        : false;
      const sessionMeta: SessionMeta = {
        status: effectiveStatus,
        hasUncheckedTasks,
        exists: !!project.sessionPath,
        isSessionStale,
      };

      const hasActiveSession =
        sessionMeta.status === "in-progress" || sessionMeta.hasUncheckedTasks;

      const meta = allMeta.get(project.slug);

      return {
        slug: project.slug,
        name: project.name,
        description: roadmap?.description ?? "",
        path: project.path,
        doneCount,
        totalCount,
        hasActiveSession,
        sessionStatusText:
          session?.status === "in-progress"
            ? extractWorkingOn(session.currentStatus)
            : null,
        lastUpdated,
        isStale,
        status: deriveStatus(roadmap, sessionMeta),
        portfolioStatus: (meta?.status as ProjectStatus) ?? "active",
        portfolioOrder: meta?.order,
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
