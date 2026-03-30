"use server";

/**
 * Server actions for bulk roadmap operations.
 *
 * All actions follow the read-parse-mutate-write pattern:
 * 1. Validate inputs (fast-fail before I/O)
 * 2. Resolve roadmap file via resolveRoadmap helper
 * 3. Mutate data in-memory across all matching items
 * 4. Write atomically with preserved content
 * 5. Revalidate Next.js cache
 */

import { readFile } from "node:fs/promises";
import { loadConfig } from "@/lib/config";
import { discoverProjects, parseRoadmap, writeRoadmapFile } from "@/lib/fs";
import type { RoadmapFile } from "@/lib/schemas/roadmap";
import { RoadmapStatus } from "@/lib/schemas/roadmap";
import type { Result } from "@/lib/schemas/shared";
import type { RoadmapParseResult } from "@/lib/fs/types";
import { revalidateProjectPaths } from "@/lib/actions/revalidate-helpers";

// --- Shared helper (mirrors roadmap-actions.ts) ---

async function resolveRoadmap(
  slug: string,
): Promise<
  Result<{ filePath: string; data: RoadmapFile; preserved: RoadmapParseResult }>
> {
  const config = await loadConfig();
  const projects = await discoverProjects(config);
  const project = projects.find((p) => p.slug === slug);
  if (!project || !project.roadmapPath) {
    return {
      success: false,
      errors: [
        {
          field: "slug",
          message: "Project not found or has no roadmap file",
          received: slug,
        },
      ],
    };
  }

  const raw = await readFile(project.roadmapPath, "utf-8");
  const result = parseRoadmap(raw, project.roadmapPath);
  if (!result.success) return result;

  return {
    success: true,
    data: {
      filePath: project.roadmapPath,
      data: result.data,
      preserved: result.preserved,
    },
  };
}

/**
 * Get today's date in YYYY-MM-DD format.
 */
function today(): string {
  return new Date().toISOString().split("T")[0];
}

// --- Bulk server actions ---

/**
 * Update the status of multiple roadmap items atomically.
 * Auto-sets started/completed dates on status transitions.
 *
 * @param slug - Project slug
 * @param itemIds - Array of item IDs to update
 * @param status - New status value for all items
 * @returns Result<{ updatedCount: number }>
 */
export async function bulkUpdateStatus(
  slug: string,
  itemIds: string[],
  status: string,
): Promise<Result<{ updatedCount: number }>> {
  // Validate itemIds is non-empty
  if (!itemIds.length) {
    return {
      success: false,
      errors: [
        {
          field: "itemIds",
          message: "At least one item ID is required",
          received: itemIds,
        },
      ],
    };
  }

  // Validate status
  const statusParsed = RoadmapStatus.safeParse(status);
  if (!statusParsed.success) {
    return {
      success: false,
      errors: [
        {
          field: "status",
          message: "Invalid status",
          received: status,
        },
      ],
    };
  }

  // Resolve roadmap
  const resolved = await resolveRoadmap(slug);
  if (!resolved.success) return resolved;

  const { filePath, data, preserved } = resolved.data;

  // Build a set for O(1) lookup
  const idSet = new Set(itemIds);
  let updatedCount = 0;

  for (const cat of data.categories) {
    for (const item of cat.items) {
      if (!idSet.has(item.id)) continue;

      // Auto-set dates on status transitions
      if (statusParsed.data === "in-progress" && !item.started) {
        item.started = today();
      }
      if (statusParsed.data === "done" && !item.completed) {
        item.completed = today();
      }

      item.status = statusParsed.data;
      updatedCount++;
    }
  }

  if (updatedCount === 0) {
    return {
      success: false,
      errors: [
        {
          field: "itemIds",
          message: "None of the provided item IDs were found",
          received: itemIds,
        },
      ],
    };
  }

  const writeResult = await writeRoadmapFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidateProjectPaths(slug, "roadmap");

  return { success: true, data: { updatedCount } };
}

/**
 * Move multiple roadmap items to a different category atomically.
 *
 * @param slug - Project slug
 * @param itemIds - Array of item IDs to move
 * @param targetCategorySlug - Slug of the category to move items into
 * @returns Result<{ movedCount: number }>
 */
export async function bulkMoveToCategory(
  slug: string,
  itemIds: string[],
  targetCategorySlug: string,
): Promise<Result<{ movedCount: number }>> {
  // Validate itemIds is non-empty
  if (!itemIds.length) {
    return {
      success: false,
      errors: [
        {
          field: "itemIds",
          message: "At least one item ID is required",
          received: itemIds,
        },
      ],
    };
  }

  // Validate targetCategorySlug is non-empty
  if (!targetCategorySlug.trim()) {
    return {
      success: false,
      errors: [
        {
          field: "targetCategorySlug",
          message: "Target category slug must not be empty",
          received: targetCategorySlug,
        },
      ],
    };
  }

  // Resolve roadmap
  const resolved = await resolveRoadmap(slug);
  if (!resolved.success) return resolved;

  const { filePath, data, preserved } = resolved.data;

  // Verify target category exists
  const targetCategory = data.categories.find(
    (c) => c.slug === targetCategorySlug,
  );
  if (!targetCategory) {
    return {
      success: false,
      errors: [
        {
          field: "targetCategorySlug",
          message: "Target category not found",
          received: targetCategorySlug,
        },
      ],
    };
  }

  const idSet = new Set(itemIds);
  let movedCount = 0;

  // Collect items to move from their source categories (excluding target category)
  const itemsToMove: (typeof targetCategory.items)[number][] = [];

  for (const cat of data.categories) {
    if (cat.slug === targetCategorySlug) continue;

    const remaining: typeof cat.items = [];
    for (const item of cat.items) {
      if (idSet.has(item.id)) {
        itemsToMove.push(item);
        movedCount++;
      } else {
        remaining.push(item);
      }
    }
    cat.items = remaining;
  }

  if (movedCount === 0) {
    return {
      success: false,
      errors: [
        {
          field: "itemIds",
          message:
            "None of the provided item IDs were found outside the target category",
          received: itemIds,
        },
      ],
    };
  }

  // Append moved items to target category
  targetCategory.items.push(...itemsToMove);

  const writeResult = await writeRoadmapFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidateProjectPaths(slug, "roadmap");

  return { success: true, data: { movedCount } };
}

/**
 * Delete multiple roadmap items atomically.
 *
 * @param slug - Project slug
 * @param itemIds - Array of item IDs to delete (all must start with "r_")
 * @returns Result<{ deletedCount: number }>
 */
export async function bulkDeleteItems(
  slug: string,
  itemIds: string[],
): Promise<Result<{ deletedCount: number }>> {
  // Validate itemIds is non-empty
  if (!itemIds.length) {
    return {
      success: false,
      errors: [
        {
          field: "itemIds",
          message: "At least one item ID is required",
          received: itemIds,
        },
      ],
    };
  }

  // Validate all IDs have correct format
  const invalidIds = itemIds.filter((id) => !id.startsWith("r_"));
  if (invalidIds.length > 0) {
    return {
      success: false,
      errors: [
        {
          field: "itemIds",
          message: "All item IDs must start with r_",
          received: invalidIds,
        },
      ],
    };
  }

  // Resolve roadmap
  const resolved = await resolveRoadmap(slug);
  if (!resolved.success) return resolved;

  const { filePath, data, preserved } = resolved.data;

  const idSet = new Set(itemIds);

  // Snapshot which IDs exist before deletion
  const existingIds = new Set(
    data.categories.flatMap((c) => c.items.map((i) => i.id)),
  );

  // Remove matching items from all categories
  for (const cat of data.categories) {
    cat.items = cat.items.filter((item) => !idSet.has(item.id));
  }

  // Count how many were actually deleted
  const deletedCount = itemIds.filter((id) => existingIds.has(id)).length;

  if (deletedCount === 0) {
    return {
      success: false,
      errors: [
        {
          field: "itemIds",
          message: "None of the provided item IDs were found",
          received: itemIds,
        },
      ],
    };
  }

  const writeResult = await writeRoadmapFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidateProjectPaths(slug, "roadmap");

  return { success: true, data: { deletedCount } };
}
