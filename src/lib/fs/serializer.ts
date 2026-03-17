/**
 * Markdown serializer for ROADMAP.md, SESSION_PROGRESS.md, and PROJECT_IDEAS.md files.
 *
 * Converts structured TypeScript data back into valid v2 markdown.
 * Preserves unrecognized content (custom sections, preamble, trailing content)
 * for round-trip fidelity: parse(serialize(parse(file))) === parse(file).
 */

import matter from "gray-matter";
import yaml from "js-yaml";
import type { RoadmapFile, RoadmapItem } from "@/lib/schemas/roadmap";
import type { SessionFile } from "@/lib/schemas/session";
import type { IdeasFile, IdeaItem } from "@/lib/schemas/ideas";
import type {
  RoadmapParseResult,
  SessionParseResult,
  IdeasParseResult,
} from "./types";

// --- Shared helpers ---

/**
 * Use gray-matter stringify with lineWidth: -1 to prevent YAML line wrapping.
 * This ensures long descriptions and URLs are not broken across lines.
 */
function stringifyWithFrontmatter(
  body: string,
  data: Record<string, unknown>,
): string {
  return matter.stringify(body, data, {
    engines: {
      yaml: {
        parse: (str: string) => yaml.load(str) as Record<string, unknown>,
        stringify: (obj: Record<string, unknown>) =>
          yaml.dump(obj, { lineWidth: -1 }),
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

// --- Roadmap serialization ---

/**
 * Serialize a single roadmap item into a markdown list line.
 * Produces the HTML comment metadata and optional strikethrough/completed suffix.
 */
function serializeRoadmapItem(item: RoadmapItem): string {
  // Build metadata comment parts in canonical order
  const parts: string[] = [`id:${item.id}`, `status:${item.status}`];
  if (item.started) parts.push(`started:${item.started}`);
  if (item.completed) parts.push(`completed:${item.completed}`);
  if (item.depends?.length) parts.push(`depends:${item.depends.join(",")}`);
  const meta = parts.join(" ");

  // Build text with optional strikethrough for done items
  const prefix = item.status === "done" ? "~~" : "";
  const suffix = item.status === "done" ? "~~" : "";
  const completedNote = item.completed
    ? ` *(Completed: ${item.completed})*`
    : "";

  return `- <!-- ${meta} --> ${prefix}**${item.name}**${suffix} - ${item.description}${completedNote}\n`;
}

/**
 * Serialize structured roadmap data back to valid v2 markdown.
 *
 * @param data - RoadmapFile data with optional preserved content from parsing
 * @returns Complete markdown string with YAML frontmatter
 */
export function serializeRoadmap(
  data: RoadmapFile & Partial<RoadmapParseResult>,
): string {
  // Build frontmatter object (exclude categories, filePath, preserved content)
  const frontmatterData: Record<string, unknown> = {
    schema: data.schema,
    project: data.project,
    description: data.description,
    last_updated: data.last_updated,
  };

  // Build body content
  let body = data.preamble ?? `\n# Roadmap\n\n> ${data.description}\n`;

  // Serialize categories
  for (const category of data.categories) {
    body += `\n## ${category.title}\n\n<!-- category:${category.slug} -->\n\n`;
    for (const item of category.items) {
      body += serializeRoadmapItem(item);
    }
  }

  // Append trailing content after categories but before unknown sections,
  // so the parser finds it in the same position (end of last category section)
  if (data.trailingContent) {
    body += `\n${data.trailingContent}\n`;
  }

  // Append unknown sections
  if (data.unknownSections) {
    for (const section of data.unknownSections) {
      body += `\n## ${section.heading}\n${section.raw}`;
    }
  }

  return stringifyWithFrontmatter(body, frontmatterData);
}

// --- Session serialization ---

/**
 * Serialize structured session data back to valid v2 markdown.
 *
 * @param data - SessionFile data with optional preserved content from parsing
 * @returns Complete markdown string with YAML frontmatter
 */
export function serializeSession(
  data: SessionFile & Partial<SessionParseResult>,
): string {
  // Build frontmatter object (exclude structured fields, filePath, preserved content)
  const frontmatterData: Record<string, unknown> = {
    schema: data.schema,
    project: data.project,
    session_id: data.session_id,
    started: data.started,
    last_updated: data.last_updated,
    status: data.status,
  };

  // Only include roadmap_ref if defined (omit undefined/null from YAML)
  if (data.roadmap_ref !== undefined) {
    frontmatterData.roadmap_ref = data.roadmap_ref;
  }

  // Build body content
  let body = data.preamble ?? "\n# Session Progress\n";

  // Plan section
  body += "\n## Plan\n\n";
  for (const task of data.tasks) {
    const checkbox = task.checked ? "x" : " ";
    body += `- [${checkbox}] <!-- id:${task.id} dep:${task.dependency} --> ${task.description}\n`;
  }

  // Current Status section
  body += "\n## Current Status\n\n";
  if (data.currentStatus) {
    body += `${data.currentStatus}\n`;
  }

  // Decisions section
  body += "\n## Decisions\n\n";
  for (const decision of data.decisions) {
    body += `- ${decision}\n`;
  }

  // Failed Attempts section
  body += "\n## Failed Attempts\n\n";
  for (const attempt of data.failedAttempts) {
    body += `- <!-- id:${attempt.id} task:${attempt.taskRef} --> ${attempt.description}\n`;
  }

  // Completed Work section
  body += "\n## Completed Work\n\n";
  for (const entry of data.completedWork) {
    body += `- <!-- ref:${entry.taskRef} at:${entry.timestamp} --> ${entry.description}\n`;
  }

  // Append unknown sections
  if (data.unknownSections) {
    for (const section of data.unknownSections) {
      body += `\n## ${section.heading}\n${section.raw}`;
    }
  }

  // Append trailing content
  if (data.trailingContent) {
    body += `\n${data.trailingContent}\n`;
  }

  return stringifyWithFrontmatter(body, frontmatterData);
}

// --- Ideas serialization ---

/**
 * Serialize a single idea item into a markdown ### heading with body.
 * Metadata fields are written in canonical order: id, status, path (if present), stack (always last, if present).
 */
function serializeIdeaItem(item: IdeaItem): string {
  // Build metadata comment parts in canonical order
  const parts: string[] = [`id:${item.id}`, `status:${item.status}`];
  if (item.path) parts.push(`path:${item.path}`);
  if (item.stack?.length) parts.push(`stack:${item.stack.join(",")}`);
  const meta = parts.join(" ");

  let result = `### <!-- ${meta} --> ${item.title}\n`;
  if (item.body) {
    result += `\n${item.body}\n`;
  }
  return result;
}

/**
 * Serialize structured ideas data back to valid cc-dash/ideas@1 markdown.
 *
 * @param data - IdeasFile data with optional preserved content from parsing
 * @returns Complete markdown string with YAML frontmatter
 */
export function serializeIdeas(
  data: IdeasFile & Partial<IdeasParseResult>,
): string {
  // Build frontmatter object (exclude ideas, filePath, preserved content)
  const frontmatterData: Record<string, unknown> = {
    schema: data.schema,
    last_updated: data.last_updated,
  };

  // Build body content
  let body = data.preamble ?? "\n# Project Ideas\n";

  // Write the "Project ideas" section heading
  body += "\n## Project ideas\n\n";

  // Serialize each idea
  for (const idea of data.ideas) {
    body += serializeIdeaItem(idea);
    body += "\n";
  }

  // Append trailing content
  if (data.trailingContent) {
    body += `${data.trailingContent}\n`;
  }

  return stringifyWithFrontmatter(body, frontmatterData);
}
