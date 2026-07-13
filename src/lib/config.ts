import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { ConfigSchema, type Config } from "./schemas/config";

export const CONFIG_PATH = join(
  process.env.XDG_CONFIG_HOME || join(homedir(), ".config"),
  "cc-dash",
  "config.json",
);

export async function loadConfig(): Promise<Config> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    const json = JSON.parse(raw);
    const result = ConfigSchema.safeParse(json);
    if (result.success) return result.data;
    console.warn("Config validation failed, using defaults:", result.error);
  } catch {
    // File not found or parse error -- use defaults silently
  }
  return ConfigSchema.parse({});
}

/**
 * Resolve the dashboard port synchronously, for callers that cannot await:
 * the `next dev`/`next start` launcher and playwright.config.ts, which must
 * build its config object before any promise can settle.
 *
 * Precedence: PORT env var > config.json > schema default.
 */
export function resolvePortSync(): number {
  const override = process.env.PORT;
  if (override !== undefined && override !== "") {
    const parsed = Number(override);
    if (!Number.isInteger(parsed)) {
      throw new Error(
        `PORT must be an integer, got ${JSON.stringify(override)}`,
      );
    }
    return parsed;
  }

  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    const json = JSON.parse(raw);
    const result = ConfigSchema.safeParse(json);
    if (result.success) return result.data.port;
    console.warn("Config validation failed, using default port:", result.error);
  } catch {
    // File not found or parse error -- use the default silently
  }
  return ConfigSchema.parse({}).port;
}
