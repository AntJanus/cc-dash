"use server";

/**
 * Server actions for session CRUD operations.
 *
 * All actions follow the read-parse-mutate-write pattern:
 * 1. Validate inputs (fast-fail before I/O)
 * 2. Resolve session file via slug + discovery (safe path resolution)
 * 3. Read + parse session file
 * 4. Mutate data
 * 5. Write atomically with preserved content for round-trip fidelity
 * 6. Revalidate Next.js cache
 */

import { readFile } from "node:fs/promises";
import { loadConfig } from "@/lib/config";
import { discoverProjects, parseSession, writeSessionFile } from "@/lib/fs";
import type { SessionFile } from "@/lib/schemas/session";
import type { Result } from "@/lib/schemas/shared";
import type { SessionParseResult } from "@/lib/fs/types";
import { generateTaskId } from "@/lib/utils/generate-id";
import { revalidateProjectPaths } from "@/lib/actions/revalidate-helpers";

// --- Shared helper ---

/**
 * Resolve a session file by project slug.
 * Extracts the common boilerplate (loadConfig, discoverProjects, find by basename,
 * readFile, parseSession) into a reusable function.
 */
async function resolveSession(
  slug: string,
): Promise<
  Result<{ filePath: string; data: SessionFile; preserved: SessionParseResult }>
> {
  const config = await loadConfig();
  const projects = await discoverProjects(config);
  const project = projects.find((p) => p.slug === slug);
  if (!project || !project.sessionPath) {
    return {
      success: false,
      errors: [
        {
          field: "slug",
          message: "Project not found or has no session file",
          received: slug,
        },
      ],
    };
  }

  const raw = await readFile(project.sessionPath, "utf-8");
  const result = parseSession(raw, project.sessionPath);
  if (!result.success) return result;

  return {
    success: true,
    data: {
      filePath: project.sessionPath,
      data: result.data,
      preserved: result.preserved,
    },
  };
}

// --- Server actions ---

/**
 * Toggle the checked state of a session task.
 *
 * @param slug - Project slug (directory basename)
 * @param taskId - ID of the task to toggle (must start with t_)
 * @returns Result<void>
 */
export async function toggleTaskCheckbox(
  slug: string,
  taskId: string,
): Promise<Result<void>> {
  // Validate task ID format
  if (!taskId.startsWith("t_")) {
    return {
      success: false,
      errors: [
        {
          field: "taskId",
          message: "Task ID must start with t_",
          received: taskId,
        },
      ],
    };
  }

  // Resolve session
  const resolved = await resolveSession(slug);
  if (!resolved.success) return resolved;

  const { filePath, data, preserved } = resolved.data;

  // Find task by ID
  const task = data.tasks.find((t) => t.id === taskId);
  if (!task) {
    return {
      success: false,
      errors: [
        {
          field: "taskId",
          message: "Task not found",
          received: taskId,
        },
      ],
    };
  }

  // Flip checked boolean
  task.checked = !task.checked;

  // Write atomically with preserved content
  const writeResult = await writeSessionFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidateProjectPaths(slug, "session");

  return { success: true, data: undefined };
}

/**
 * Add a new task to the session.
 *
 * @param slug - Project slug (directory basename)
 * @param input - Task data: description, dependency
 * @returns Result with generated task ID on success
 */
export async function addSessionTask(
  slug: string,
  input: { description: string; dependency: string },
): Promise<Result<{ id: string }>> {
  // Validate description is non-empty
  if (!input.description.trim()) {
    return {
      success: false,
      errors: [
        {
          field: "description",
          message: "Description must not be empty",
          received: input.description,
        },
      ],
    };
  }

  // Resolve session
  const resolved = await resolveSession(slug);
  if (!resolved.success) return resolved;

  const { filePath, data, preserved } = resolved.data;

  // Validate dependency exists if not "none"
  if (input.dependency !== "none") {
    const depExists = data.tasks.some((t) => t.id === input.dependency);
    if (!depExists) {
      return {
        success: false,
        errors: [
          {
            field: "dependency",
            message: "Dependency task not found",
            received: input.dependency,
          },
        ],
      };
    }
  }

  // Generate ID and build new task
  const id = generateTaskId();
  const newTask = {
    id,
    checked: false,
    description: input.description.trim(),
    dependency: input.dependency,
  };

  // Append to tasks array
  data.tasks.push(newTask);

  // Write atomically with preserved content
  const writeResult = await writeSessionFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidateProjectPaths(slug, "session");

  return { success: true, data: { id } };
}

/**
 * Update an existing session task's fields.
 *
 * @param slug - Project slug (directory basename)
 * @param taskId - ID of the task to update
 * @param updates - Partial fields to update (description, dependency)
 * @returns Result<void>
 */
export async function updateSessionTask(
  slug: string,
  taskId: string,
  updates: { description?: string; dependency?: string },
): Promise<Result<void>> {
  // Resolve session
  const resolved = await resolveSession(slug);
  if (!resolved.success) return resolved;

  const { filePath, data, preserved } = resolved.data;

  // Find task by ID
  const task = data.tasks.find((t) => t.id === taskId);
  if (!task) {
    return {
      success: false,
      errors: [
        {
          field: "taskId",
          message: "Task not found",
          received: taskId,
        },
      ],
    };
  }

  // Validate dependency exists if provided and not "none"
  if (updates.dependency !== undefined && updates.dependency !== "none") {
    const depExists = data.tasks.some((t) => t.id === updates.dependency);
    if (!depExists) {
      return {
        success: false,
        errors: [
          {
            field: "dependency",
            message: "Dependency task not found",
            received: updates.dependency,
          },
        ],
      };
    }
  }

  // Apply field updates
  if (updates.description !== undefined) {
    task.description = updates.description;
  }
  if (updates.dependency !== undefined) {
    task.dependency = updates.dependency;
  }

  // Write atomically with preserved content
  const writeResult = await writeSessionFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidateProjectPaths(slug, "session");

  return { success: true, data: undefined };
}

/**
 * Delete a session task by ID.
 * Cleans up orphaned dependencies: any task referencing the deleted task
 * gets its dependency set to "none".
 *
 * @param slug - Project slug (directory basename)
 * @param taskId - ID of the task to delete (must start with t_)
 * @returns Result<void>
 */
export async function deleteSessionTask(
  slug: string,
  taskId: string,
): Promise<Result<void>> {
  // Validate task ID format
  if (!taskId.startsWith("t_")) {
    return {
      success: false,
      errors: [
        {
          field: "taskId",
          message: "Task ID must start with t_",
          received: taskId,
        },
      ],
    };
  }

  // Resolve session
  const resolved = await resolveSession(slug);
  if (!resolved.success) return resolved;

  const { filePath, data, preserved } = resolved.data;

  // Find and remove task
  const idx = data.tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) {
    return {
      success: false,
      errors: [
        {
          field: "taskId",
          message: "Task not found",
          received: taskId,
        },
      ],
    };
  }

  data.tasks.splice(idx, 1);

  // Clean up orphaned dependencies
  for (const task of data.tasks) {
    if (task.dependency === taskId) {
      task.dependency = "none";
    }
  }

  // Write atomically with preserved content
  const writeResult = await writeSessionFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidateProjectPaths(slug, "session");

  return { success: true, data: undefined };
}

/**
 * Reorder session tasks to match a provided ID order.
 *
 * @param slug - Project slug (directory basename)
 * @param orderedTaskIds - Array of task IDs in desired order
 * @returns Result<void>
 */
export async function reorderSessionTasks(
  slug: string,
  orderedTaskIds: string[],
): Promise<Result<void>> {
  // Resolve session
  const resolved = await resolveSession(slug);
  if (!resolved.success) return resolved;

  const { filePath, data, preserved } = resolved.data;

  // Validate count matches
  if (orderedTaskIds.length !== data.tasks.length) {
    return {
      success: false,
      errors: [
        {
          field: "orderedTaskIds",
          message: `Expected ${data.tasks.length} IDs, got ${orderedTaskIds.length}`,
          received: orderedTaskIds,
        },
      ],
    };
  }

  // Validate all IDs exist in tasks
  const taskMap = new Map(data.tasks.map((task) => [task.id, task]));
  for (const id of orderedTaskIds) {
    if (!taskMap.has(id)) {
      return {
        success: false,
        errors: [
          {
            field: "orderedTaskIds",
            message: `Task ${id} not found`,
            received: orderedTaskIds,
          },
        ],
      };
    }
  }

  // Reorder tasks to match provided ID order
  data.tasks = orderedTaskIds.map((id) => taskMap.get(id)!);

  // Write atomically with preserved content
  const writeResult = await writeSessionFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidateProjectPaths(slug, "session");

  return { success: true, data: undefined };
}

/**
 * Update the currentStatus text of a session.
 *
 * @param slug - Project slug (directory basename)
 * @param newStatus - New current status string
 * @returns Result<void>
 */
export async function updateCurrentStatus(
  slug: string,
  newStatus: string,
): Promise<Result<void>> {
  // Resolve session
  const resolved = await resolveSession(slug);
  if (!resolved.success) return resolved;

  const { filePath, data, preserved } = resolved.data;

  // Replace currentStatus
  data.currentStatus = newStatus;

  // Write atomically with preserved content
  const writeResult = await writeSessionFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidateProjectPaths(slug, "session");

  return { success: true, data: undefined };
}
