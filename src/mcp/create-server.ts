/**
 * cc-dash MCP Server factory
 *
 * Creates and configures the McpServer with all tool registrations.
 * Separated from the entry point so tests can create server instances
 * without triggering stdio transport.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { loadConfig, CONFIG_PATH } from "@/lib/config";
import {
  discoverProjects,
  parseRoadmap,
  parseSession,
  parseIdeas,
  parseQa,
  writeRoadmapFile,
  writeSessionFile,
  writeQaFile,
} from "@/lib/fs";
import { expandTilde } from "@/lib/fs/discovery";
import {
  generateRoadmapId,
  generateCategorySlug,
} from "@/lib/utils/generate-id";
import type { QaItem } from "@/lib/schemas/qa";
import {
  loadPortfolio,
  savePortfolio,
  loadAllPortfolios,
} from "@/lib/fs/portfolio";
import { getTodayDirections } from "@/lib/projects/get-today-directions";

async function resolveProject(slug: string) {
  const config = await loadConfig();
  const projects = await discoverProjects(config);
  return projects.find((p) => p.slug === slug);
}

/** Find which scan dir a project path belongs to. */
function findScanDir(projectPath: string, scanDirs: string[]): string | null {
  for (const dir of scanDirs) {
    const resolved = expandTilde(dir);
    if (
      projectPath.startsWith(resolved + "/") ||
      projectPath.startsWith(resolved + "\\")
    ) {
      return resolved;
    }
  }
  return null;
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

const QA_ISSUE_CATEGORY_TITLE = "QA Issues";
const QA_ISSUE_CATEGORY_SLUG = "qa-issues";

function nowIso(): string {
  return new Date().toISOString();
}

function createServer(): McpServer {
  const server = new McpServer({
    name: "cc-dash",
    version: "3.2.0",
  });

  // -------------------------------------------------------------------------
  // Tool: list_projects
  // -------------------------------------------------------------------------

  server.tool(
    "list_projects",
    "List all discovered projects with their roadmap/session status and progress summary",
    {},
    async () => {
      const config = await loadConfig();
      const projects = await discoverProjects(config);
      const resolvedDirs = config.scan_dirs.map((d) => expandTilde(d));
      const allMeta = await loadAllPortfolios(resolvedDirs);

      const summaries = await Promise.all(
        projects.map(async (p) => {
          const meta = allMeta.get(p.slug);
          const summary: Record<string, unknown> = {
            slug: p.slug,
            name: p.name,
            path: p.path,
            hasRoadmap: !!p.roadmapPath,
            hasSession: !!p.sessionPath,
            portfolioStatus: meta?.status ?? "active",
            portfolioOrder: meta?.order,
          };

          if (p.roadmapPath) {
            try {
              const raw = await readFile(p.roadmapPath, "utf-8");
              const result = parseRoadmap(raw, p.roadmapPath);
              if (result.success) {
                const items = result.data.categories.flatMap((c) => c.items);
                summary.roadmapTotal = items.length;
                summary.roadmapDone = items.filter(
                  (i) => i.status === "done",
                ).length;
                summary.roadmapInProgress = items.filter(
                  (i) => i.status === "in-progress",
                ).length;
              }
            } catch {
              // skip unreadable
            }
          }

          if (p.sessionPath) {
            try {
              const raw = await readFile(p.sessionPath, "utf-8");
              const result = parseSession(raw, p.sessionPath);
              if (result.success) {
                summary.sessionStatus = result.data.status;
                summary.sessionId = result.data.session_id;
                const tasks = result.data.tasks;
                summary.tasksTotal = tasks.length;
                summary.tasksDone = tasks.filter((t) => t.checked).length;
              }
            } catch {
              // skip unreadable
            }
          }

          return summary;
        }),
      );

      return {
        content: [{ type: "text", text: JSON.stringify(summaries, null, 2) }],
      };
    },
  );

  // -------------------------------------------------------------------------
  // Tool: get_project
  // -------------------------------------------------------------------------

  server.tool(
    "get_project",
    "Get full detail for a project including all roadmap items and session tasks",
    { slug: z.string().describe("Project slug") },
    async ({ slug }) => {
      const project = await resolveProject(slug);
      if (!project) {
        return {
          content: [{ type: "text", text: `Project "${slug}" not found` }],
          isError: true,
        };
      }

      const detail: Record<string, unknown> = {
        slug: project.slug,
        name: project.name,
        path: project.path,
      };

      if (project.roadmapPath) {
        try {
          const raw = await readFile(project.roadmapPath, "utf-8");
          const result = parseRoadmap(raw, project.roadmapPath);
          if (result.success) {
            detail.roadmap = {
              description: result.data.description,
              lastUpdated: result.data.last_updated,
              categories: result.data.categories.map((c) => ({
                title: c.title,
                slug: c.slug,
                items: c.items.map((i) => ({
                  id: i.id,
                  name: i.name,
                  description: i.description,
                  status: i.status,
                  started: i.started,
                  completed: i.completed,
                  depends: i.depends,
                })),
              })),
            };
          }
        } catch {
          detail.roadmapError = "Could not read roadmap file";
        }
      }

      if (project.sessionPath) {
        try {
          const raw = await readFile(project.sessionPath, "utf-8");
          const result = parseSession(raw, project.sessionPath);
          if (result.success) {
            detail.session = {
              sessionId: result.data.session_id,
              status: result.data.status,
              started: result.data.started,
              lastUpdated: result.data.last_updated,
              currentStatus: result.data.currentStatus,
              tasks: result.data.tasks.map((t) => ({
                id: t.id,
                description: t.description,
                checked: t.checked,
                dependency: t.dependency,
              })),
              decisions: result.data.decisions,
              failedAttempts: result.data.failedAttempts,
              completedWork: result.data.completedWork,
            };
          }
        } catch {
          detail.sessionError = "Could not read session file";
        }
      }

      return {
        content: [{ type: "text", text: JSON.stringify(detail, null, 2) }],
      };
    },
  );

  // -------------------------------------------------------------------------
  // Tool: search
  // -------------------------------------------------------------------------

  server.tool(
    "search",
    "Search across all projects' roadmap items, session tasks, and ideas",
    { query: z.string().describe("Search query (case-insensitive)") },
    async ({ query }) => {
      const trimmed = query.trim();
      if (!trimmed) {
        return {
          content: [{ type: "text", text: "Empty query" }],
          isError: true,
        };
      }

      const config = await loadConfig();
      const projects = await discoverProjects(config);
      const lower = trimmed.toLowerCase();
      const results: Record<string, unknown>[] = [];

      await Promise.allSettled(
        projects.map(async (p) => {
          if (p.roadmapPath) {
            try {
              const raw = await readFile(p.roadmapPath, "utf-8");
              const result = parseRoadmap(raw, p.roadmapPath);
              if (result.success) {
                for (const cat of result.data.categories) {
                  for (const item of cat.items) {
                    if (
                      item.name.toLowerCase().includes(lower) ||
                      item.description.toLowerCase().includes(lower)
                    ) {
                      results.push({
                        type: "roadmap",
                        project: p.name,
                        projectSlug: p.slug,
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        status: item.status,
                        category: cat.title,
                      });
                    }
                  }
                }
              }
            } catch {
              // skip
            }
          }

          if (p.sessionPath) {
            try {
              const raw = await readFile(p.sessionPath, "utf-8");
              const result = parseSession(raw, p.sessionPath);
              if (result.success) {
                for (const task of result.data.tasks) {
                  if (task.description.toLowerCase().includes(lower)) {
                    results.push({
                      type: "session",
                      project: p.name,
                      projectSlug: p.slug,
                      id: task.id,
                      description: task.description,
                      checked: task.checked,
                    });
                  }
                }
              }
            } catch {
              // skip
            }
          }
        }),
      );

      // Ideas
      if (config.ideas_file) {
        try {
          const filePath = expandTilde(config.ideas_file);
          const raw = await readFile(filePath, "utf-8");
          const result = parseIdeas(raw, filePath);
          if (result.success) {
            for (const idea of result.data.ideas) {
              if (
                idea.title.toLowerCase().includes(lower) ||
                idea.body.toLowerCase().includes(lower)
              ) {
                results.push({
                  type: "idea",
                  id: idea.id,
                  title: idea.title,
                  status: idea.status,
                  body: idea.body.slice(0, 200),
                });
              }
            }
          }
        } catch {
          // no ideas file
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { query: trimmed, resultCount: results.length, results },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // -------------------------------------------------------------------------
  // Tool: update_roadmap_item
  // -------------------------------------------------------------------------

  server.tool(
    "update_roadmap_item",
    "Update a roadmap item's status, name, description, or move it to a different category",
    {
      slug: z.string().describe("Project slug"),
      itemId: z.string().describe("Roadmap item ID (r_xxxxx)"),
      name: z.string().optional().describe("New name"),
      description: z.string().optional().describe("New description"),
      status: z
        .enum(["planned", "in-progress", "done", "idea"])
        .optional()
        .describe("New status"),
      categorySlug: z
        .string()
        .optional()
        .describe("Move item to this category slug"),
    },
    async ({ slug, itemId, name, description, status, categorySlug }) => {
      const project = await resolveProject(slug);
      if (!project?.roadmapPath) {
        return {
          content: [
            {
              type: "text",
              text: `Project "${slug}" not found or has no roadmap`,
            },
          ],
          isError: true,
        };
      }

      const raw = await readFile(project.roadmapPath, "utf-8");
      const parsed = parseRoadmap(raw, project.roadmapPath);
      if (!parsed.success) {
        return {
          content: [{ type: "text", text: "Failed to parse roadmap" }],
          isError: true,
        };
      }

      const data = parsed.data;

      // Find item
      let item: (typeof data.categories)[0]["items"][0] | undefined;
      let sourceCategory: (typeof data.categories)[0] | undefined;
      for (const cat of data.categories) {
        const found = cat.items.find((i) => i.id === itemId);
        if (found) {
          item = found;
          sourceCategory = cat;
          break;
        }
      }

      if (!item || !sourceCategory) {
        return {
          content: [{ type: "text", text: `Item "${itemId}" not found` }],
          isError: true,
        };
      }

      if (name !== undefined) item.name = name.trim();
      if (description !== undefined) item.description = description.trim();
      if (status !== undefined) {
        if (status === "in-progress" && !item.started) item.started = today();
        if (status === "done" && !item.completed) item.completed = today();
        item.status = status;
      }

      // Move between categories
      if (categorySlug && categorySlug !== sourceCategory.slug) {
        const target = data.categories.find((c) => c.slug === categorySlug);
        if (!target) {
          return {
            content: [
              { type: "text", text: `Category "${categorySlug}" not found` },
            ],
            isError: true,
          };
        }
        sourceCategory.items = sourceCategory.items.filter(
          (i) => i.id !== itemId,
        );
        target.items.push(item);
      }

      const writeResult = await writeRoadmapFile(
        project.roadmapPath,
        data,
        parsed.preserved,
      );
      if (!writeResult.success) {
        return {
          content: [{ type: "text", text: "Failed to write roadmap file" }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text", text: `Updated item ${itemId}` }],
      };
    },
  );

  // -------------------------------------------------------------------------
  // Tool: add_roadmap_item
  // -------------------------------------------------------------------------

  server.tool(
    "add_roadmap_item",
    "Add a new roadmap item to a project category",
    {
      slug: z.string().describe("Project slug"),
      categorySlug: z.string().describe("Target category slug"),
      name: z.string().describe("Item name"),
      description: z.string().describe("Item description"),
      status: z
        .enum(["planned", "in-progress", "done", "idea"])
        .default("planned")
        .describe("Initial status"),
    },
    async ({ slug, categorySlug, name, description, status }) => {
      const project = await resolveProject(slug);
      if (!project?.roadmapPath) {
        return {
          content: [
            {
              type: "text",
              text: `Project "${slug}" not found or has no roadmap`,
            },
          ],
          isError: true,
        };
      }

      const raw = await readFile(project.roadmapPath, "utf-8");
      const parsed = parseRoadmap(raw, project.roadmapPath);
      if (!parsed.success) {
        return {
          content: [{ type: "text", text: "Failed to parse roadmap" }],
          isError: true,
        };
      }

      const category = parsed.data.categories.find(
        (c) => c.slug === categorySlug,
      );
      if (!category) {
        return {
          content: [
            { type: "text", text: `Category "${categorySlug}" not found` },
          ],
          isError: true,
        };
      }

      const id = generateRoadmapId();
      const newItem: Record<string, unknown> = {
        id,
        name: name.trim(),
        description: description.trim(),
        status,
      };

      if (status === "in-progress") newItem.started = today();
      if (status === "done") newItem.completed = today();

      category.items.push(newItem as (typeof category.items)[number]);

      const writeResult = await writeRoadmapFile(
        project.roadmapPath,
        parsed.data,
        parsed.preserved,
      );
      if (!writeResult.success) {
        return {
          content: [{ type: "text", text: "Failed to write roadmap file" }],
          isError: true,
        };
      }

      return {
        content: [
          { type: "text", text: `Created item ${id} in ${categorySlug}` },
        ],
      };
    },
  );

  // -------------------------------------------------------------------------
  // Tool: add_roadmap_category
  // -------------------------------------------------------------------------

  server.tool(
    "add_roadmap_category",
    "Add a new empty category to a project's roadmap",
    {
      slug: z.string().describe("Project slug"),
      title: z.string().describe("Category title"),
    },
    async ({ slug, title }) => {
      const project = await resolveProject(slug);
      if (!project?.roadmapPath) {
        return {
          content: [
            {
              type: "text",
              text: `Project "${slug}" not found or has no roadmap`,
            },
          ],
          isError: true,
        };
      }

      const raw = await readFile(project.roadmapPath, "utf-8");
      const parsed = parseRoadmap(raw, project.roadmapPath);
      if (!parsed.success) {
        return {
          content: [{ type: "text", text: "Failed to parse roadmap" }],
          isError: true,
        };
      }

      const catSlug = generateCategorySlug(title);
      if (parsed.data.categories.some((c) => c.slug === catSlug)) {
        return {
          content: [
            { type: "text", text: `Category "${catSlug}" already exists` },
          ],
          isError: true,
        };
      }

      parsed.data.categories.push({
        title: title.trim(),
        slug: catSlug,
        items: [],
      });

      const writeResult = await writeRoadmapFile(
        project.roadmapPath,
        parsed.data,
        parsed.preserved,
      );
      if (!writeResult.success) {
        return {
          content: [{ type: "text", text: "Failed to write roadmap file" }],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Created category "${title}" (${catSlug})`,
          },
        ],
      };
    },
  );

  // -------------------------------------------------------------------------
  // Tool: bulk_update_status
  // -------------------------------------------------------------------------

  server.tool(
    "bulk_update_status",
    "Update the status of multiple roadmap items at once",
    {
      slug: z.string().describe("Project slug"),
      itemIds: z.array(z.string()).describe("Array of roadmap item IDs"),
      status: z
        .enum(["planned", "in-progress", "done", "idea"])
        .describe("New status for all items"),
    },
    async ({ slug, itemIds, status }) => {
      const project = await resolveProject(slug);
      if (!project?.roadmapPath) {
        return {
          content: [
            {
              type: "text",
              text: `Project "${slug}" not found or has no roadmap`,
            },
          ],
          isError: true,
        };
      }

      const raw = await readFile(project.roadmapPath, "utf-8");
      const parsed = parseRoadmap(raw, project.roadmapPath);
      if (!parsed.success) {
        return {
          content: [{ type: "text", text: "Failed to parse roadmap" }],
          isError: true,
        };
      }

      const idSet = new Set(itemIds);
      let count = 0;

      for (const cat of parsed.data.categories) {
        for (const item of cat.items) {
          if (!idSet.has(item.id)) continue;
          if (status === "in-progress" && !item.started) item.started = today();
          if (status === "done" && !item.completed) item.completed = today();
          item.status = status;
          count++;
        }
      }

      if (count === 0) {
        return {
          content: [{ type: "text", text: "No matching items found" }],
          isError: true,
        };
      }

      const writeResult = await writeRoadmapFile(
        project.roadmapPath,
        parsed.data,
        parsed.preserved,
      );
      if (!writeResult.success) {
        return {
          content: [{ type: "text", text: "Failed to write roadmap file" }],
          isError: true,
        };
      }

      return {
        content: [
          { type: "text", text: `Updated ${count} items to "${status}"` },
        ],
      };
    },
  );

  // -------------------------------------------------------------------------
  // Tool: get_session
  // -------------------------------------------------------------------------

  server.tool(
    "get_session",
    "Get the current session state for a project (tasks, status, decisions, failed attempts)",
    { slug: z.string().describe("Project slug") },
    async ({ slug }) => {
      const project = await resolveProject(slug);
      if (!project?.sessionPath) {
        return {
          content: [
            {
              type: "text",
              text: `Project "${slug}" not found or has no session file`,
            },
          ],
          isError: true,
        };
      }

      const raw = await readFile(project.sessionPath, "utf-8");
      const result = parseSession(raw, project.sessionPath);
      if (!result.success) {
        return {
          content: [{ type: "text", text: "Failed to parse session" }],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                sessionId: result.data.session_id,
                status: result.data.status,
                started: result.data.started,
                lastUpdated: result.data.last_updated,
                currentStatus: result.data.currentStatus,
                tasks: result.data.tasks,
                decisions: result.data.decisions,
                failedAttempts: result.data.failedAttempts,
                completedWork: result.data.completedWork,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // -------------------------------------------------------------------------
  // Tool: update_session_status
  // -------------------------------------------------------------------------

  server.tool(
    "update_session_status",
    "Change a session's lifecycle status (in-progress, paused, completed, blocked)",
    {
      slug: z.string().describe("Project slug"),
      status: z
        .enum(["in-progress", "paused", "completed", "blocked"])
        .describe("New session status"),
    },
    async ({ slug, status }) => {
      const project = await resolveProject(slug);
      if (!project?.sessionPath) {
        return {
          content: [
            {
              type: "text",
              text: `Project "${slug}" not found or has no session file`,
            },
          ],
          isError: true,
        };
      }

      const raw = await readFile(project.sessionPath, "utf-8");
      const result = parseSession(raw, project.sessionPath);
      if (!result.success) {
        return {
          content: [{ type: "text", text: "Failed to parse session" }],
          isError: true,
        };
      }

      const updated = { ...result.data, status };
      const writeResult = await writeSessionFile(
        project.sessionPath,
        updated,
        result.preserved,
      );
      if (!writeResult.success) {
        return {
          content: [{ type: "text", text: "Failed to write session file" }],
          isError: true,
        };
      }

      return {
        content: [
          { type: "text", text: `Session status updated to "${status}"` },
        ],
      };
    },
  );

  // -------------------------------------------------------------------------
  // Tool: list_ideas
  // -------------------------------------------------------------------------

  server.tool(
    "list_ideas",
    "List all project ideas from the portfolio ideas file",
    {},
    async () => {
      const config = await loadConfig();
      if (!config.ideas_file) {
        return {
          content: [
            {
              type: "text",
              text: "No ideas_file configured in cc-dash config",
            },
          ],
          isError: true,
        };
      }

      const filePath = expandTilde(config.ideas_file);
      let raw: string;
      try {
        raw = await readFile(filePath, "utf-8");
      } catch {
        return {
          content: [{ type: "text", text: "Ideas file not found" }],
          isError: true,
        };
      }

      const result = parseIdeas(raw, filePath);
      if (!result.success) {
        return {
          content: [{ type: "text", text: "Failed to parse ideas file" }],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              result.data.ideas.map((i) => ({
                id: i.id,
                title: i.title,
                status: i.status,
                stack: i.stack,
                body: i.body.slice(0, 200),
              })),
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // -------------------------------------------------------------------------
  // Tool: get_config
  // -------------------------------------------------------------------------

  server.tool(
    "get_config",
    "Get the current cc-dash configuration (scan dirs, archived projects, display preferences)",
    {},
    async () => {
      const config = await loadConfig();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { configPath: CONFIG_PATH, ...config },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // -------------------------------------------------------------------------
  // Tool: get_portfolio
  // -------------------------------------------------------------------------

  server.tool(
    "get_portfolio",
    "Get project ordering and status for all scan directories. Shows priority order and active/inactive/maintenance status.",
    {},
    async () => {
      const config = await loadConfig();
      const resolvedDirs = config.scan_dirs.map((d) => expandTilde(d));
      const allMeta = await loadAllPortfolios(resolvedDirs);
      const projects = await discoverProjects(config, {
        includeArchived: true,
      });

      const result = projects.map((p) => {
        const meta = allMeta.get(p.slug);
        return {
          slug: p.slug,
          name: p.name,
          status: meta?.status ?? "active",
          order: meta?.order,
        };
      });

      // Sort: by order (if present), then alphabetical
      result.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined)
          return a.order - b.order;
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return a.name.localeCompare(b.name);
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // -------------------------------------------------------------------------
  // Tool: set_project_status
  // -------------------------------------------------------------------------

  server.tool(
    "set_project_status",
    "Set a project's status (active, inactive, maintenance)",
    {
      slug: z.string().describe("Project slug"),
      status: z
        .enum(["active", "inactive", "maintenance"])
        .describe("New project status"),
    },
    async ({ slug, status }) => {
      const config = await loadConfig();
      const projects = await discoverProjects(config, {
        includeArchived: true,
      });
      const project = projects.find((p) => p.slug === slug);
      if (!project) {
        return {
          content: [{ type: "text", text: `Project "${slug}" not found` }],
          isError: true,
        };
      }

      const scanDir = findScanDir(
        project.path,
        config.scan_dirs.map((d) => expandTilde(d)),
      );
      if (!scanDir) {
        return {
          content: [
            {
              type: "text",
              text: `Could not determine scan directory for "${slug}"`,
            },
          ],
          isError: true,
        };
      }

      const portfolio = await loadPortfolio(scanDir);
      if (!portfolio.projects[slug]) {
        portfolio.projects[slug] = {
          status,
          cadence: null,
          dormant_until: null,
        };
      } else {
        portfolio.projects[slug].status = status;
      }
      await savePortfolio(scanDir, portfolio);

      return {
        content: [
          { type: "text", text: `Set "${slug}" status to "${status}"` },
        ],
      };
    },
  );

  // -------------------------------------------------------------------------
  // Tool: reorder_projects
  // -------------------------------------------------------------------------

  server.tool(
    "reorder_projects",
    "Set the priority order of projects. First slug = highest priority (order 0).",
    {
      slugs: z
        .array(z.string())
        .describe("Project slugs in desired priority order (first = highest)"),
    },
    async ({ slugs }) => {
      const config = await loadConfig();
      const resolvedDirs = config.scan_dirs.map((d) => expandTilde(d));
      const projects = await discoverProjects(config, {
        includeArchived: true,
      });
      const projectMap = new Map(projects.map((p) => [p.slug, p]));

      // Validate all slugs exist
      const unknown = slugs.filter((s) => !projectMap.has(s));
      if (unknown.length > 0) {
        return {
          content: [
            {
              type: "text",
              text: `Unknown project slugs: ${unknown.join(", ")}`,
            },
          ],
          isError: true,
        };
      }

      // Group slugs by scan dir
      const byDir = new Map<string, { slug: string; order: number }[]>();
      for (let i = 0; i < slugs.length; i++) {
        const project = projectMap.get(slugs[i])!;
        const scanDir = findScanDir(project.path, resolvedDirs);
        if (!scanDir) continue;
        if (!byDir.has(scanDir)) byDir.set(scanDir, []);
        byDir.get(scanDir)!.push({ slug: slugs[i], order: i });
      }

      // Update each portfolio file
      for (const [scanDir, entries] of byDir) {
        const portfolio = await loadPortfolio(scanDir);
        for (const { slug, order } of entries) {
          if (!portfolio.projects[slug]) {
            portfolio.projects[slug] = {
              status: "active",
              order,
              cadence: null,
              dormant_until: null,
            };
          } else {
            portfolio.projects[slug].order = order;
          }
        }
        await savePortfolio(scanDir, portfolio);
      }

      return {
        content: [
          {
            type: "text",
            text: `Reordered ${slugs.length} projects`,
          },
        ],
      };
    },
  );

  // -------------------------------------------------------------------------
  // QA tools
  // -------------------------------------------------------------------------

  server.tool(
    "list_qa_pending",
    "List all projects' QA queues with pending/passed/failed/needs-decision/skipped counts. Sorted: most pending first, then most recently updated.",
    {},
    async () => {
      const config = await loadConfig();
      const projects = await discoverProjects(config);
      const summaries: Record<string, unknown>[] = [];

      for (const project of projects) {
        if (!project.qaPath) continue;
        let raw: string;
        try {
          raw = await readFile(project.qaPath, "utf-8");
        } catch {
          continue;
        }
        const parsed = parseQa(raw, project.qaPath);
        if (!parsed.success) continue;

        const counts = {
          pending: 0,
          passed: 0,
          failed: 0,
          needsDecision: 0,
          skipped: 0,
        };
        for (const item of parsed.data.items) {
          if (item.status === "pending") counts.pending++;
          else if (item.status === "passed") counts.passed++;
          else if (item.status === "failed") counts.failed++;
          else if (item.status === "needs-decision") counts.needsDecision++;
          else if (item.status === "skipped") counts.skipped++;
        }

        summaries.push({
          slug: project.slug,
          name: project.name,
          lastUpdated: parsed.data.last_updated,
          hasRoadmap: project.roadmapPath !== null,
          total: parsed.data.items.length,
          ...counts,
        });
      }

      summaries.sort((left, right) => {
        const leftPending = (left.pending as number) ?? 0;
        const rightPending = (right.pending as number) ?? 0;
        if (leftPending !== rightPending) return rightPending - leftPending;
        const leftLU = (left.lastUpdated as string) ?? "";
        const rightLU = (right.lastUpdated as string) ?? "";
        return rightLU.localeCompare(leftLU);
      });

      return {
        content: [{ type: "text", text: JSON.stringify(summaries, null, 2) }],
      };
    },
  );

  server.tool(
    "get_qa_for_project",
    "Get the full QA.md content for a single project, including setup block and all items with their status, timestamps, roadmap refs, and notes.",
    { slug: z.string().describe("Project slug") },
    async ({ slug }) => {
      const project = await resolveProject(slug);
      if (!project?.qaPath) {
        return {
          content: [
            {
              type: "text",
              text: `Project "${slug}" not found or has no QA.md`,
            },
          ],
          isError: true,
        };
      }

      const raw = await readFile(project.qaPath, "utf-8");
      const parsed = parseQa(raw, project.qaPath);
      if (!parsed.success) {
        return {
          content: [{ type: "text", text: "Failed to parse QA.md" }],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                project: parsed.data.project,
                lastUpdated: parsed.data.last_updated,
                hasRoadmap: project.roadmapPath !== null,
                setup: parsed.data.setup,
                items: parsed.data.items,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.tool(
    "next_qa_item",
    "Return the next pending QA item for a project (the one a focus-mode session should land on). Returns null when no pending items remain.",
    { slug: z.string().describe("Project slug") },
    async ({ slug }) => {
      const project = await resolveProject(slug);
      if (!project?.qaPath) {
        return {
          content: [
            {
              type: "text",
              text: `Project "${slug}" not found or has no QA.md`,
            },
          ],
          isError: true,
        };
      }

      const raw = await readFile(project.qaPath, "utf-8");
      const parsed = parseQa(raw, project.qaPath);
      if (!parsed.success) {
        return {
          content: [{ type: "text", text: "Failed to parse QA.md" }],
          isError: true,
        };
      }

      const next = parsed.data.items.find((item) => item.status === "pending");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              next
                ? {
                    id: next.id,
                    description: next.description,
                    setup: parsed.data.setup,
                  }
                : null,
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.tool(
    "approve_qa_item",
    "Approve a pending QA item (pending -> passed). Stamps the current timestamp.",
    {
      slug: z.string().describe("Project slug"),
      itemId: z.string().describe("QA item ID (q_xxxxx)"),
    },
    async ({ slug, itemId }) => {
      const project = await resolveProject(slug);
      if (!project?.qaPath) {
        return {
          content: [
            {
              type: "text",
              text: `Project "${slug}" not found or has no QA.md`,
            },
          ],
          isError: true,
        };
      }

      const raw = await readFile(project.qaPath, "utf-8");
      const parsed = parseQa(raw, project.qaPath);
      if (!parsed.success) {
        return {
          content: [{ type: "text", text: "Failed to parse QA.md" }],
          isError: true,
        };
      }

      const item = parsed.data.items.find((qaItem) => qaItem.id === itemId);
      if (!item) {
        return {
          content: [{ type: "text", text: `QA item "${itemId}" not found` }],
          isError: true,
        };
      }
      if (item.status !== "pending") {
        return {
          content: [
            {
              type: "text",
              text: `QA item "${itemId}" is ${item.status}, not pending`,
            },
          ],
          isError: true,
        };
      }

      item.status = "passed";
      item.at = nowIso();

      const writeResult = await writeQaFile(
        project.qaPath,
        parsed.data,
        parsed.preserved,
      );
      if (!writeResult.success) {
        return {
          content: [{ type: "text", text: "Failed to write QA.md" }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text", text: `Approved ${itemId}` }],
      };
    },
  );

  server.tool(
    "fail_qa_item",
    "Fail a pending QA item (pending -> failed). Files a roadmap issue in the 'QA Issues' category (auto-created if missing) and links the new r_xxxxx back to this QA item via roadmapRef. Note becomes both the QA blockquote and the roadmap issue body.",
    {
      slug: z.string().describe("Project slug"),
      itemId: z.string().describe("QA item ID (q_xxxxx)"),
      note: z
        .string()
        .min(1)
        .describe("Required note describing what went wrong"),
    },
    async ({ slug, itemId, note }) => {
      const trimmedNote = note.trim();
      if (!trimmedNote) {
        return {
          content: [{ type: "text", text: "Note is required and non-empty" }],
          isError: true,
        };
      }

      const project = await resolveProject(slug);
      if (!project?.qaPath) {
        return {
          content: [
            {
              type: "text",
              text: `Project "${slug}" not found or has no QA.md`,
            },
          ],
          isError: true,
        };
      }
      if (!project.roadmapPath) {
        return {
          content: [
            {
              type: "text",
              text: `Project "${slug}" has no ROADMAP.md to record the issue`,
            },
          ],
          isError: true,
        };
      }

      const qaRaw = await readFile(project.qaPath, "utf-8");
      const qaParsed = parseQa(qaRaw, project.qaPath);
      if (!qaParsed.success) {
        return {
          content: [{ type: "text", text: "Failed to parse QA.md" }],
          isError: true,
        };
      }

      const item = qaParsed.data.items.find((qaItem) => qaItem.id === itemId);
      if (!item) {
        return {
          content: [{ type: "text", text: `QA item "${itemId}" not found` }],
          isError: true,
        };
      }
      if (item.status !== "pending") {
        return {
          content: [
            {
              type: "text",
              text: `QA item "${itemId}" is ${item.status}, not pending`,
            },
          ],
          isError: true,
        };
      }

      // 1. File the roadmap issue
      const roadmapRaw = await readFile(project.roadmapPath, "utf-8");
      const roadmapParsed = parseRoadmap(roadmapRaw, project.roadmapPath);
      if (!roadmapParsed.success) {
        return {
          content: [{ type: "text", text: "Failed to parse ROADMAP.md" }],
          isError: true,
        };
      }

      let qaCategory = roadmapParsed.data.categories.find(
        (cat) => cat.slug === QA_ISSUE_CATEGORY_SLUG,
      );
      if (!qaCategory) {
        qaCategory = {
          title: QA_ISSUE_CATEGORY_TITLE,
          slug: generateCategorySlug(QA_ISSUE_CATEGORY_TITLE),
          items: [],
        };
        roadmapParsed.data.categories.push(qaCategory);
      }

      const roadmapItemId = generateRoadmapId();
      qaCategory.items.push({
        id: roadmapItemId,
        status: "planned",
        name: item.description,
        description: `${trimmedNote}\n\n*From QA item: ${item.id} in ${qaParsed.data.project}*`,
      });

      const roadmapWrite = await writeRoadmapFile(
        project.roadmapPath,
        roadmapParsed.data,
        roadmapParsed.preserved,
      );
      if (!roadmapWrite.success) {
        return {
          content: [{ type: "text", text: "Failed to write ROADMAP.md" }],
          isError: true,
        };
      }

      // 2. Update the QA item
      item.status = "failed";
      item.at = nowIso();
      item.roadmapRef = roadmapItemId;
      item.note = trimmedNote;

      const qaWrite = await writeQaFile(
        project.qaPath,
        qaParsed.data,
        qaParsed.preserved,
      );
      if (!qaWrite.success) {
        return {
          content: [
            {
              type: "text",
              text: `Roadmap issue ${roadmapItemId} filed but failed to update QA.md`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ qaItemId: itemId, roadmapItemId }, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    "skip_qa_item",
    "Skip a pending QA item (pending -> skipped). Note is optional.",
    {
      slug: z.string().describe("Project slug"),
      itemId: z.string().describe("QA item ID (q_xxxxx)"),
      note: z
        .string()
        .optional()
        .describe("Optional note about why the item was skipped"),
    },
    async ({ slug, itemId, note }) => {
      const project = await resolveProject(slug);
      if (!project?.qaPath) {
        return {
          content: [
            {
              type: "text",
              text: `Project "${slug}" not found or has no QA.md`,
            },
          ],
          isError: true,
        };
      }

      const raw = await readFile(project.qaPath, "utf-8");
      const parsed = parseQa(raw, project.qaPath);
      if (!parsed.success) {
        return {
          content: [{ type: "text", text: "Failed to parse QA.md" }],
          isError: true,
        };
      }

      const item = parsed.data.items.find((qaItem) => qaItem.id === itemId);
      if (!item) {
        return {
          content: [{ type: "text", text: `QA item "${itemId}" not found` }],
          isError: true,
        };
      }
      if (item.status !== "pending") {
        return {
          content: [
            {
              type: "text",
              text: `QA item "${itemId}" is ${item.status}, not pending`,
            },
          ],
          isError: true,
        };
      }

      item.status = "skipped";
      item.at = nowIso();
      if (note?.trim()) item.note = note.trim();

      const writeResult = await writeQaFile(
        project.qaPath,
        parsed.data,
        parsed.preserved,
      );
      if (!writeResult.success) {
        return {
          content: [{ type: "text", text: "Failed to write QA.md" }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text", text: `Skipped ${itemId}` }],
      };
    },
  );

  server.tool(
    "mark_qa_needs_decision",
    "Mark a pending QA item as needs-decision (pending -> needs-decision). Note is required and explains what design conversation is needed.",
    {
      slug: z.string().describe("Project slug"),
      itemId: z.string().describe("QA item ID (q_xxxxx)"),
      note: z
        .string()
        .min(1)
        .describe("Required note explaining what decision is needed"),
    },
    async ({ slug, itemId, note }) => {
      const trimmedNote = note.trim();
      if (!trimmedNote) {
        return {
          content: [{ type: "text", text: "Note is required and non-empty" }],
          isError: true,
        };
      }

      const project = await resolveProject(slug);
      if (!project?.qaPath) {
        return {
          content: [
            {
              type: "text",
              text: `Project "${slug}" not found or has no QA.md`,
            },
          ],
          isError: true,
        };
      }

      const raw = await readFile(project.qaPath, "utf-8");
      const parsed = parseQa(raw, project.qaPath);
      if (!parsed.success) {
        return {
          content: [{ type: "text", text: "Failed to parse QA.md" }],
          isError: true,
        };
      }

      const item = parsed.data.items.find((qaItem) => qaItem.id === itemId);
      if (!item) {
        return {
          content: [{ type: "text", text: `QA item "${itemId}" not found` }],
          isError: true,
        };
      }
      if (item.status !== "pending") {
        return {
          content: [
            {
              type: "text",
              text: `QA item "${itemId}" is ${item.status}, not pending`,
            },
          ],
          isError: true,
        };
      }

      item.status = "needs-decision";
      item.at = nowIso();
      item.note = trimmedNote;

      const writeResult = await writeQaFile(
        project.qaPath,
        parsed.data,
        parsed.preserved,
      );
      if (!writeResult.success) {
        return {
          content: [{ type: "text", text: "Failed to write QA.md" }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text", text: `Marked ${itemId} as needs-decision` }],
      };
    },
  );

  server.tool(
    "reset_qa_item",
    "Reset a non-pending QA item back to pending. Clears at, roadmapRef, and note. Idempotent: a no-op on already-pending items. The linked roadmap issue (if any) is NOT deleted -- handle that separately.",
    {
      slug: z.string().describe("Project slug"),
      itemId: z.string().describe("QA item ID (q_xxxxx)"),
    },
    async ({ slug, itemId }) => {
      const project = await resolveProject(slug);
      if (!project?.qaPath) {
        return {
          content: [
            {
              type: "text",
              text: `Project "${slug}" not found or has no QA.md`,
            },
          ],
          isError: true,
        };
      }

      const raw = await readFile(project.qaPath, "utf-8");
      const parsed = parseQa(raw, project.qaPath);
      if (!parsed.success) {
        return {
          content: [{ type: "text", text: "Failed to parse QA.md" }],
          isError: true,
        };
      }

      const item: QaItem | undefined = parsed.data.items.find(
        (qaItem) => qaItem.id === itemId,
      );
      if (!item) {
        return {
          content: [{ type: "text", text: `QA item "${itemId}" not found` }],
          isError: true,
        };
      }

      if (item.status === "pending") {
        return {
          content: [
            { type: "text", text: `QA item "${itemId}" is already pending` },
          ],
        };
      }

      item.status = "pending";
      delete item.at;
      delete item.roadmapRef;
      delete item.note;

      const writeResult = await writeQaFile(
        project.qaPath,
        parsed.data,
        parsed.preserved,
      );
      if (!writeResult.success) {
        return {
          content: [{ type: "text", text: "Failed to write QA.md" }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text", text: `Reset ${itemId} to pending` }],
      };
    },
  );

  // -------------------------------------------------------------------------
  // Today's Directions tools
  // -------------------------------------------------------------------------

  server.tool(
    "get_today_directions",
    "Read the portfolio-level TODAYS_DIRECTIONS.md file. Returns the parsed frontmatter (schema, generated, for_date), the raw body markdown, the resolved file path, and the list of QA checkbox refs found in the body (each with qaId, slug, checked, description). Returns null when the file does not exist.",
    {},
    async () => {
      const directions = await getTodayDirections();
      return {
        content: [{ type: "text", text: JSON.stringify(directions, null, 2) }],
      };
    },
  );

  server.tool(
    "list_sessions_today",
    "List projects with an in-progress session whose last_updated falls on the local calendar date today. Each entry includes slug, name, sessionId, status, lastUpdated, and a workingOn line extracted from the session's currentStatus. Used by the Today's Directions agent to know which sessions to surface.",
    {},
    async () => {
      const config = await loadConfig();
      const projects = await discoverProjects(config);
      const now = new Date();
      const out: Record<string, unknown>[] = [];

      for (const project of projects) {
        if (!project.sessionPath) continue;
        let raw: string;
        try {
          raw = await readFile(project.sessionPath, "utf-8");
        } catch {
          continue;
        }
        const parsed = parseSession(raw, project.sessionPath);
        if (!parsed.success) continue;

        const session = parsed.data;
        const updated = new Date(session.last_updated);
        const sameDay =
          updated.getFullYear() === now.getFullYear() &&
          updated.getMonth() === now.getMonth() &&
          updated.getDate() === now.getDate();
        if (!sameDay) continue;

        const workingOnMatch = session.currentStatus.match(
          /\*{0,2}Working on:\*{0,2}\s*(.+)/i,
        );
        const workingOn = workingOnMatch ? workingOnMatch[1].trim() : null;

        out.push({
          slug: project.slug,
          name: project.name,
          sessionId: session.session_id,
          status: session.status,
          lastUpdated: session.last_updated,
          workingOn,
        });
      }

      return {
        content: [{ type: "text", text: JSON.stringify(out, null, 2) }],
      };
    },
  );

  server.tool(
    "list_top_pending_qa",
    "List pending QA items across the portfolio as a flat array, ordered by per-project pending-count desc then most-recent updated. Each item exposes qaId, slug, projectName, description — the exact fields needed to build a TODAYS_DIRECTIONS.md QA section's `<!-- ref:q_xxxxx slug:project -->` markers verbatim.",
    {
      limit: z
        .number()
        .int()
        .positive()
        .max(50)
        .optional()
        .describe("Maximum items to return (default 10, max 50)"),
    },
    async ({ limit }) => {
      const max = limit ?? 10;
      const config = await loadConfig();
      const projects = await discoverProjects(config);

      type Card = {
        slug: string;
        projectName: string;
        lastUpdated: string;
        pending: { id: string; description: string }[];
      };
      const cards: Card[] = [];
      for (const project of projects) {
        if (!project.qaPath) continue;
        let raw: string;
        try {
          raw = await readFile(project.qaPath, "utf-8");
        } catch {
          continue;
        }
        const parsed = parseQa(raw, project.qaPath);
        if (!parsed.success) continue;

        const pending = parsed.data.items
          .filter((item) => item.status === "pending")
          .map((item) => ({ id: item.id, description: item.description }));
        if (pending.length === 0) continue;

        cards.push({
          slug: project.slug,
          projectName: project.name,
          lastUpdated: parsed.data.last_updated,
          pending,
        });
      }

      cards.sort((left, right) => {
        if (left.pending.length !== right.pending.length) {
          return right.pending.length - left.pending.length;
        }
        return right.lastUpdated.localeCompare(left.lastUpdated);
      });

      const out: Record<string, unknown>[] = [];
      for (const card of cards) {
        for (const item of card.pending) {
          out.push({
            qaId: item.id,
            slug: card.slug,
            projectName: card.projectName,
            description: item.description,
          });
          if (out.length >= max) {
            return {
              content: [{ type: "text", text: JSON.stringify(out, null, 2) }],
            };
          }
        }
      }

      return {
        content: [{ type: "text", text: JSON.stringify(out, null, 2) }],
      };
    },
  );

  return server;
}

export { createServer };
