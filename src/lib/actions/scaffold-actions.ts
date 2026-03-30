"use server";

/**
 * Server action for scaffolding a new project from an idea.
 *
 * Creates a project directory with compliant ROADMAP.md, optional
 * SESSION_PROGRESS.md, CLAUDE.md, README.md, and .claude/settings.local.json.
 * Then updates the source idea to status="started" with path=slug.
 */

import { mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { revalidatePath } from "next/cache";
import { loadConfig } from "@/lib/config";
import {
  slugify,
  discoverProjects,
  writeRoadmapFile,
  writeSessionFile,
  atomicWriteFile,
} from "@/lib/fs";
import { expandTilde } from "@/lib/fs/discovery";
import { parseIdeas, writeIdeasFile } from "@/lib/fs";
import type { RoadmapFile, RoadmapItem } from "@/lib/schemas/roadmap";
import type { SessionFile } from "@/lib/schemas/session";
import type { Result } from "@/lib/schemas/shared";
import { generateRoadmapId } from "@/lib/utils/generate-id";
import type {
  TemplateCategory,
  TemplateStarterItem,
} from "@/lib/templates/project-templates";
import {
  generateReadme,
  generateClaudeMd,
  generateClaudeSettings,
} from "@/lib/templates/scaffold-files";
import { readFile } from "node:fs/promises";

export interface CreateProjectInput {
  ideaId: string;
  projectName: string;
  targetDir: string;
  directoryName: string;
  description: string;
  templateId: string;
  categories: TemplateCategory[];
  starterItems: TemplateStarterItem[];
  stack: string[];
  createSession: boolean;
}

/** Get today's date in YYYY-MM-DD format. */
function today(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Create a new project directory from an idea.
 *
 * Scaffolds compliant files, then updates the idea to link to the new project.
 */
export async function createProjectFromIdea(
  input: CreateProjectInput,
): Promise<Result<{ slug: string; projectPath: string }>> {
  // --- Validate inputs ---

  if (!input.projectName.trim()) {
    return {
      success: false,
      errors: [
        {
          field: "projectName",
          message: "Project name is required",
          received: input.projectName,
        },
      ],
    };
  }

  if (!input.directoryName.trim()) {
    return {
      success: false,
      errors: [
        {
          field: "directoryName",
          message: "Directory name is required",
          received: input.directoryName,
        },
      ],
    };
  }

  const config = await loadConfig();

  // Verify targetDir is in scan_dirs
  const expandedScanDirs = config.scan_dirs.map(expandTilde);
  const expandedTarget = expandTilde(input.targetDir);
  if (!expandedScanDirs.includes(expandedTarget)) {
    return {
      success: false,
      errors: [
        {
          field: "targetDir",
          message: "Target directory is not in configured scan directories",
          received: input.targetDir,
        },
      ],
    };
  }

  const projectPath = join(expandedTarget, input.directoryName);
  const slug = slugify(input.projectName);

  // Check directory doesn't already exist
  try {
    await stat(projectPath);
    return {
      success: false,
      errors: [
        {
          field: "directoryName",
          message: "Directory already exists",
          received: projectPath,
        },
      ],
    };
  } catch {
    // Expected: directory doesn't exist
  }

  // Check slug uniqueness
  const existingProjects = await discoverProjects(config);
  if (existingProjects.some((p) => p.slug === slug)) {
    return {
      success: false,
      errors: [
        {
          field: "projectName",
          message: "A project with this slug already exists",
          received: slug,
        },
      ],
    };
  }

  // --- Create directory structure ---

  try {
    await mkdir(projectPath, { recursive: true });
    await mkdir(join(projectPath, ".claude"), { recursive: true });
  } catch (err) {
    return {
      success: false,
      errors: [
        {
          field: "directoryName",
          message: `Failed to create directory: ${err instanceof Error ? err.message : String(err)}`,
          received: projectPath,
        },
      ],
    };
  }

  // --- Build and write ROADMAP.md ---

  const roadmapCategories = input.categories.map((cat) => ({
    title: cat.title,
    slug: cat.slug,
    items: input.starterItems
      .filter((item) => item.categorySlug === cat.slug)
      .map(
        (item): RoadmapItem => ({
          id: generateRoadmapId(),
          status: "planned" as const,
          name: item.name,
          description: item.description,
        }),
      ),
  }));

  const roadmapData: RoadmapFile = {
    schema: "cc-dash/roadmap@1",
    project: input.projectName,
    description: input.description,
    last_updated: new Date().toISOString(),
    categories: roadmapCategories,
    filePath: join(projectPath, "ROADMAP.md"),
  };

  const roadmapResult = await writeRoadmapFile(
    join(projectPath, "ROADMAP.md"),
    roadmapData,
    {},
  );
  if (!roadmapResult.success) return roadmapResult;

  // --- Optionally write SESSION_PROGRESS.md ---

  if (input.createSession) {
    const sessionData: SessionFile = {
      schema: "cc-dash/session@1",
      project: input.projectName,
      session_id: `s_${today()}_initial-setup`,
      started: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      status: "in-progress",
      tasks: [],
      currentStatus: "",
      decisions: [],
      failedAttempts: [],
      completedWork: [],
      filePath: join(projectPath, "SESSION_PROGRESS.md"),
    };

    const sessionResult = await writeSessionFile(
      join(projectPath, "SESSION_PROGRESS.md"),
      sessionData,
      {},
    );
    if (!sessionResult.success) return sessionResult;
  }

  // --- Write plain files ---

  try {
    await atomicWriteFile(
      join(projectPath, "CLAUDE.md"),
      generateClaudeMd(input.projectName, input.description, input.stack),
    );
    await atomicWriteFile(
      join(projectPath, "README.md"),
      generateReadme(input.projectName, input.description),
    );
    await atomicWriteFile(
      join(projectPath, ".claude", "settings.local.json"),
      generateClaudeSettings(),
    );
  } catch (err) {
    return {
      success: false,
      errors: [
        {
          field: "file",
          message: `Failed to write file: ${err instanceof Error ? err.message : String(err)}`,
          received: projectPath,
        },
      ],
    };
  }

  // --- Update the idea ---

  if (config.ideas_file) {
    try {
      const ideasPath = expandTilde(config.ideas_file);
      const raw = await readFile(ideasPath, "utf-8");
      const ideasResult = parseIdeas(raw, ideasPath);

      if (ideasResult.success) {
        const idea = ideasResult.data.ideas.find((i) => i.id === input.ideaId);
        if (idea) {
          idea.status = "started";
          idea.path = slug;

          await writeIdeasFile(
            ideasPath,
            ideasResult.data,
            ideasResult.preserved,
          );
        }
      }
    } catch {
      // Idea update failure is non-fatal — project was already created
    }
  }

  // --- Revalidate ---

  revalidatePath("/", "layout");
  revalidatePath("/ideas");

  return {
    success: true,
    data: { slug, projectPath },
  };
}
