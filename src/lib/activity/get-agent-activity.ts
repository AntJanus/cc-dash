/**
 * Extract AI agent activity from git commit logs across discovered projects.
 *
 * Scans each project's git history for Co-Authored-By signatures and
 * builds a timeline of which agents touched which projects.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadConfig } from "@/lib/config";
import { discoverProjects } from "@/lib/fs";

const execFileAsync = promisify(execFile);

/** A single agent commit extracted from git log. */
export interface AgentCommit {
  /** Git commit hash (short) */
  hash: string;
  /** Commit subject line */
  subject: string;
  /** Commit author date (ISO string) */
  date: string;
  /** Project slug */
  projectSlug: string;
  /** Project display name */
  projectName: string;
  /** Agent name extracted from Co-Authored-By */
  agentName: string;
  /** Agent email from Co-Authored-By */
  agentEmail: string;
}

/** Aggregated stats for a single agent. */
export interface AgentSummary {
  /** Agent display name */
  name: string;
  /** Total commits across all projects */
  totalCommits: number;
  /** Projects this agent has contributed to */
  projects: { slug: string; name: string; commitCount: number }[];
  /** Most recent commit date (ISO string) */
  lastActive: string;
}

/** Full agent activity result. */
export interface AgentActivity {
  /** All agent commits, sorted by date descending */
  commits: AgentCommit[];
  /** Per-agent summary stats */
  agents: AgentSummary[];
  /** Total agent-assisted commits */
  totalCommits: number;
  /** Number of unique agents */
  uniqueAgents: number;
  /** Number of projects with agent activity */
  projectsWithAgents: number;
}

const CO_AUTHORED_RE = /^Co-Authored-By:\s*(.+?)\s*<([^>]+)>/im;

/**
 * Parse Co-Authored-By lines from a commit body.
 * Returns all matched agent names and emails.
 */
export function parseCoAuthors(
  body: string,
): { name: string; email: string }[] {
  const results: { name: string; email: string }[] = [];
  for (const line of body.split("\n")) {
    const match = line.match(CO_AUTHORED_RE);
    if (match) {
      results.push({ name: match[1].trim(), email: match[2].trim() });
    }
  }
  return results;
}

/**
 * Run git log on a project directory and extract agent commits.
 * Returns empty array if the directory is not a git repo or git fails.
 */
async function getAgentCommitsForProject(
  projectPath: string,
  projectSlug: string,
  projectName: string,
  maxCommits = 100,
): Promise<AgentCommit[]> {
  const DELIMITER = "---COMMIT-END---";
  try {
    const { stdout } = await execFileAsync(
      "git",
      [
        "log",
        `--max-count=${maxCommits}`,
        "--format=%h%n%s%n%aI%n%b" + DELIMITER,
      ],
      {
        cwd: projectPath,
        timeout: 10_000,
        maxBuffer: 1024 * 1024,
      },
    );

    const commits: AgentCommit[] = [];

    for (const block of stdout.split(DELIMITER)) {
      const trimmed = block.trim();
      if (!trimmed) continue;

      const lines = trimmed.split("\n");
      if (lines.length < 3) continue;

      const hash = lines[0];
      const subject = lines[1];
      const date = lines[2];
      const body = lines.slice(3).join("\n");

      const coAuthors = parseCoAuthors(body);
      for (const author of coAuthors) {
        commits.push({
          hash,
          subject,
          date,
          projectSlug,
          projectName,
          agentName: author.name,
          agentEmail: author.email,
        });
      }
    }

    return commits;
  } catch {
    return [];
  }
}

/** Build per-agent summary from a list of commits. */
export function buildAgentSummaries(commits: AgentCommit[]): AgentSummary[] {
  const byAgent = new Map<
    string,
    {
      name: string;
      commits: number;
      projects: Map<string, { name: string; count: number }>;
      lastActive: string;
    }
  >();

  for (const c of commits) {
    const key = c.agentName;
    const existing = byAgent.get(key);
    if (existing) {
      existing.commits++;
      if (c.date > existing.lastActive) existing.lastActive = c.date;
      const proj = existing.projects.get(c.projectSlug);
      if (proj) {
        proj.count++;
      } else {
        existing.projects.set(c.projectSlug, {
          name: c.projectName,
          count: 1,
        });
      }
    } else {
      const projects = new Map<string, { name: string; count: number }>();
      projects.set(c.projectSlug, { name: c.projectName, count: 1 });
      byAgent.set(key, {
        name: c.agentName,
        commits: 1,
        projects,
        lastActive: c.date,
      });
    }
  }

  return Array.from(byAgent.values())
    .map((a) => ({
      name: a.name,
      totalCommits: a.commits,
      projects: Array.from(a.projects.entries())
        .map(([slug, data]) => ({
          slug,
          name: data.name,
          commitCount: data.count,
        }))
        .sort((x, y) => y.commitCount - x.commitCount),
      lastActive: a.lastActive,
    }))
    .sort((a, b) => b.totalCommits - a.totalCommits);
}

/**
 * Scan all discovered projects for agent activity.
 * Runs git log in parallel across all projects.
 */
export async function getAgentActivity(
  maxCommitsPerProject = 100,
): Promise<AgentActivity> {
  const config = await loadConfig();
  const discovered = await discoverProjects(config);

  const allCommits = (
    await Promise.all(
      discovered.map((p) =>
        getAgentCommitsForProject(p.path, p.slug, p.name, maxCommitsPerProject),
      ),
    )
  ).flat();

  // Sort by date descending
  allCommits.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const agents = buildAgentSummaries(allCommits);
  const projectSlugs = new Set(allCommits.map((c) => c.projectSlug));

  return {
    commits: allCommits,
    agents,
    totalCommits: allCommits.length,
    uniqueAgents: agents.length,
    projectsWithAgents: projectSlugs.size,
  };
}
