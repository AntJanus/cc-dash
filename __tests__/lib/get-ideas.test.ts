/**
 * Tests for getIdeasData data loader.
 * Verifies: config-based discovery, file reading, null returns for edge cases.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IdeasFile } from "@/lib/schemas/ideas";
import type { IdeasParseResult } from "@/lib/fs/types";

// --- Mocks must be set up before importing the module under test ---

const { mockLoadConfig } = vi.hoisted(() => ({
  mockLoadConfig: vi.fn(),
}));
vi.mock("@/lib/config", () => ({
  loadConfig: mockLoadConfig,
}));

const { mockParseIdeas } = vi.hoisted(() => ({
  mockParseIdeas: vi.fn(),
}));
vi.mock("@/lib/fs", () => ({
  parseIdeas: mockParseIdeas,
}));

const { mockExpandTilde } = vi.hoisted(() => ({
  mockExpandTilde: vi.fn(),
}));
vi.mock("@/lib/fs/discovery", () => ({
  expandTilde: mockExpandTilde,
}));

const { mockReadFile } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
}));
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    default: { ...actual, readFile: mockReadFile },
    readFile: mockReadFile,
  };
});

// Import AFTER mocks
import { getIdeasData } from "@/lib/projects/get-ideas";

// --- Helpers ---

function makeIdeasFile(overrides: Partial<IdeasFile> = {}): IdeasFile {
  return {
    schema: "cc-dash/ideas@1",
    last_updated: "2026-03-14T12:00:00-07:00",
    ideas: [
      {
        id: "i_a8k2m",
        status: "started",
        title: "ASCII Game Engine",
        body: "A game engine for CLI games.",
        path: "gamma-engine/",
        stack: ["TypeScript/Node.js"],
      },
      {
        id: "i_x9w1n",
        status: "started",
        title: "Photo Sim",
        body: "Photography simulator game.",
        path: "delta-sim/",
        stack: ["Godot 4", "GDScript"],
      },
    ],
    filePath: "/projects/PROJECT_IDEAS.md",
    ...overrides,
  };
}

const defaultPreserved: IdeasParseResult = {
  preamble: "\n# Project Ideas\n",
  trailingContent: "",
};

// --- Tests ---

describe("getIdeasData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns IdeasData when ideas_file is configured and file exists", async () => {
    mockLoadConfig.mockResolvedValue({
      ideas_file: "~/projects/PROJECT_IDEAS.md",
    });
    mockExpandTilde.mockReturnValue("/Users/test/projects/PROJECT_IDEAS.md");
    mockReadFile.mockResolvedValue("raw-ideas-content");

    const ideasFile = makeIdeasFile();
    mockParseIdeas.mockReturnValue({
      success: true,
      data: ideasFile,
      preserved: defaultPreserved,
    });

    const result = await getIdeasData();

    expect(result).not.toBeNull();
    expect(result!.data).toEqual(ideasFile);
    expect(result!.preserved).toEqual(defaultPreserved);
  });

  it("returns null when ideas_file is not configured (undefined)", async () => {
    mockLoadConfig.mockResolvedValue({});

    const result = await getIdeasData();
    expect(result).toBeNull();
  });

  it("returns null when ideas_file points to nonexistent file", async () => {
    mockLoadConfig.mockResolvedValue({
      ideas_file: "~/projects/MISSING.md",
    });
    mockExpandTilde.mockReturnValue("/Users/test/projects/MISSING.md");
    mockReadFile.mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );

    const result = await getIdeasData();
    expect(result).toBeNull();
  });

  it("expands ~ in ideas_file path before reading", async () => {
    mockLoadConfig.mockResolvedValue({
      ideas_file: "~/projects/PROJECT_IDEAS.md",
    });
    mockExpandTilde.mockReturnValue("/Users/test/projects/PROJECT_IDEAS.md");
    mockReadFile.mockResolvedValue("raw-ideas-content");

    const ideasFile = makeIdeasFile();
    mockParseIdeas.mockReturnValue({
      success: true,
      data: ideasFile,
      preserved: defaultPreserved,
    });

    await getIdeasData();

    expect(mockExpandTilde).toHaveBeenCalledWith("~/projects/PROJECT_IDEAS.md");
    expect(mockReadFile).toHaveBeenCalledWith(
      "/Users/test/projects/PROJECT_IDEAS.md",
      "utf-8",
    );
  });

  it("returns parsed ideas array with correct item count", async () => {
    mockLoadConfig.mockResolvedValue({
      ideas_file: "/projects/PROJECT_IDEAS.md",
    });
    mockExpandTilde.mockReturnValue("/projects/PROJECT_IDEAS.md");
    mockReadFile.mockResolvedValue("raw-ideas");

    const ideasFile = makeIdeasFile();
    mockParseIdeas.mockReturnValue({
      success: true,
      data: ideasFile,
      preserved: defaultPreserved,
    });

    const result = await getIdeasData();

    expect(result).not.toBeNull();
    expect(result!.data.ideas).toHaveLength(2);
    expect(result!.data.ideas[0].title).toBe("ASCII Game Engine");
    expect(result!.data.ideas[1].title).toBe("Photo Sim");
  });

  it("returns null when parse fails", async () => {
    mockLoadConfig.mockResolvedValue({
      ideas_file: "/projects/PROJECT_IDEAS.md",
    });
    mockExpandTilde.mockReturnValue("/projects/PROJECT_IDEAS.md");
    mockReadFile.mockResolvedValue("invalid-content");

    mockParseIdeas.mockReturnValue({
      success: false,
      errors: [{ field: "schema", message: "Invalid", received: "wrong" }],
    });

    const result = await getIdeasData();
    expect(result).toBeNull();
  });
});
