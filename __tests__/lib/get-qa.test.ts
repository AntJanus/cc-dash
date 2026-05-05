import { describe, it, expect, vi, beforeEach } from "vitest";
import type { QaFile } from "@/lib/schemas/qa";

const { mockLoadConfig } = vi.hoisted(() => ({ mockLoadConfig: vi.fn() }));
vi.mock("@/lib/config", () => ({ loadConfig: mockLoadConfig }));

const { mockDiscoverProjects, mockParseQa } = vi.hoisted(() => ({
  mockDiscoverProjects: vi.fn(),
  mockParseQa: vi.fn(),
}));
vi.mock("@/lib/fs", () => ({
  discoverProjects: mockDiscoverProjects,
  parseQa: mockParseQa,
}));

const { mockReadFile } = vi.hoisted(() => ({ mockReadFile: vi.fn() }));
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    default: { ...actual, readFile: mockReadFile },
    readFile: mockReadFile,
  };
});

import { getQaBySlug } from "@/lib/projects/get-qa";

function makeQa(overrides: Partial<QaFile> = {}): QaFile {
  return {
    schema: "cc-dash/qa@1",
    project: "test-project",
    last_updated: "2026-05-04T10:00:00Z",
    setup: "",
    items: [{ id: "q_aaaaa", status: "pending", description: "A check" }],
    filePath: "/projects/test/QA.md",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLoadConfig.mockResolvedValue({
    scan_dirs: [],
    explicit_projects: [],
    exclude_dirs: [],
    scan_depth: 2,
  });
});

describe("getQaBySlug", () => {
  it("returns parsed QA, project name, and hasRoadmap for a valid slug", async () => {
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "Test Project",
        slug: "test-project",
        path: "/projects/test",
        roadmapPath: "/projects/test/ROADMAP.md",
        sessionPath: null,
        qaPath: "/projects/test/QA.md",
        isExplicit: false,
      },
    ]);
    mockReadFile.mockResolvedValue("raw");
    mockParseQa.mockReturnValue({
      success: true,
      data: makeQa(),
      preserved: { preamble: "", unknownSections: [], trailingContent: "" },
    });

    const result = await getQaBySlug("test-project");
    expect(result).not.toBeNull();
    expect(result!.qa.items).toHaveLength(1);
    expect(result!.projectName).toBe("Test Project");
    expect(result!.hasRoadmap).toBe(true);
  });

  it("returns hasRoadmap=false when the project has no ROADMAP.md", async () => {
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "No Roadmap",
        slug: "no-roadmap",
        path: "/projects/no-roadmap",
        roadmapPath: null,
        sessionPath: null,
        qaPath: "/projects/no-roadmap/QA.md",
        isExplicit: false,
      },
    ]);
    mockReadFile.mockResolvedValue("raw");
    mockParseQa.mockReturnValue({
      success: true,
      data: makeQa(),
      preserved: { preamble: "", unknownSections: [], trailingContent: "" },
    });

    const result = await getQaBySlug("no-roadmap");
    expect(result).not.toBeNull();
    expect(result!.hasRoadmap).toBe(false);
  });

  it("returns null when the slug does not match", async () => {
    mockDiscoverProjects.mockResolvedValue([]);
    const result = await getQaBySlug("nope");
    expect(result).toBeNull();
  });

  it("returns null when the project has no QA.md", async () => {
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "No QA",
        slug: "no-qa",
        path: "/projects/no-qa",
        roadmapPath: "/projects/no-qa/ROADMAP.md",
        sessionPath: null,
        qaPath: null,
        isExplicit: false,
      },
    ]);
    const result = await getQaBySlug("no-qa");
    expect(result).toBeNull();
  });

  it("returns null when QA fails to parse", async () => {
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "Bad QA",
        slug: "bad-qa",
        path: "/projects/bad-qa",
        roadmapPath: null,
        sessionPath: null,
        qaPath: "/projects/bad-qa/QA.md",
        isExplicit: false,
      },
    ]);
    mockReadFile.mockResolvedValue("malformed");
    mockParseQa.mockReturnValue({
      success: false,
      errors: [
        { field: "schema", message: "Invalid schema", received: "wrong" },
      ],
    });

    const result = await getQaBySlug("bad-qa");
    expect(result).toBeNull();
  });
});
