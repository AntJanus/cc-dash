import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs/promises");

import { readFile } from "node:fs/promises";
import { loadConfig, CONFIG_PATH } from "@/lib/config";

const mockedReadFile = vi.mocked(readFile);

describe("loadConfig", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns defaults when config file does not exist", async () => {
    mockedReadFile.mockRejectedValue(new Error("ENOENT"));

    const config = await loadConfig();
    expect(config.scan_dirs).toEqual([]);
    expect(config.exclude_dirs).toEqual(["node_modules", ".git", "vendor"]);
    expect(config.scan_depth).toBe(2);
    expect(config.port).toBe(3000);
    expect(config.explicit_projects).toEqual([]);
  });

  it("reads and validates existing config.json", async () => {
    const validConfig = {
      scan_dirs: ["/home/user/projects"],
      exclude_dirs: ["node_modules", ".git"],
      scan_depth: 3,
      port: 4000,
      explicit_projects: [{ path: "/home/user/myapp", name: "My App" }],
    };
    mockedReadFile.mockResolvedValue(JSON.stringify(validConfig));

    const config = await loadConfig();
    expect(config.scan_dirs).toEqual(["/home/user/projects"]);
    expect(config.exclude_dirs).toEqual(["node_modules", ".git"]);
    expect(config.scan_depth).toBe(3);
    expect(config.port).toBe(4000);
    expect(config.explicit_projects).toEqual([
      { path: "/home/user/myapp", name: "My App" },
    ]);
  });

  it("falls back to defaults on invalid JSON", async () => {
    mockedReadFile.mockResolvedValue("not valid json {{{");

    const config = await loadConfig();
    expect(config.scan_dirs).toEqual([]);
    expect(config.scan_depth).toBe(2);
  });

  it("falls back to defaults on schema validation failure", async () => {
    const invalidConfig = { scan_depth: 999 };
    mockedReadFile.mockResolvedValue(JSON.stringify(invalidConfig));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const config = await loadConfig();
    expect(config.scan_dirs).toEqual([]);
    expect(config.scan_depth).toBe(2);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("merges partial config with defaults", async () => {
    const partialConfig = { scan_dirs: ["/tmp/projects"] };
    mockedReadFile.mockResolvedValue(JSON.stringify(partialConfig));

    const config = await loadConfig();
    expect(config.scan_dirs).toEqual(["/tmp/projects"]);
    expect(config.exclude_dirs).toEqual(["node_modules", ".git", "vendor"]);
    expect(config.scan_depth).toBe(2);
    expect(config.port).toBe(3000);
  });
});

describe("CONFIG_PATH", () => {
  it("is a string ending with cc-dash/config.json", () => {
    expect(CONFIG_PATH).toMatch(/cc-dash\/config\.json$/);
  });
});
