/**
 * Pure prompt assembly functions for generating Claude Code prompts.
 *
 * No I/O -- all functions take parsed data and return strings.
 * Server actions in prompt-actions.ts handle file reading and discovery.
 */

import type { RoadmapFile, RoadmapItem } from "@/lib/schemas/roadmap";
import type { SessionFile } from "@/lib/schemas/session";

/** Input shape for pickBestProject (subset of ProjectCardData). */
export interface ProjectCandidate {
  slug: string;
  path: string;
  name: string;
  hasActiveSession: boolean;
  lastUpdated: string | null;
  isStale: boolean;
  status: "active" | "stalled" | "complete" | "inactive";
}

/**
 * Assemble a lean plain-text prompt for a single project.
 *
 * Format: cd command, project name, roadmap progress, session status,
 * workflow suggestion. Plain text -- no markdown.
 */
export function assembleProjectPrompt(
  projectPath: string,
  projectName: string,
  roadmap: RoadmapFile | null,
  session: SessionFile | null,
): string {
  const lines: string[] = [];

  // Line 1: pasteable cd command
  lines.push(`cd ${projectPath}`);
  lines.push("");

  // Project name
  lines.push(`Project: ${projectName}`);

  // Roadmap section (if available)
  if (roadmap) {
    const allItems = roadmap.categories.flatMap((c) => c.items);
    const doneCount = allItems.filter((i) => i.status === "done").length;
    const totalCount = allItems.length;
    lines.push(`Roadmap: ${doneCount}/${totalCount} items done`);

    // Find next actionable item (in-progress first, then planned)
    const nextItem = findNextItem(allItems);
    if (nextItem) {
      lines.push(`Next item: ${nextItem.name} (${nextItem.status})`);
    }
  }

  // Session section (if available)
  if (session) {
    lines.push(`Session: ${session.session_id} (${session.status})`);
    if (session.currentStatus) {
      lines.push(session.currentStatus);
    }
    lines.push(
      "Read SESSION_PROGRESS.md for decisions, failed attempts, and task list",
    );
  }

  // Workflow suggestion
  const suggestion = detectWorkflowSuggestion(session, roadmap);
  lines.push(`Suggested: ${suggestion}`);

  return lines.join("\n");
}

/**
 * Find the next actionable roadmap item.
 * Prioritizes in-progress over planned.
 */
function findNextItem(items: RoadmapItem[]): RoadmapItem | null {
  const inProgress = items.find((i) => i.status === "in-progress");
  if (inProgress) return inProgress;

  const planned = items.find((i) => i.status === "planned");
  if (planned) return planned;

  return null;
}

/**
 * Detect the best workflow suggestion based on session and roadmap state.
 *
 * Priority: in-progress session > planned roadmap items > fallback plan.
 */
export function detectWorkflowSuggestion(
  session: SessionFile | null,
  roadmap: RoadmapFile | null,
): string {
  // Active session takes priority
  if (session?.status === "in-progress") {
    return "Resume current session -- check SESSION_PROGRESS.md for where you left off";
  }

  // Check if roadmap has actionable items
  if (roadmap) {
    const allItems = roadmap.categories.flatMap((c) => c.items);
    const hasActionable = allItems.some(
      (i) => i.status === "planned" || i.status === "in-progress",
    );
    if (hasActionable) {
      return "Execute next planned roadmap item";
    }
  }

  // Fallback
  return "Plan next steps -- review ROADMAP.md and decide priorities";
}

/**
 * Pick the single best project to work on from a list of candidates.
 *
 * Ranking: active sessions > recently active > stalled.
 * Returns null if no candidates remain after filtering complete projects.
 */
export function pickBestProject(
  projects: ProjectCandidate[],
): ProjectCandidate | null {
  // Filter out complete projects
  const candidates = projects.filter((p) => p.status !== "complete");
  if (candidates.length === 0) return null;

  // Sort helper: by lastUpdated descending (nulls last)
  const byLastUpdated = (a: ProjectCandidate, b: ProjectCandidate): number => {
    if (!a.lastUpdated && !b.lastUpdated) return 0;
    if (!a.lastUpdated) return 1;
    if (!b.lastUpdated) return -1;
    return (
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
  };

  // Tier 1: projects with active sessions
  const withSession = candidates
    .filter((p) => p.hasActiveSession)
    .sort(byLastUpdated);
  if (withSession.length > 0) return withSession[0];

  // Tier 2: recently active (not stale, has lastUpdated)
  const recent = candidates
    .filter((p) => !p.isStale && p.lastUpdated)
    .sort(byLastUpdated);
  if (recent.length > 0) return recent[0];

  // Tier 3: stalled
  const stalled = candidates.filter((p) => p.isStale).sort(byLastUpdated);
  if (stalled.length > 0) return stalled[0];

  // Fallback: first candidate
  return candidates[0];
}
