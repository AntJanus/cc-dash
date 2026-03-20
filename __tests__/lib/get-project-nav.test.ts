import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockLoadConfig } = vi.hoisted(() => ({
  mockLoadConfig: vi.fn(),
}));
vi.mock("@/lib/config", () => ({
  loadConfig: mockLoadConfig,
}));

const { mockDiscoverProjects } = vi.hoisted(() => ({
  mockDiscoverProjects: vi.fn(),
}));
vi.mock("@/lib/fs", () => ({
  discoverProjects: mockDiscoverProjects,
}));

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
      { slug: "alpha", name: "Alpha" },
      { slug: "mango", name: "Mango" },
      { slug: "zeta", name: "Zeta" },
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
});
