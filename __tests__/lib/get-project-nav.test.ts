import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockLoadConfig } = vi.hoisted(() => ({
  mockLoadConfig: vi.fn(),
}));
vi.mock("@/lib/config", () => ({
  loadConfig: mockLoadConfig,
}));

const { mockDiscoverProjects, mockParseSession } = vi.hoisted(() => ({
  mockDiscoverProjects: vi.fn(),
  mockParseSession: vi.fn(),
}));
vi.mock("@/lib/fs", () => ({
  discoverProjects: mockDiscoverProjects,
  parseSession: mockParseSession,
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

import { getProjectNav } from "@/lib/projects/get-project-nav";

describe("getProjectNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadConfig.mockResolvedValue({ scan_dirs: ["/projects"] });
  });

  it("returns sorted project list with slug and name", async () => {
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "Zeta",
        path: "/projects/zeta",
        roadmapPath: null,
        sessionPath: null,
        isExplicit: false,
      },
      {
        name: "Alpha",
        path: "/projects/alpha",
        roadmapPath: null,
        sessionPath: null,
        isExplicit: false,
      },
      {
        name: "Mango",
        path: "/projects/mango",
        roadmapPath: null,
        sessionPath: null,
        isExplicit: false,
      },
    ]);

    const result = await getProjectNav();

    expect(result).toEqual([
      { slug: "alpha", name: "Alpha", hasActiveSession: false },
      { slug: "mango", name: "Mango", hasActiveSession: false },
      { slug: "zeta", name: "Zeta", hasActiveSession: false },
    ]);
  });

  it("returns empty array when no projects found", async () => {
    mockDiscoverProjects.mockResolvedValue([]);

    const result = await getProjectNav();

    expect(result).toEqual([]);
  });

  it("uses basename of path as slug", async () => {
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "My Project",
        path: "/deep/nested/my-project",
        roadmapPath: null,
        sessionPath: null,
        isExplicit: false,
      },
    ]);

    const result = await getProjectNav();

    expect(result[0].slug).toBe("my-project");
  });

  it("detects active sessions", async () => {
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "Active",
        path: "/projects/active",
        roadmapPath: null,
        sessionPath: "/projects/active/SESSION_PROGRESS.md",
        isExplicit: false,
      },
    ]);
    mockReadFile.mockResolvedValue("mock-session-content");
    mockParseSession.mockReturnValue({
      success: true,
      data: { status: "in-progress" },
    });

    const result = await getProjectNav();

    expect(result[0].hasActiveSession).toBe(true);
  });

  it("handles session read errors gracefully", async () => {
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "Broken",
        path: "/projects/broken",
        roadmapPath: null,
        sessionPath: "/projects/broken/SESSION_PROGRESS.md",
        isExplicit: false,
      },
    ]);
    mockReadFile.mockRejectedValue(new Error("ENOENT"));

    const result = await getProjectNav();

    expect(result[0].hasActiveSession).toBe(false);
  });
});
