"use server";

/**
 * Server actions for QA.md CRUD operations.
 *
 * Status transitions are one-way (pending -> passed | failed | skipped |
 * needs-decision); use resetQaItem to return an item to pending. Failing
 * an item also files a roadmap issue and cross-links the two via
 * `roadmapRef` on the QA side and an inline `*From QA item: q_xxxxx*`
 * footer on the roadmap side.
 */

import { readFile } from "node:fs/promises";
import { loadConfig } from "@/lib/config";
import {
  discoverProjects,
  parseQa,
  parseRoadmap,
  writeQaFile,
  writeRoadmapFile,
} from "@/lib/fs";
import type { QaFile, QaItem } from "@/lib/schemas/qa";
import type { QaParseResult } from "@/lib/fs/types";
import type { RoadmapCategory } from "@/lib/schemas/roadmap";
import type { Result } from "@/lib/schemas/shared";
import {
  generateRoadmapId,
  generateCategorySlug,
} from "@/lib/utils/generate-id";
import { revalidateQaPaths } from "@/lib/actions/revalidate-helpers";
import type { DiscoveredProject } from "@/lib/fs/discovery";

// --- Constants ---

const QA_ISSUE_CATEGORY_TITLE = "QA Issues";
const QA_ISSUE_CATEGORY_SLUG = "qa-issues";

// --- Helpers ---

async function resolveProject(
  slug: string,
): Promise<Result<DiscoveredProject>> {
  const config = await loadConfig();
  const projects = await discoverProjects(config);
  const project = projects.find((p) => p.slug === slug);
  if (!project) {
    return {
      success: false,
      errors: [
        {
          field: "slug",
          message: "Project not found",
          received: slug,
        },
      ],
    };
  }
  return { success: true, data: project };
}

async function loadQa(
  project: DiscoveredProject,
): Promise<
  Result<{ filePath: string; data: QaFile; preserved: QaParseResult }>
> {
  if (!project.qaPath) {
    return {
      success: false,
      errors: [
        {
          field: "qaPath",
          message: "Project has no QA.md file",
          received: project.slug,
        },
      ],
    };
  }
  const raw = await readFile(project.qaPath, "utf-8");
  const parsed = parseQa(raw, project.qaPath);
  if (!parsed.success) return parsed;
  return {
    success: true,
    data: {
      filePath: project.qaPath,
      data: parsed.data,
      preserved: parsed.preserved,
    },
  };
}

function findItem(qa: QaFile, itemId: string): QaItem | undefined {
  return qa.items.find((item) => item.id === itemId);
}

function nowIso(): string {
  return new Date().toISOString();
}

function notFoundError(itemId: string): Result<never> {
  return {
    success: false,
    errors: [
      {
        field: "itemId",
        message: "QA item not found",
        received: itemId,
      },
    ],
  };
}

function notPendingError(item: QaItem): Result<never> {
  return {
    success: false,
    errors: [
      {
        field: "status",
        message: `QA item is already ${item.status}; reset it before re-marking`,
        received: item.status,
      },
    ],
  };
}

/**
 * File a roadmap issue for a failed QA item.
 *
 * Auto-creates the "QA Issues" category if it does not exist. Builds a
 * roadmap item whose name is the QA description and whose description is
 * the user's note plus a `*From QA item: q_xxxxx in {project}*` footer for
 * back-reference. Returns the new roadmap item ID on success.
 */
async function fileRoadmapIssue(
  roadmapPath: string,
  qaItem: QaItem,
  note: string,
  projectName: string,
): Promise<Result<{ roadmapItemId: string }>> {
  const raw = await readFile(roadmapPath, "utf-8");
  const parsed = parseRoadmap(raw, roadmapPath);
  if (!parsed.success) return parsed;

  const { data, preserved } = parsed;

  let category = data.categories.find(
    (cat) => cat.slug === QA_ISSUE_CATEGORY_SLUG,
  );
  if (!category) {
    category = {
      title: QA_ISSUE_CATEGORY_TITLE,
      slug: generateCategorySlug(QA_ISSUE_CATEGORY_TITLE),
      items: [],
    };
    data.categories.push(category as RoadmapCategory);
  }

  const roadmapItemId = generateRoadmapId();
  const description =
    `${note.trim()}\n\n*From QA item: ${qaItem.id} in ${projectName}*`.trim();

  category.items.push({
    id: roadmapItemId,
    status: "planned",
    name: qaItem.description,
    description,
  });

  const writeResult = await writeRoadmapFile(roadmapPath, data, preserved);
  if (!writeResult.success) return writeResult;

  return { success: true, data: { roadmapItemId } };
}

// --- Server actions ---

/**
 * Approve a pending QA item: pending -> passed.
 */
export async function approveQaItem(
  slug: string,
  itemId: string,
): Promise<Result<void>> {
  const projectResult = await resolveProject(slug);
  if (!projectResult.success) return projectResult;

  const qaResult = await loadQa(projectResult.data);
  if (!qaResult.success) return qaResult;

  const { filePath, data, preserved } = qaResult.data;
  const item = findItem(data, itemId);
  if (!item) return notFoundError(itemId);
  if (item.status !== "pending") return notPendingError(item);

  item.status = "passed";
  item.at = nowIso();

  const writeResult = await writeQaFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidateQaPaths(slug);
  return { success: true, data: undefined };
}

/**
 * Fail a pending QA item: pending -> failed. Files a roadmap issue in the
 * "QA Issues" category (auto-created if missing) and cross-links via
 * `roadmapRef` on the QA item.
 *
 * Requires the project to have a ROADMAP.md. If not, returns an error
 * without mutating either file.
 */
export async function failQaItem(
  slug: string,
  itemId: string,
  note: string,
): Promise<Result<{ roadmapItemId: string }>> {
  if (!note.trim()) {
    return {
      success: false,
      errors: [
        {
          field: "note",
          message: "A note is required when failing a QA item",
          received: note,
        },
      ],
    };
  }

  const projectResult = await resolveProject(slug);
  if (!projectResult.success) return projectResult;
  const project = projectResult.data;

  if (!project.roadmapPath) {
    return {
      success: false,
      errors: [
        {
          field: "roadmapPath",
          message:
            "Cannot fail a QA item without a ROADMAP.md to record the issue",
          received: slug,
        },
      ],
    };
  }

  const qaResult = await loadQa(project);
  if (!qaResult.success) return qaResult;
  const { filePath, data, preserved } = qaResult.data;

  const item = findItem(data, itemId);
  if (!item) return notFoundError(itemId);
  if (item.status !== "pending") return notPendingError(item);

  const issueResult = await fileRoadmapIssue(
    project.roadmapPath,
    item,
    note,
    data.project,
  );
  if (!issueResult.success) return issueResult;

  item.status = "failed";
  item.at = nowIso();
  item.roadmapRef = issueResult.data.roadmapItemId;
  item.note = note.trim();

  const writeResult = await writeQaFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidateQaPaths(slug, true);
  return {
    success: true,
    data: { roadmapItemId: issueResult.data.roadmapItemId },
  };
}

/**
 * Skip a pending QA item: pending -> skipped. Note is optional.
 */
export async function skipQaItem(
  slug: string,
  itemId: string,
  note?: string,
): Promise<Result<void>> {
  const projectResult = await resolveProject(slug);
  if (!projectResult.success) return projectResult;

  const qaResult = await loadQa(projectResult.data);
  if (!qaResult.success) return qaResult;

  const { filePath, data, preserved } = qaResult.data;
  const item = findItem(data, itemId);
  if (!item) return notFoundError(itemId);
  if (item.status !== "pending") return notPendingError(item);

  item.status = "skipped";
  item.at = nowIso();
  if (note?.trim()) {
    item.note = note.trim();
  }

  const writeResult = await writeQaFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidateQaPaths(slug);
  return { success: true, data: undefined };
}

/**
 * Mark a pending QA item as needs-decision: pending -> needs-decision.
 * Note is required because a decision request without context is
 * actionable noise.
 */
export async function markQaNeedsDecision(
  slug: string,
  itemId: string,
  note: string,
): Promise<Result<void>> {
  if (!note.trim()) {
    return {
      success: false,
      errors: [
        {
          field: "note",
          message:
            "A note is required when marking a QA item as needs-decision",
          received: note,
        },
      ],
    };
  }

  const projectResult = await resolveProject(slug);
  if (!projectResult.success) return projectResult;

  const qaResult = await loadQa(projectResult.data);
  if (!qaResult.success) return qaResult;

  const { filePath, data, preserved } = qaResult.data;
  const item = findItem(data, itemId);
  if (!item) return notFoundError(itemId);
  if (item.status !== "pending") return notPendingError(item);

  item.status = "needs-decision";
  item.at = nowIso();
  item.note = note.trim();

  const writeResult = await writeQaFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidateQaPaths(slug);
  return { success: true, data: undefined };
}

/**
 * Reset a QA item back to pending state. Idempotent: resetting an
 * already-pending item succeeds without writing. The roadmap issue
 * created by a prior failQaItem (if any) is *not* deleted -- the user
 * can manage that on the roadmap side.
 */
export async function resetQaItem(
  slug: string,
  itemId: string,
): Promise<Result<void>> {
  const projectResult = await resolveProject(slug);
  if (!projectResult.success) return projectResult;

  const qaResult = await loadQa(projectResult.data);
  if (!qaResult.success) return qaResult;

  const { filePath, data, preserved } = qaResult.data;
  const item = findItem(data, itemId);
  if (!item) return notFoundError(itemId);

  if (item.status === "pending") {
    return { success: true, data: undefined };
  }

  item.status = "pending";
  delete item.at;
  delete item.roadmapRef;
  delete item.note;

  const writeResult = await writeQaFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidateQaPaths(slug);
  return { success: true, data: undefined };
}
