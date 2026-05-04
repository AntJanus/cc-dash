/**
 * Project discovery engine.
 *
 * Scans configured directories for projects containing ROADMAP.md or
 * SESSION_PROGRESS.md with valid cc-dash schema frontmatter. Merges
 * explicitly registered projects from config. Produces a unified list
 * of DiscoveredProject records for downstream consumption.
 */

import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import matter from "gray-matter";
import type { Config } from "@/lib/schemas/config";

/** A project found by discovery (via scanning or explicit config). */
export interface DiscoveredProject {
  /** From frontmatter `project` field or directory name */
  name: string;
  /** URL-safe slug derived from name, unique across all discovered projects */
  slug: string;
  /** Absolute path to project directory */
  path: string;
  /** Absolute path to ROADMAP.md if found with valid schema */
  roadmapPath: string | null;
  /** Absolute path to SESSION_PROGRESS.md if found with valid schema */
  sessionPath: string | null;
  /** Absolute path to QA.md if found with valid schema */
  qaPath: string | null;
  /** Whether from explicit_projects config */
  isExplicit: boolean;
}

/**
 * Convert a string to a URL-safe slug.
 * Lowercases, replaces non-alphanumeric characters with hyphens,
 * collapses consecutive hyphens, and trims leading/trailing hyphens.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Valid cc-dash schema identifiers */
const VALID_SCHEMAS = new Set([
  "cc-dash/roadmap@1",
  "cc-dash/session@1",
  "cc-dash/qa@1",
]);

/**
 * Expand ~ or ~/ prefix to the user's home directory.
 * Always resolves the result to an absolute path.
 */
export function expandTilde(p: string): string {
  if (p === "~") return resolve(homedir());
  if (p.startsWith("~/")) return resolve(join(homedir(), p.slice(2)));
  return resolve(p);
}

/**
 * Check if a file has valid cc-dash schema frontmatter.
 * Returns the schema string if valid, null otherwise.
 * Catches all errors silently (file may not exist, be binary, etc).
 */
async function checkSchemaFrontmatter(
  filePath: string,
): Promise<{ schema: string; project?: string } | null> {
  try {
    const raw = await readFile(filePath, "utf-8");
    const { data } = matter(raw);
    if (
      data &&
      typeof data.schema === "string" &&
      VALID_SCHEMAS.has(data.schema)
    ) {
      return {
        schema: data.schema,
        project: typeof data.project === "string" ? data.project : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Recursively scan a directory for candidate project directories.
 * A candidate is any directory containing ROADMAP.md or SESSION_PROGRESS.md.
 * Skips excluded directories, hidden directories (. prefix), and respects depth limit.
 */
async function scanDirectory(
  dir: string,
  excludeDirs: Set<string>,
  maxDepth: number,
  currentDepth: number,
): Promise<string[]> {
  if (currentDepth > maxDepth) return [];

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const candidates: string[] = [];

  // Check if THIS directory has ROADMAP.md, SESSION_PROGRESS.md, or QA.md
  const hasTargetFile = entries.some(
    (e) =>
      e.isFile() &&
      (e.name === "ROADMAP.md" ||
        e.name === "SESSION_PROGRESS.md" ||
        e.name === "QA.md"),
  );
  if (hasTargetFile) {
    candidates.push(dir);
  }

  // Recurse into subdirectories
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".")) continue;
    if (excludeDirs.has(entry.name)) continue;

    const subDir = join(dir, entry.name);
    const subCandidates = await scanDirectory(
      subDir,
      excludeDirs,
      maxDepth,
      currentDepth + 1,
    );
    candidates.push(...subCandidates);
  }

  return candidates;
}

/** Options for discoverProjects. */
export interface DiscoverOptions {
  /** When true, include archived projects (slugs in config.archived_projects). Default: false. */
  includeArchived?: boolean;
}

/**
 * Discover all cc-dash projects across configured directories.
 *
 * 1. Scans each scan_dirs entry for directories containing ROADMAP.md or
 *    SESSION_PROGRESS.md with valid cc-dash schema frontmatter.
 * 2. Merges explicit_projects (always included even without files).
 * 3. Deduplicates by resolved path.
 * 4. Filters out archived projects unless includeArchived is true.
 */
export async function discoverProjects(
  config: Config,
  options: DiscoverOptions = {},
): Promise<DiscoveredProject[]> {
  const { includeArchived = false } = options;
  const excludeDirs = new Set(config.exclude_dirs);
  const projects = new Map<string, DiscoveredProject>();

  // Phase 1: Scan directories
  for (const scanDir of config.scan_dirs) {
    const resolvedDir = expandTilde(scanDir);

    // Scan starts at depth 0 (the scan_dir itself); candidates found
    // in children of the scan_dir are at depth 1, and so on.
    const candidates = await scanDirectory(
      resolvedDir,
      excludeDirs,
      config.scan_depth,
      0,
    );

    for (const candidateDir of candidates) {
      // Skip the scan_dir itself -- we scan INTO it, not it as a project
      if (candidateDir === resolvedDir) continue;
      if (projects.has(candidateDir)) continue;

      const roadmapFile = join(candidateDir, "ROADMAP.md");
      const sessionFile = join(candidateDir, "SESSION_PROGRESS.md");
      const qaFile = join(candidateDir, "QA.md");

      const roadmapInfo = await checkSchemaFrontmatter(roadmapFile);
      const sessionInfo = await checkSchemaFrontmatter(sessionFile);
      const qaInfo = await checkSchemaFrontmatter(qaFile);

      // Only include if at least one file has valid schema
      if (!roadmapInfo && !sessionInfo && !qaInfo) continue;

      // Determine project name: prefer frontmatter `project` field, fall back to dir name
      const name =
        roadmapInfo?.project ??
        sessionInfo?.project ??
        qaInfo?.project ??
        basename(candidateDir);

      projects.set(candidateDir, {
        name,
        slug: slugify(name),
        path: candidateDir,
        roadmapPath: roadmapInfo ? roadmapFile : null,
        sessionPath: sessionInfo ? sessionFile : null,
        qaPath: qaInfo ? qaFile : null,
        isExplicit: false,
      });
    }
  }

  // Phase 2: Merge explicit projects
  for (const explicit of config.explicit_projects) {
    const resolvedPath = expandTilde(explicit.path);

    if (projects.has(resolvedPath)) {
      // Already discovered via scanning -- mark as explicit
      const existing = projects.get(resolvedPath)!;
      existing.isExplicit = true;
      continue;
    }

    // Check for actual files even in explicit projects
    const roadmapFile = join(resolvedPath, "ROADMAP.md");
    const sessionFile = join(resolvedPath, "SESSION_PROGRESS.md");
    const qaFile = join(resolvedPath, "QA.md");

    const roadmapInfo = await checkSchemaFrontmatter(roadmapFile);
    const sessionInfo = await checkSchemaFrontmatter(sessionFile);
    const qaInfo = await checkSchemaFrontmatter(qaFile);

    projects.set(resolvedPath, {
      name: explicit.name,
      slug: slugify(explicit.name),
      path: resolvedPath,
      roadmapPath: roadmapInfo ? roadmapFile : null,
      sessionPath: sessionInfo ? sessionFile : null,
      qaPath: qaInfo ? qaFile : null,
      isExplicit: true,
    });
  }

  // Phase 3: Resolve slug collisions
  const slugCounts = new Map<string, DiscoveredProject[]>();
  for (const project of projects.values()) {
    const existing = slugCounts.get(project.slug);
    if (existing) {
      existing.push(project);
    } else {
      slugCounts.set(project.slug, [project]);
    }
  }

  for (const [slug, group] of slugCounts) {
    if (group.length <= 1) continue;
    // First project keeps the original slug, subsequent ones get a hash suffix
    for (let i = 1; i < group.length; i++) {
      const hash = createHash("md5")
        .update(group[i].path)
        .digest("hex")
        .slice(0, 4);
      group[i].slug = `${slug}-${hash}`;
      console.warn(
        `cc-dash: slug collision for "${slug}" — "${group[i].name}" at ${group[i].path} renamed to "${group[i].slug}"`,
      );
    }
  }

  const allProjects = Array.from(projects.values());

  // Phase 4: Filter out archived projects (unless caller wants them included)
  if (includeArchived) return allProjects;

  const archivedSlugs = new Set(config.archived_projects ?? []);
  if (archivedSlugs.size === 0) return allProjects;

  return allProjects.filter((p) => !archivedSlugs.has(p.slug));
}
