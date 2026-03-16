"use server";

import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { revalidatePath } from "next/cache";

import { loadConfig, CONFIG_PATH } from "@/lib/config";
import { ConfigSchema } from "@/lib/schemas/config";
import { atomicWriteFile } from "@/lib/fs";

/**
 * Server action to save config updates.
 *
 * Merges `updates` with the current config, validates via ConfigSchema,
 * creates the config directory if needed, and writes atomically.
 */
export async function saveConfig(
  updates: Record<string, unknown>,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const current = await loadConfig();

    // Deep merge: handle nested display object
    const merged = {
      ...current,
      ...updates,
      display: {
        ...current.display,
        ...((updates.display as object) ?? {}),
      },
    };

    // Validate merged config
    const result = ConfigSchema.safeParse(merged);
    if (!result.success) {
      return {
        success: false,
        error: "Invalid configuration: " + result.error.message,
      };
    }

    // Ensure config directory exists
    await mkdir(dirname(CONFIG_PATH), { recursive: true });

    // Write atomically
    await atomicWriteFile(CONFIG_PATH, JSON.stringify(result.data, null, 2));

    // Refresh all pages so they pick up new config
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
