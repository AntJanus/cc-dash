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
