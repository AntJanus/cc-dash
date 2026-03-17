/**
 * Markdown parser for ROADMAP.md, SESSION_PROGRESS.md, and PROJECT_IDEAS.md files.
 *
 * Uses gray-matter for YAML frontmatter extraction and regex for HTML comment
 * metadata embedded in list items / headings. Validates extracted data against Zod schemas.
 *
 * Returns Result<T> with additional preserved content for round-trip serialization.
 */

import matter from "gray-matter";
import type { ValidationError } from "@/lib/schemas/shared";
import {
  validateRoadmapFrontmatter,
  validateRoadmapFile,
  type RoadmapFile,
  type RoadmapItem,
  type RoadmapCategory,
} from "@/lib/schemas/roadmap";
import {
  validateSessionFrontmatter,
  validateSessionFile,
  type SessionFile,
  type SessionTask,
  type FailedAttempt,
  type CompletionEntry,
} from "@/lib/schemas/session";
import {
  validateIdeasFrontmatter,
  validateIdeasFile,
  type IdeasFile,
  type IdeaItem,
} from "@/lib/schemas/ideas";
import type {
  Section,
  UnknownSection,
  RoadmapParseResult,
  SessionParseResult,
  IdeasParseResult,
} from "./types";

// --- Return types ---

/**
 * Parse result type that extends Result<T> with preserved content on success.
 * This is a proper discriminated union on `success`.
 */
export type ParseResult<T, P> =
  | { success: true; data: T; preserved: P }
  | { success: false; errors: ValidationError[] };

export type RoadmapResult = ParseResult<RoadmapFile, RoadmapParseResult>;
export type SessionResult = ParseResult<SessionFile, SessionParseResult>;
export type IdeasResult = ParseResult<IdeasFile, IdeasParseResult>;

// --- Regex patterns ---

/** Matches roadmap/session item HTML comment metadata lines */
const ITEM_META_RE = /^- <!-- ((?:[\w-]+:\S+\s?)+)-->\s*(.+)$/;

/** Matches session task lines with checkbox + HTML comment metadata */
const SESSION_TASK_RE = /^- \[([ x])\] <!-- ((?:[\w-]+:\S+\s?)+)-->\s*(.+)$/;

/** Extracts key:value pairs from inside an HTML comment */
const META_PAIRS_RE = /([\w-]+):(\S+)/g;

/** Matches category HTML comment */
const CATEGORY_RE = /^<!-- category:(\S+) -->$/;

// --- Shared helpers ---

/**
 * Post-process gray-matter frontmatter data to convert Date objects back to
 * ISO strings. gray-matter's bundled js-yaml auto-coerces ISO date strings
 * to Date objects, but our Zod schemas expect strings.
 */
function postProcessFrontmatter(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const processed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Date) {
      processed[key] = value.toISOString();
    } else {
      processed[key] = value;
    }
  }
  return processed;
}

/**
 * Split markdown body into sections by ## headings.
 * Lines before the first ## heading are collected as preamble (returned separately).
 * Only splits on "## " (two hashes + space), not "### " or deeper.
 */
function splitSections(content: string): {
  preamble: string[];
  sections: Section[];
} {
  const lines = content.split("\n");
  const preambleLines: string[] = [];
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    if (line.startsWith("## ") && !line.startsWith("### ")) {
      if (current) sections.push(current);
      current = { heading: line.slice(3).trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    } else {
      preambleLines.push(line);
    }
  }
  if (current) sections.push(current);

  return { preamble: preambleLines, sections };
}

/**
 * Extract key:value pairs from the interior of an HTML comment.
 * Example: "id:r_k8x2m status:planned" -> { id: "r_k8x2m", status: "planned" }
 */
function parseMetaPairs(metaStr: string): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const m of metaStr.matchAll(META_PAIRS_RE)) {
    meta[m[1]] = m[2];
  }
  return meta;
}

// --- Roadmap parsing ---

/**
 * Parse a roadmap item line into a RoadmapItem structure.
 * Handles strikethrough for done items and *(Completed: ...)* suffix.
 */
function parseRoadmapItemLine(line: string): RoadmapItem | null {
  const match = line.match(ITEM_META_RE);
  if (!match) return null;

  const [, metaStr, textPart] = match;
  const meta = parseMetaPairs(metaStr);

  // Extract name from **bold** (handle optional ~~strikethrough~~ wrapper)
  const nameMatch = textPart.match(/(?:~~)?\*\*(.+?)\*\*(?:~~)?\s*-\s*(.*)/);
  if (!nameMatch) return null;

  let description = nameMatch[2];
  // Strip trailing *(Completed: YYYY-MM-DD)* if present
  description = description.replace(/\s*\*\(Completed:.*?\)\*\s*$/, "").trim();

  const item: Record<string, unknown> = {
    id: meta.id,
    status: meta.status,
    name: nameMatch[1],
    description,
  };

  if (meta.started) item.started = meta.started;
  if (meta.completed) item.completed = meta.completed;
  if (meta.depends) item.depends = meta.depends.split(",");

  return item as unknown as RoadmapItem;
}

/**
 * Parse a ROADMAP.md file from raw markdown text.
 *
 * Extracts YAML frontmatter via gray-matter, validates against Zod schema,
 * splits body into sections, identifies category sections by <!-- category:slug --> comments,
 * parses item lines with HTML comment metadata, and preserves unrecognized content.
 *
 * @param raw - Raw markdown text of the ROADMAP.md file
 * @param filePath - Path to the source file (stored in parsed data)
 * @returns RoadmapResult with validated data and preserved content on success, or errors on failure
 */
export function parseRoadmap(raw: string, filePath: string): RoadmapResult {
  // Normalize line endings
  const normalized = raw.replace(/\r\n/g, "\n");

  // Phase 1: Extract frontmatter
  const { data, content } = matter(normalized);
  const processed = postProcessFrontmatter(data as Record<string, unknown>);

  // Validate frontmatter
  const fmResult = validateRoadmapFrontmatter(processed);
  if (!fmResult.success) return fmResult;

  // Phase 2: Parse body content
  const { preamble: preambleLines, sections } = splitSections(content);

  const categories: RoadmapCategory[] = [];
  const unknownSections: UnknownSection[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const sectionLines = section.lines;

    // Check if any non-empty line matches the category comment
    let slug: string | null = null;
    for (const line of sectionLines) {
      const trimmed = line.trim();
      if (trimmed === "") continue;
      const categoryMatch = trimmed.match(CATEGORY_RE);
      if (categoryMatch) {
        slug = categoryMatch[1];
        break;
      }
      // If the first non-empty line is not a category comment, this is not a category section
      // But we should keep checking because the category comment may be after blank lines
    }

    if (slug) {
      // Parse items from the section lines (skip the category comment itself)
      const items: RoadmapItem[] = [];
      for (const line of sectionLines) {
        const trimmed = line.trim();
        if (trimmed === "" || CATEGORY_RE.test(trimmed)) continue;
        const item = parseRoadmapItemLine(trimmed);
        if (item) items.push(item);
      }

      categories.push({
        title: section.heading,
        slug,
        items,
      });
    } else {
      // Unknown section -- preserve raw content
      unknownSections.push({
        heading: section.heading,
        raw: sectionLines.join("\n"),
      });
    }
  }

  // Build preamble string
  const preamble = preambleLines.join("\n");

  // Determine trailing content: content after the last recognized section
  // For roadmap, trailing content is text that appears after the last ## section's items
  // but is not part of any section. We check if the last section has trailing non-item lines.
  let trailingContent = "";
  if (sections.length > 0) {
    const lastSection = sections[sections.length - 1];
    const lastLines = lastSection.lines;
    // Find lines after the last item or category comment
    let lastContentIdx = -1;
    for (let i = lastLines.length - 1; i >= 0; i--) {
      const trimmed = lastLines[i].trim();
      if (trimmed !== "") {
        // Check if it's an item line or category comment
        if (ITEM_META_RE.test(trimmed) || CATEGORY_RE.test(trimmed)) {
          break;
        }
        lastContentIdx = i;
      }
    }
    if (lastContentIdx >= 0) {
      // Check if there is non-item content at the end of the last section
      const trailingLines: string[] = [];
      let foundItem = false;
      for (let i = lastLines.length - 1; i >= 0; i--) {
        const trimmed = lastLines[i].trim();
        if (ITEM_META_RE.test(trimmed) || CATEGORY_RE.test(trimmed)) {
          foundItem = true;
          break;
        }
        trailingLines.unshift(lastLines[i]);
      }
      if (foundItem) {
        const trailing = trailingLines.join("\n").trim();
        if (trailing) {
          trailingContent = trailing;
        }
      }
    }
  }

  // Assemble and validate full file
  const fileData = {
    ...fmResult.data,
    categories,
    filePath,
  };

  const fileResult = validateRoadmapFile(fileData);
  if (!fileResult.success) return fileResult;

  return {
    success: true,
    data: fileResult.data,
    preserved: {
      preamble,
      unknownSections,
      trailingContent,
    },
  };
}

// --- Session parsing ---

/**
 * Known session section headings.
 * Sections with these headings are parsed into structured data;
 * all other sections are preserved as unknown sections.
 */
const KNOWN_SESSION_SECTIONS = new Set([
  "Plan",
  "Current Status",
  "Decisions",
  "Failed Attempts",
  "Completed Work",
]);

/**
 * Parse a session task line.
 * Format: - [ ] <!-- id:t_xxxxx dep:yyyyy --> Description text
 */
function parseSessionTaskLine(line: string): SessionTask | null {
  const match = line.match(SESSION_TASK_RE);
  if (!match) return null;

  const [, checkbox, metaStr, description] = match;
  const meta = parseMetaPairs(metaStr);

  return {
    id: meta.id,
    checked: checkbox === "x",
    dependency: meta.dep,
    description: description.trim(),
  } as SessionTask;
}

/**
 * Parse a failed attempt line.
 * Format: - <!-- id:f_xxxxx task:t_yyyyy --> Description text
 */
function parseFailedAttemptLine(line: string): FailedAttempt | null {
  const match = line.match(ITEM_META_RE);
  if (!match) return null;

  const [, metaStr, description] = match;
  const meta = parseMetaPairs(metaStr);

  if (!meta.id?.startsWith("f_") || !meta.task?.startsWith("t_")) return null;

  return {
    id: meta.id,
    taskRef: meta.task,
    description: description.trim(),
  } as FailedAttempt;
}

/**
 * Parse a completion entry line.
 * Format: - <!-- ref:t_xxxxx at:ISO-TIMESTAMP --> Description text
 */
function parseCompletionLine(line: string): CompletionEntry | null {
  const match = line.match(ITEM_META_RE);
  if (!match) return null;

  const [, metaStr, description] = match;
  const meta = parseMetaPairs(metaStr);

  if (!meta.ref?.startsWith("t_") || !meta.at) return null;

  return {
    taskRef: meta.ref,
    timestamp: meta.at,
    description: description.trim(),
  } as CompletionEntry;
}

/**
 * Parse a SESSION_PROGRESS.md file from raw markdown text.
 *
 * Extracts YAML frontmatter via gray-matter, validates against Zod schema,
 * splits body into sections, parses known sections (Plan, Current Status,
 * Decisions, Failed Attempts, Completed Work), and preserves unrecognized
 * sections (e.g., Verification Results, Custom Notes).
 *
 * @param raw - Raw markdown text of the SESSION_PROGRESS.md file
 * @param filePath - Path to the source file (stored in parsed data)
 * @returns SessionResult with validated data and preserved content on success, or errors on failure
 */
export function parseSession(raw: string, filePath: string): SessionResult {
  // Normalize line endings
  const normalized = raw.replace(/\r\n/g, "\n");

  // Phase 1: Extract frontmatter
  const { data, content } = matter(normalized);
  const processed = postProcessFrontmatter(data as Record<string, unknown>);

  // Validate frontmatter
  const fmResult = validateSessionFrontmatter(processed);
  if (!fmResult.success) return fmResult;

  // Phase 2: Parse body content
  const { preamble: preambleLines, sections } = splitSections(content);

  const tasks: SessionTask[] = [];
  let currentStatus = "";
  const decisions: string[] = [];
  const failedAttempts: FailedAttempt[] = [];
  const completedWork: CompletionEntry[] = [];
  const unknownSections: UnknownSection[] = [];

  for (const section of sections) {
    if (!KNOWN_SESSION_SECTIONS.has(section.heading)) {
      // Unknown section -- preserve raw content
      unknownSections.push({
        heading: section.heading,
        raw: section.lines.join("\n"),
      });
      continue;
    }

    switch (section.heading) {
      case "Plan":
        for (const line of section.lines) {
          const trimmed = line.trim();
          if (trimmed === "") continue;
          const task = parseSessionTaskLine(trimmed);
          if (task) tasks.push(task);
        }
        break;

      case "Current Status":
        // Store as raw string, trimming leading/trailing blank lines
        currentStatus = section.lines.join("\n").trim();
        break;

      case "Decisions":
        for (const line of section.lines) {
          const trimmed = line.trim();
          if (trimmed === "") continue;
          if (trimmed.startsWith("- ")) {
            decisions.push(trimmed.slice(2).trim());
          }
        }
        break;

      case "Failed Attempts":
        for (const line of section.lines) {
          const trimmed = line.trim();
          if (trimmed === "") continue;
          const attempt = parseFailedAttemptLine(trimmed);
          if (attempt) failedAttempts.push(attempt);
        }
        break;

      case "Completed Work":
        for (const line of section.lines) {
          const trimmed = line.trim();
          if (trimmed === "") continue;
          const entry = parseCompletionLine(trimmed);
          if (entry) completedWork.push(entry);
        }
        break;
    }
  }

  // Build preamble string
  const preamble = preambleLines.join("\n");

  // Determine trailing content
  let trailingContent = "";
  if (sections.length > 0) {
    const lastSection = sections[sections.length - 1];
    const lastLines = lastSection.lines;
    // For the last section, check for trailing non-list content
    // This handles cases like text after the last section
    const lastLinesJoined = lastLines.join("\n");
    // Trailing content is rare in session files; it would be text
    // after all sections that isn't part of the last section's content
    const trimmed = lastLinesJoined.trimEnd();
    if (trimmed !== lastLinesJoined.trim()) {
      trailingContent = "";
    }
  }

  // Assemble and validate full file
  const fileData = {
    ...fmResult.data,
    tasks,
    currentStatus,
    decisions,
    failedAttempts,
    completedWork,
    filePath,
  };

  const fileResult = validateSessionFile(fileData);
  if (!fileResult.success) return fileResult;

  return {
    success: true,
    data: fileResult.data,
    preserved: {
      preamble,
      unknownSections,
      trailingContent,
    },
  };
}

// --- Ideas parsing ---

/**
 * Regex for idea heading with inline HTML comment metadata.
 * Format: ### <!-- id:i_a8k2m status:started path:gamma-engine/ stack:TypeScript/Node.js --> Title text
 *
 * Captures:
 *   [1] Full metadata string inside <!-- ... -->
 *   [2] Title text after -->
 */
const IDEA_HEADING_RE = /^###\s+<!--\s+(.*?)\s*-->\s*(.+)$/;

/**
 * Parse idea metadata from the HTML comment interior.
 * Standard key:value pairs are extracted with META_PAIRS_RE.
 * The `stack` field is special: it is always the last field and its value
 * may contain spaces (e.g., "Godot 4,GDScript,Pixel Art"), so we capture
 * everything after "stack:" greedily.
 */
function parseIdeaMetadata(metaStr: string): Record<string, string | string[]> {
  const meta: Record<string, string | string[]> = {};

  // Check if stack field is present (always last)
  const stackIdx = metaStr.indexOf("stack:");
  let standardPart = metaStr;
  if (stackIdx >= 0) {
    standardPart = metaStr.slice(0, stackIdx).trim();
    const stackValue = metaStr.slice(stackIdx + "stack:".length).trim();
    meta.stack = stackValue.split(",").map((s) => s.trim());
  }

  // Parse standard key:value pairs from the part before stack
  for (const m of standardPart.matchAll(META_PAIRS_RE)) {
    meta[m[1]] = m[2];
  }

  return meta;
}

/**
 * Parse a PROJECT_IDEAS.md file from raw markdown text.
 *
 * Extracts YAML frontmatter via gray-matter, validates against Zod schema,
 * splits body into ## sections, identifies the "Project ideas" section,
 * parses ### headings with HTML comment metadata for individual ideas,
 * and preserves preamble content (sections before "Project ideas").
 *
 * @param raw - Raw markdown text of the PROJECT_IDEAS.md file
 * @param filePath - Path to the source file (stored in parsed data)
 * @returns IdeasResult with validated data and preserved content on success, or errors on failure
 */
export function parseIdeas(raw: string, filePath: string): IdeasResult {
  // Normalize line endings
  const normalized = raw.replace(/\r\n/g, "\n");

  // Phase 1: Extract frontmatter
  const { data, content } = matter(normalized);
  const processed = postProcessFrontmatter(data as Record<string, unknown>);

  // Validate frontmatter
  const fmResult = validateIdeasFrontmatter(processed);
  if (!fmResult.success) return fmResult;

  // Phase 2: Parse body content
  const { preamble: preambleLines, sections } = splitSections(content);

  // Find the "Project ideas" section
  let ideasSection: Section | null = null;
  const preambleSections: Section[] = [];

  for (const section of sections) {
    if (section.heading.toLowerCase() === "project ideas" && !ideasSection) {
      ideasSection = section;
    } else if (!ideasSection) {
      // Sections before "Project ideas" are preamble
      preambleSections.push(section);
    }
    // Sections after "Project ideas" are ignored (would be trailing in a more complex format)
  }

  // Build preamble string: content before first ## + preamble ## sections
  let preamble = preambleLines.join("\n");
  for (const section of preambleSections) {
    preamble += `\n## ${section.heading}\n${section.lines.join("\n")}`;
  }

  // Phase 3: Parse ideas from the "Project ideas" section
  const ideas: IdeaItem[] = [];
  const trailingContent = "";

  if (ideasSection) {
    const lines = ideasSection.lines;

    // Split at ### headings to find individual ideas
    const ideaBlocks: { heading: string; bodyLines: string[] }[] = [];
    let currentBlock: { heading: string; bodyLines: string[] } | null = null;

    for (const line of lines) {
      if (line.startsWith("### ")) {
        if (currentBlock) ideaBlocks.push(currentBlock);
        currentBlock = { heading: line, bodyLines: [] };
      } else if (currentBlock) {
        currentBlock.bodyLines.push(line);
      }
      // Lines before first ### in the ideas section are skipped (typically blank)
    }
    if (currentBlock) ideaBlocks.push(currentBlock);

    // Parse each idea block
    for (const block of ideaBlocks) {
      const match = block.heading.match(IDEA_HEADING_RE);
      if (!match) continue;

      const [, metaStr, title] = match;
      const meta = parseIdeaMetadata(metaStr);

      // Build body: trim leading/trailing blank lines but preserve internal structure
      const body = block.bodyLines.join("\n").trim();

      const item: Record<string, unknown> = {
        id: meta.id,
        status: meta.status,
        title: title.trim(),
        body,
      };

      if (meta.path) item.path = meta.path;
      if (meta.stack) item.stack = meta.stack;

      ideas.push(item as unknown as IdeaItem);
    }
  }

  // Assemble and validate full file
  const fileData = {
    ...fmResult.data,
    ideas,
    filePath,
  };

  const fileResult = validateIdeasFile(fileData);
  if (!fileResult.success) return fileResult;

  return {
    success: true,
    data: fileResult.data,
    preserved: {
      preamble,
      trailingContent,
    },
  };
}
