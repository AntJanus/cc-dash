"use server";

/**
 * Server action for cross-project search.
 *
 * Discovers all projects, parses roadmaps + sessions + ideas, and performs
 * case-insensitive text search across item names, descriptions, and task text.
 */

import { readFile } from "node:fs/promises";
import { loadConfig } from "@/lib/config";
import { discoverProjects, parseRoadmap, parseSession } from "@/lib/fs";
import { expandTilde } from "@/lib/fs/discovery";
import { parseIdeas } from "@/lib/fs";

// --- Types ---

export type SearchResultType = "roadmap" | "session" | "idea";

export type RoadmapItemStatus = "planned" | "in-progress" | "done" | "idea";
export type SessionTaskStatus = "pending" | "done";
export type IdeaStatus = "not-started" | "started" | "complete";

export type SearchResultStatus =
  | RoadmapItemStatus
  | SessionTaskStatus
  | IdeaStatus;

/** A single search result across any project and content type. */
export interface SearchResult {
  /** Project slug for URL construction */
  projectSlug: string;
  /** Human-readable project name */
  projectName: string;
  /** Unique item ID (r_, t_, i_ prefixed) */
  itemId: string;
  /** Primary text of the item (roadmap item name, task description, idea title) */
  title: string;
  /** Secondary text (roadmap description, session task context, idea body excerpt) */
  description: string;
  /** Status value for the badge */
  status: SearchResultStatus;
  /** Content type — used for grouping in the UI */
  type: SearchResultType;
  /** URL to the item's source page */
  link: string;
}

/** Grouped search results returned from searchAllProjects. */
export interface SearchResults {
  roadmapItems: SearchResult[];
  sessionTasks: SearchResult[];
  ideas: SearchResult[];
}

// --- Implementation ---

/**
 * Case-insensitive check: does the query appear in any of the given strings?
 */
function matches(query: string, ...fields: string[]): boolean {
  const lower = query.toLowerCase();
  return fields.some((f) => f.toLowerCase().includes(lower));
}

/**
 * Search across all projects' roadmap items, session tasks, and ideas.
 *
 * Returns grouped results. An empty query returns empty results (no-op).
 * Each project is processed in parallel; errors are silently ignored so
 * a single unreadable file does not break the entire search.
 */
export async function searchAllProjects(query: string): Promise<SearchResults> {
  const trimmed = query.trim();

  const empty: SearchResults = {
    roadmapItems: [],
    sessionTasks: [],
    ideas: [],
  };

  if (!trimmed) return empty;

  const config = await loadConfig();
  const discovered = await discoverProjects(config);

  const roadmapItems: SearchResult[] = [];
  const sessionTasks: SearchResult[] = [];
  const ideaResults: SearchResult[] = [];

  await Promise.allSettled(
    discovered.map(async (project) => {
      const { slug, name } = project;

      // --- Roadmap items ---
      if (project.roadmapPath) {
        try {
          const raw = await readFile(project.roadmapPath, "utf-8");
          const result = parseRoadmap(raw, project.roadmapPath);
          if (result.success) {
            for (const category of result.data.categories) {
              for (const item of category.items) {
                if (matches(trimmed, item.name, item.description)) {
                  roadmapItems.push({
                    projectSlug: slug,
                    projectName: name,
                    itemId: item.id,
                    title: item.name,
                    description: item.description,
                    status: item.status as RoadmapItemStatus,
                    type: "roadmap",
                    link: `/project/${slug}/roadmap`,
                  });
                }
              }
            }
          }
        } catch {
          // skip unreadable roadmap
        }
      }

      // --- Session tasks ---
      if (project.sessionPath) {
        try {
          const raw = await readFile(project.sessionPath, "utf-8");
          const result = parseSession(raw, project.sessionPath);
          if (result.success) {
            for (const task of result.data.tasks) {
              if (matches(trimmed, task.description)) {
                sessionTasks.push({
                  projectSlug: slug,
                  projectName: name,
                  itemId: task.id,
                  title: task.description,
                  description: result.data.session_id,
                  status: task.checked ? "done" : "pending",
                  type: "session",
                  link: `/project/${slug}/session`,
                });
              }
            }
          }
        } catch {
          // skip unreadable session
        }
      }
    }),
  );

  // --- Ideas (single portfolio-level file) ---
  if (config.ideas_file) {
    try {
      const filePath = expandTilde(config.ideas_file);
      const raw = await readFile(filePath, "utf-8");
      const result = parseIdeas(raw, filePath);
      if (result.success) {
        for (const idea of result.data.ideas) {
          if (matches(trimmed, idea.title, idea.body)) {
            ideaResults.push({
              projectSlug: "ideas",
              projectName: "Project Ideas",
              itemId: idea.id,
              title: idea.title,
              description: idea.body.slice(0, 200),
              status: idea.status as IdeaStatus,
              type: "idea",
              link: `/ideas`,
            });
          }
        }
      }
    } catch {
      // no ideas file configured or unreadable
    }
  }

  return {
    roadmapItems,
    sessionTasks,
    ideas: ideaResults,
  };
}
