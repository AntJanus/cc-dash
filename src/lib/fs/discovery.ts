/**
 * Project discovery engine.
 *
 * Scans configured directories for projects containing ROADMAP.md or
 * SESSION_PROGRESS.md with valid cc-dash schema frontmatter. Merges
 * explicitly registered projects from config. Produces a unified list
 * of DiscoveredProject records for downstream consumption.
 */

import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import matter from "gray-matter";
import type { Config } from "@/lib/schemas/config";

/** A project found by discovery (via scanning or explicit config). */
export interface DiscoveredProject {
  /** From frontmatter `project` field or directory name */
  name: string;
  /** Absolute path to project directory */
  path: string;
  /** Absolute path to ROADMAP.md if found with valid schema */
  roadmapPath: string | null;
  /** Absolute path to SESSION_PROGRESS.md if found with valid schema */
  sessionPath: string | null;
  /** Whether from explicit_projects config */
  isExplicit: boolean;
}

/** Valid cc-dash schema identifiers */
const VALID_SCHEMAS = new Set(["cc-dash/roadmap@1", "cc-dash/session@1"]);

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

  // Check if THIS directory has ROADMAP.md or SESSION_PROGRESS.md
  const hasTargetFile = entries.some(
    (e) =>
      e.isFile() &&
      (e.name === "ROADMAP.md" || e.name === "SESSION_PROGRESS.md"),
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

/**
 * Discover all cc-dash projects across configured directories.
 *
 * 1. Scans each scan_dirs entry for directories containing ROADMAP.md or
 *    SESSION_PROGRESS.md with valid cc-dash schema frontmatter.
 * 2. Merges explicit_projects (always included even without files).
 * 3. Deduplicates by resolved path.
 */
export async function discoverProjects(
  config: Config,
): Promise<DiscoveredProject[]> {
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

      const roadmapInfo = await checkSchemaFrontmatter(roadmapFile);
      const sessionInfo = await checkSchemaFrontmatter(sessionFile);

      // Only include if at least one file has valid schema
      if (!roadmapInfo && !sessionInfo) continue;

      // Determine project name: prefer frontmatter `project` field, fall back to dir name
      const name =
        roadmapInfo?.project ?? sessionInfo?.project ?? basename(candidateDir);

      projects.set(candidateDir, {
        name,
        path: candidateDir,
        roadmapPath: roadmapInfo ? roadmapFile : null,
        sessionPath: sessionInfo ? sessionFile : null,
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

    const roadmapInfo = await checkSchemaFrontmatter(roadmapFile);
    const sessionInfo = await checkSchemaFrontmatter(sessionFile);

    projects.set(resolvedPath, {
      name: explicit.name,
      path: resolvedPath,
      roadmapPath: roadmapInfo ? roadmapFile : null,
      sessionPath: sessionInfo ? sessionFile : null,
      isExplicit: true,
    });
  }

  return Array.from(projects.values());
}
