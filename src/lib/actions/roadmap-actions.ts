"use server";

/**
 * Server actions for roadmap CRUD operations.
 *
 * All actions follow the read-parse-mutate-write pattern:
 * 1. Validate inputs (fast-fail before I/O)
 * 2. Resolve roadmap file via slug + discovery (safe path resolution)
 * 3. Read + parse roadmap file
 * 4. Mutate data
 * 5. Write atomically with preserved content for round-trip fidelity
 * 6. Revalidate Next.js cache
 */

import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { revalidatePath } from "next/cache";
import { loadConfig } from "@/lib/config";
import { discoverProjects, parseRoadmap, writeRoadmapFile } from "@/lib/fs";
import type { RoadmapFile, RoadmapCategory } from "@/lib/schemas/roadmap";
import { RoadmapStatus } from "@/lib/schemas/roadmap";
import type { Result } from "@/lib/schemas/shared";
import type { RoadmapParseResult } from "@/lib/fs/types";
import {
  generateRoadmapId,
  generateCategorySlug,
} from "@/lib/utils/generate-id";

// --- Shared helper ---

/**
 * Resolve a roadmap file by project slug.
 * Extracts the common boilerplate (loadConfig, discoverProjects, find by basename,
 * readFile, parseRoadmap) into a reusable function.
 */
async function resolveRoadmap(
  slug: string,
): Promise<
  Result<{ filePath: string; data: RoadmapFile; preserved: RoadmapParseResult }>
> {
  const config = await loadConfig();
  const projects = await discoverProjects(config);
  const project = projects.find((p) => basename(p.path) === slug);
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

// --- Server actions ---

/**
 * Add a new roadmap item to a category.
 *
 * @param slug - Project slug (directory basename)
 * @param categorySlug - Target category slug
 * @param input - Item data: name, description, status
 * @returns Result with generated item ID on success
 */
export async function addRoadmapItem(
  slug: string,
  categorySlug: string,
  input: { name: string; description: string; status: string },
): Promise<Result<{ id: string }>> {
  // Validate name is non-empty
  if (!input.name.trim()) {
    return {
      success: false,
      errors: [
        {
          field: "name",
          message: "Name must not be empty",
          received: input.name,
        },
      ],
    };
  }

  // Validate status against RoadmapStatus enum
  const statusParsed = RoadmapStatus.safeParse(input.status);
  if (!statusParsed.success) {
    return {
      success: false,
      errors: [
        {
          field: "status",
          message: "Invalid status",
          received: input.status,
        },
      ],
    };
  }

  // Resolve roadmap
  const resolved = await resolveRoadmap(slug);
  if (!resolved.success) return resolved;

  const { filePath, data, preserved } = resolved.data;

  // Find target category
  const category = data.categories.find((c) => c.slug === categorySlug);
  if (!category) {
    return {
      success: false,
      errors: [
        {
          field: "categorySlug",
          message: "Category not found",
          received: categorySlug,
        },
      ],
    };
  }

  // Generate ID and build new item
  const id = generateRoadmapId();
  const newItem: Record<string, unknown> = {
    id,
    name: input.name.trim(),
    description: input.description.trim(),
    status: statusParsed.data,
  };

  // Auto-set dates based on status
  if (statusParsed.data === "in-progress") {
    newItem.started = today();
  }
  if (statusParsed.data === "done") {
    newItem.completed = today();
  }

  // Append to category
  category.items.push(newItem as RoadmapCategory["items"][number]);

  // Write atomically with preserved content
  const writeResult = await writeRoadmapFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidatePath(`/project/${slug}/roadmap`);

  return { success: true, data: { id } };
}

/**
 * Update an existing roadmap item's fields.
 *
 * @param slug - Project slug (directory basename)
 * @param itemId - ID of the item to update
 * @param updates - Partial fields to update (name, description, status, categorySlug for move)
 * @returns Result<void>
 */
export async function updateRoadmapItem(
  slug: string,
  itemId: string,
  updates: {
    name?: string;
    description?: string;
    status?: string;
    categorySlug?: string;
  },
): Promise<Result<void>> {
  // Resolve roadmap
  const resolved = await resolveRoadmap(slug);
  if (!resolved.success) return resolved;

  const { filePath, data, preserved } = resolved.data;

  // Find item across all categories
  let sourceCategory: RoadmapCategory | undefined;
  let item: RoadmapCategory["items"][number] | undefined;

  for (const cat of data.categories) {
    const found = cat.items.find((i) => i.id === itemId);
    if (found) {
      sourceCategory = cat;
      item = found;
      break;
    }
  }

  if (!item || !sourceCategory) {
    return {
      success: false,
      errors: [
        {
          field: "itemId",
          message: "Item not found",
          received: itemId,
        },
      ],
    };
  }

  // Apply field updates
  if (updates.name !== undefined) {
    item.name = updates.name.trim();
  }
  if (updates.description !== undefined) {
    item.description = updates.description.trim();
  }
  if (updates.status !== undefined) {
    const statusParsed = RoadmapStatus.safeParse(updates.status);
    if (!statusParsed.success) {
      return {
        success: false,
        errors: [
          {
            field: "status",
            message: "Invalid status",
            received: updates.status,
          },
        ],
      };
    }

    // Auto-set dates on status transitions
    if (statusParsed.data === "in-progress" && !item.started) {
      item.started = today();
    }
    if (statusParsed.data === "done" && !item.completed) {
      item.completed = today();
    }

    item.status = statusParsed.data;
  }

  // Move item to a different category if categorySlug provided
  if (updates.categorySlug && updates.categorySlug !== sourceCategory.slug) {
    const targetCategory = data.categories.find(
      (c) => c.slug === updates.categorySlug,
    );
    if (!targetCategory) {
      return {
        success: false,
        errors: [
          {
            field: "categorySlug",
            message: "Target category not found",
            received: updates.categorySlug,
          },
        ],
      };
    }

    // Remove from source
    const idx = sourceCategory.items.findIndex((i) => i.id === itemId);
    sourceCategory.items.splice(idx, 1);

    // Add to target
    targetCategory.items.push(item);
  }

  // Write atomically with preserved content
  const writeResult = await writeRoadmapFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidatePath(`/project/${slug}/roadmap`);

  return { success: true, data: undefined };
}

/**
 * Delete a roadmap item by ID.
 *
 * @param slug - Project slug (directory basename)
 * @param itemId - ID of the item to delete (must start with "r_")
 * @returns Result<void>
 */
export async function deleteRoadmapItem(
  slug: string,
  itemId: string,
): Promise<Result<void>> {
  // Validate item ID format
  if (!itemId.startsWith("r_")) {
    return {
      success: false,
      errors: [
        {
          field: "itemId",
          message: "Item ID must start with r_",
          received: itemId,
        },
      ],
    };
  }

  // Resolve roadmap
  const resolved = await resolveRoadmap(slug);
  if (!resolved.success) return resolved;

  const { filePath, data, preserved } = resolved.data;

  // Find and remove item from its category
  let found = false;
  for (const cat of data.categories) {
    const idx = cat.items.findIndex((i) => i.id === itemId);
    if (idx !== -1) {
      cat.items.splice(idx, 1);
      found = true;
      break;
    }
  }

  if (!found) {
    return {
      success: false,
      errors: [
        {
          field: "itemId",
          message: "Item not found",
          received: itemId,
        },
      ],
    };
  }

  // Write atomically with preserved content
  const writeResult = await writeRoadmapFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidatePath(`/project/${slug}/roadmap`);

  return { success: true, data: undefined };
}

/**
 * Reorder items within a category.
 *
 * @param slug - Project slug (directory basename)
 * @param categorySlug - Category to reorder
 * @param orderedItemIds - Array of item IDs in desired order
 * @returns Result<void>
 */
export async function reorderRoadmapItems(
  slug: string,
  categorySlug: string,
  orderedItemIds: string[],
): Promise<Result<void>> {
  // Resolve roadmap
  const resolved = await resolveRoadmap(slug);
  if (!resolved.success) return resolved;

  const { filePath, data, preserved } = resolved.data;

  // Find category
  const category = data.categories.find((c) => c.slug === categorySlug);
  if (!category) {
    return {
      success: false,
      errors: [
        {
          field: "categorySlug",
          message: "Category not found",
          received: categorySlug,
        },
      ],
    };
  }

  // Validate count matches
  if (orderedItemIds.length !== category.items.length) {
    return {
      success: false,
      errors: [
        {
          field: "orderedItemIds",
          message: `Expected ${category.items.length} IDs, got ${orderedItemIds.length}`,
          received: orderedItemIds,
        },
      ],
    };
  }

  // Validate all IDs exist in category
  const itemMap = new Map(category.items.map((item) => [item.id, item]));
  for (const id of orderedItemIds) {
    if (!itemMap.has(id)) {
      return {
        success: false,
        errors: [
          {
            field: "orderedItemIds",
            message: `Item ${id} not found in category`,
            received: orderedItemIds,
          },
        ],
      };
    }
  }

  // Reorder items to match provided ID order
  category.items = orderedItemIds.map((id) => itemMap.get(id)!);

  // Write atomically with preserved content
  const writeResult = await writeRoadmapFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidatePath(`/project/${slug}/roadmap`);

  return { success: true, data: undefined };
}

/**
 * Add a new empty category to the roadmap.
 *
 * @param slug - Project slug (directory basename)
 * @param title - Category title (will be trimmed)
 * @returns Result with generated category slug on success
 */
export async function addRoadmapCategory(
  slug: string,
  title: string,
): Promise<Result<{ slug: string }>> {
  // Validate title is non-empty
  if (!title.trim()) {
    return {
      success: false,
      errors: [
        {
          field: "title",
          message: "Title must not be empty",
          received: title,
        },
      ],
    };
  }

  // Resolve roadmap
  const resolved = await resolveRoadmap(slug);
  if (!resolved.success) return resolved;

  const { filePath, data, preserved } = resolved.data;

  // Generate slug from title
  const categorySlug = generateCategorySlug(title);

  // Check for duplicate slug
  if (data.categories.some((c) => c.slug === categorySlug)) {
    return {
      success: false,
      errors: [
        {
          field: "slug",
          message: "Category with this slug already exists",
          received: categorySlug,
        },
      ],
    };
  }

  // Add new category
  data.categories.push({
    title: title.trim(),
    slug: categorySlug,
    items: [],
  });

  // Write atomically with preserved content
  const writeResult = await writeRoadmapFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidatePath(`/project/${slug}/roadmap`);

  return { success: true, data: { slug: categorySlug } };
}

/**
 * Delete a category and all its items.
 *
 * @param slug - Project slug (directory basename)
 * @param categorySlug - Slug of the category to delete
 * @returns Result<void>
 */
export async function deleteRoadmapCategory(
  slug: string,
  categorySlug: string,
): Promise<Result<void>> {
  // Resolve roadmap
  const resolved = await resolveRoadmap(slug);
  if (!resolved.success) return resolved;

  const { filePath, data, preserved } = resolved.data;

  // Find category
  const idx = data.categories.findIndex((c) => c.slug === categorySlug);
  if (idx === -1) {
    return {
      success: false,
      errors: [
        {
          field: "categorySlug",
          message: "Category not found",
          received: categorySlug,
        },
      ],
    };
  }

  // Remove category
  data.categories.splice(idx, 1);

  // Write atomically with preserved content
  const writeResult = await writeRoadmapFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidatePath(`/project/${slug}/roadmap`);

  return { success: true, data: undefined };
}
