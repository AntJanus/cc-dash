"use server";

/**
 * Server actions for ideas CRUD operations.
 *
 * All actions follow the read-parse-mutate-write pattern:
 * 1. Validate inputs (fast-fail before I/O)
 * 2. Resolve ideas file via config (single portfolio-level file)
 * 3. Read + parse ideas file
 * 4. Mutate data
 * 5. Write atomically with preserved content for round-trip fidelity
 * 6. Revalidate Next.js cache
 */

import { readFile } from "node:fs/promises";
import { revalidatePath } from "next/cache";
import { loadConfig } from "@/lib/config";
import { expandTilde } from "@/lib/fs/discovery";
import { parseIdeas, writeIdeasFile } from "@/lib/fs";
import { IdeaStatus, type IdeasFile } from "@/lib/schemas/ideas";
import type { Result } from "@/lib/schemas/shared";
import type { IdeasParseResult } from "@/lib/fs/types";
import { generateIdeaId } from "@/lib/utils/generate-id";

// --- Shared helper ---

/**
 * Resolve the portfolio-level ideas file from config.
 * Extracts the common boilerplate (loadConfig, expandTilde, readFile, parseIdeas)
 * into a reusable function.
 */
async function resolveIdeas(): Promise<
  Result<{ filePath: string; data: IdeasFile; preserved: IdeasParseResult }>
> {
  const config = await loadConfig();
  if (!config.ideas_file) {
    return {
      success: false,
      errors: [
        {
          field: "ideas_file",
          message: "No ideas_file configured in cc-dash config",
          received: undefined,
        },
      ],
    };
  }

  const filePath = expandTilde(config.ideas_file);

  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch {
    return {
      success: false,
      errors: [
        {
          field: "ideas_file",
          message: "Ideas file not found",
          received: filePath,
        },
      ],
    };
  }

  const result = parseIdeas(raw, filePath);
  if (!result.success) return result;

  return {
    success: true,
    data: {
      filePath,
      data: result.data,
      preserved: result.preserved,
    },
  };
}

// --- Server actions ---

/**
 * Add a new project idea.
 *
 * @param input - Idea data: title, status, stack
 * @returns Result with generated idea ID on success
 */
export async function addIdea(input: {
  title: string;
  status: string;
  stack: string[];
}): Promise<Result<{ id: string }>> {
  // Validate status
  const statusParsed = IdeaStatus.safeParse(input.status);
  if (!statusParsed.success) {
    return {
      success: false,
      errors: [
        {
          field: "status",
          message: "Invalid idea status",
          received: input.status,
        },
      ],
    };
  }

  // Resolve ideas file
  const resolved = await resolveIdeas();
  if (!resolved.success) return resolved;

  const { filePath, data, preserved } = resolved.data;

  // Generate ID and build new item
  const id = generateIdeaId();
  const newIdea: Record<string, unknown> = {
    id,
    status: statusParsed.data,
    title: input.title.trim(),
    body: "",
  };

  // Only set stack if non-empty
  if (input.stack.length > 0) {
    newIdea.stack = input.stack;
  }

  // Append to ideas array
  data.ideas.push(newIdea as (typeof data.ideas)[number]);

  // Write atomically with preserved content
  const writeResult = await writeIdeasFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidatePath("/ideas");

  return { success: true, data: { id } };
}

/**
 * Update idea metadata (status, path, stack).
 *
 * @param input - ID of idea to update + metadata fields
 * @returns Result<void>
 */
export async function updateIdeaMetadata(input: {
  id: string;
  status: string;
  path?: string;
  stack?: string[];
}): Promise<Result<void>> {
  // Resolve ideas file
  const resolved = await resolveIdeas();
  if (!resolved.success) return resolved;

  const { filePath, data, preserved } = resolved.data;

  // Find idea by ID
  const idea = data.ideas.find((i) => i.id === input.id);
  if (!idea) {
    return {
      success: false,
      errors: [
        {
          field: "id",
          message: "Idea not found",
          received: input.id,
        },
      ],
    };
  }

  // Validate status
  const statusParsed = IdeaStatus.safeParse(input.status);
  if (!statusParsed.success) {
    return {
      success: false,
      errors: [
        {
          field: "status",
          message: "Invalid idea status",
          received: input.status,
        },
      ],
    };
  }

  // If promoting to "started" and no path provided AND no existing path: error
  if (statusParsed.data === "started" && !input.path && !idea.path) {
    return {
      success: false,
      errors: [
        {
          field: "path",
          message: "Path is required when promoting to started",
          received: input.path,
        },
      ],
    };
  }

  // Apply updates
  idea.status = statusParsed.data;
  if (input.path !== undefined) {
    idea.path = input.path || undefined;
  }
  if (input.stack !== undefined) {
    idea.stack = input.stack.length > 0 ? input.stack : undefined;
  }

  // Write atomically with preserved content
  const writeResult = await writeIdeasFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidatePath("/ideas");

  return { success: true, data: undefined };
}

/**
 * Update idea body content.
 *
 * @param input - ID of idea to update + new body content
 * @returns Result<void>
 */
export async function updateIdeaBody(input: {
  id: string;
  body: string;
}): Promise<Result<void>> {
  // Resolve ideas file
  const resolved = await resolveIdeas();
  if (!resolved.success) return resolved;

  const { filePath, data, preserved } = resolved.data;

  // Find idea by ID
  const idea = data.ideas.find((i) => i.id === input.id);
  if (!idea) {
    return {
      success: false,
      errors: [
        {
          field: "id",
          message: "Idea not found",
          received: input.id,
        },
      ],
    };
  }

  // Replace body
  idea.body = input.body;

  // Write atomically with preserved content
  const writeResult = await writeIdeasFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidatePath("/ideas");

  return { success: true, data: undefined };
}

/**
 * Delete an idea.
 *
 * @param input - ID of the idea to delete
 * @returns Result<void>
 */
export async function deleteIdea(input: { id: string }): Promise<Result<void>> {
  // Resolve ideas file
  const resolved = await resolveIdeas();
  if (!resolved.success) return resolved;

  const { filePath, data, preserved } = resolved.data;

  // Find idea by ID
  const idx = data.ideas.findIndex((i) => i.id === input.id);
  if (idx === -1) {
    return {
      success: false,
      errors: [
        {
          field: "id",
          message: "Idea not found",
          received: input.id,
        },
      ],
    };
  }

  // Remove idea
  data.ideas.splice(idx, 1);

  // Write atomically with preserved content
  const writeResult = await writeIdeasFile(filePath, data, preserved);
  if (!writeResult.success) return writeResult;

  revalidatePath("/ideas");

  return { success: true, data: undefined };
}
