import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockReadFile, mockReadFileSync } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
  mockReadFileSync: vi.fn(),
}));

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    default: { ...actual, readFile: mockReadFile },
    readFile: mockReadFile,
  };
});

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    default: { ...actual, readFileSync: mockReadFileSync },
    readFileSync: mockReadFileSync,
  };
});

import { loadConfig, resolvePortSync, CONFIG_PATH } from "@/lib/config";

describe("loadConfig", () => {
  beforeEach(() => {
    mockReadFile.mockReset();
  });

  it("returns defaults when config file does not exist", async () => {
    mockReadFile.mockRejectedValue(new Error("ENOENT"));

    const config = await loadConfig();
    expect(config.scan_dirs).toEqual([]);
    expect(config.exclude_dirs).toEqual(["node_modules", ".git", "vendor"]);
    expect(config.scan_depth).toBe(2);
    expect(config.port).toBe(3737);
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
    mockReadFile.mockResolvedValue(JSON.stringify(validConfig));

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
    mockReadFile.mockResolvedValue("not valid json {{{");

    const config = await loadConfig();
    expect(config.scan_dirs).toEqual([]);
    expect(config.scan_depth).toBe(2);
  });

  it("falls back to defaults on schema validation failure", async () => {
    const invalidConfig = { scan_depth: 999 };
    mockReadFile.mockResolvedValue(JSON.stringify(invalidConfig));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const config = await loadConfig();
    expect(config.scan_dirs).toEqual([]);
    expect(config.scan_depth).toBe(2);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("merges partial config with defaults", async () => {
    const partialConfig = { scan_dirs: ["/tmp/projects"] };
    mockReadFile.mockResolvedValue(JSON.stringify(partialConfig));

    const config = await loadConfig();
    expect(config.scan_dirs).toEqual(["/tmp/projects"]);
    expect(config.exclude_dirs).toEqual(["node_modules", ".git", "vendor"]);
    expect(config.scan_depth).toBe(2);
    expect(config.port).toBe(3737);
  });
});

describe("resolvePortSync", () => {
  const originalPort = process.env.PORT;

  beforeEach(() => {
    mockReadFileSync.mockReset();
    delete process.env.PORT;
  });

  afterEach(() => {
    if (originalPort === undefined) delete process.env.PORT;
    else process.env.PORT = originalPort;
  });

  it("returns the schema default when the config file does not exist", () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error("ENOENT");
    });

    expect(resolvePortSync()).toBe(3737);
  });

  it("returns port from an existing config.json", () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({ port: 4000 }));

    expect(resolvePortSync()).toBe(4000);
  });

  it("reads the config from CONFIG_PATH", () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({ port: 4000 }));

    resolvePortSync();
    expect(mockReadFileSync).toHaveBeenCalledWith(CONFIG_PATH, "utf-8");
  });

  it("lets the PORT env var override config.json", () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({ port: 4000 }));
    process.env.PORT = "8080";

    expect(resolvePortSync()).toBe(8080);
    expect(mockReadFileSync).not.toHaveBeenCalled();
  });

  it("throws on a non-numeric PORT env var instead of silently falling back", () => {
    process.env.PORT = "not-a-port";

    expect(() => resolvePortSync()).toThrow(/PORT/);
  });

  it("throws on a fractional PORT env var", () => {
    process.env.PORT = "80.5";

    expect(() => resolvePortSync()).toThrow(/PORT/);
  });

  it("warns and returns the default on schema validation failure", () => {
    mockReadFileSync.mockReturnValue(
      JSON.stringify({ port: "three thousand" }),
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(resolvePortSync()).toBe(3737);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("returns the default on invalid JSON", () => {
    mockReadFileSync.mockReturnValue("not valid json {{{");

    expect(resolvePortSync()).toBe(3737);
  });
});

describe("CONFIG_PATH", () => {
  it("is a string ending with cc-dash/config.json", () => {
    expect(CONFIG_PATH).toMatch(/cc-dash\/config\.json$/);
  });
});
