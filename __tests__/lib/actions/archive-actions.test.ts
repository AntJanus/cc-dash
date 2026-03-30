import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks must be set up before importing the module under test ---

const { mockLoadConfig } = vi.hoisted(() => ({
  mockLoadConfig: vi.fn(),
}));
vi.mock("@/lib/config", () => ({
  loadConfig: mockLoadConfig,
  CONFIG_PATH: "/mock/.config/cc-dash/config.json",
}));

const { mockSaveConfig } = vi.hoisted(() => ({
  mockSaveConfig: vi.fn(),
}));
vi.mock("@/lib/actions/settings-actions", () => ({
  saveConfig: mockSaveConfig,
}));

const { mockDiscoverProjects } = vi.hoisted(() => ({
  mockDiscoverProjects: vi.fn(),
}));
vi.mock("@/lib/fs", () => ({
  discoverProjects: mockDiscoverProjects,
}));

const { mockRevalidatePath } = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

// Import AFTER mocks
import {
  archiveProject,
  unarchiveProject,
  getArchivedProjects,
} from "@/lib/actions/archive-actions";

const defaultConfig = {
  scan_dirs: ["/projects"],
  exclude_dirs: ["node_modules", ".git", "vendor"],
  explicit_projects: [],
  scan_depth: 2,
  port: 3000,
  archived_projects: [],
  display: {
    default_view: "board" as const,
    sort_order: "last_updated" as const,
    theme: "light" as const,
  },
};

describe("archiveProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadConfig.mockResolvedValue({ ...defaultConfig });
    mockSaveConfig.mockResolvedValue({ success: true });
  });

  it("adds slug to archived_projects when list is empty", async () => {
    const result = await archiveProject("my-project");

    expect(result).toEqual({ success: true });
    expect(mockSaveConfig).toHaveBeenCalledWith({
      archived_projects: ["my-project"],
    });
  });

  it("appends slug to existing archived_projects list", async () => {
    mockLoadConfig.mockResolvedValue({
      ...defaultConfig,
      archived_projects: ["existing-project"],
    });

    await archiveProject("new-project");

    const savedArg = mockSaveConfig.mock.calls[0][0];
    expect(savedArg.archived_projects).toContain("existing-project");
    expect(savedArg.archived_projects).toContain("new-project");
  });

  it("is idempotent — archiving an already-archived project keeps one entry", async () => {
    mockLoadConfig.mockResolvedValue({
      ...defaultConfig,
      archived_projects: ["my-project"],
    });

    await archiveProject("my-project");

    const savedArg = mockSaveConfig.mock.calls[0][0];
    expect(
      savedArg.archived_projects.filter((s: string) => s === "my-project"),
    ).toHaveLength(1);
  });

  it("calls revalidatePath on success", async () => {
    await archiveProject("my-project");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("does not call revalidatePath on saveConfig failure", async () => {
    mockSaveConfig.mockResolvedValue({
      success: false,
      error: "Write failed",
    });

    await archiveProject("my-project");

    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("returns saveConfig error when save fails", async () => {
    mockSaveConfig.mockResolvedValue({
      success: false,
      error: "disk full",
    });

    const result = await archiveProject("my-project");

    expect(result).toEqual({ success: false, error: "disk full" });
  });
});

describe("unarchiveProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadConfig.mockResolvedValue({
      ...defaultConfig,
      archived_projects: ["project-a", "project-b"],
    });
    mockSaveConfig.mockResolvedValue({ success: true });
  });

  it("removes the given slug from archived_projects", async () => {
    await unarchiveProject("project-a");

    const savedArg = mockSaveConfig.mock.calls[0][0];
    expect(savedArg.archived_projects).not.toContain("project-a");
    expect(savedArg.archived_projects).toContain("project-b");
  });

  it("is a no-op when slug is not in archived_projects", async () => {
    mockLoadConfig.mockResolvedValue({
      ...defaultConfig,
      archived_projects: ["project-b"],
    });

    await unarchiveProject("project-a");

    const savedArg = mockSaveConfig.mock.calls[0][0];
    expect(savedArg.archived_projects).toEqual(["project-b"]);
  });

  it("calls revalidatePath on success", async () => {
    await unarchiveProject("project-a");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("does not call revalidatePath on saveConfig failure", async () => {
    mockSaveConfig.mockResolvedValue({
      success: false,
      error: "Write failed",
    });

    await unarchiveProject("project-a");

    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("returns saveConfig error when save fails", async () => {
    mockSaveConfig.mockResolvedValue({
      success: false,
      error: "permission denied",
    });

    const result = await unarchiveProject("project-a");

    expect(result).toEqual({ success: false, error: "permission denied" });
  });
});

describe("getArchivedProjects", () => {
  const discoveredProjects = [
    {
      slug: "project-a",
      name: "Project A",
      path: "/projects/project-a",
      roadmapPath: "/projects/project-a/ROADMAP.md",
      sessionPath: null,
      isExplicit: false,
    },
    {
      slug: "project-b",
      name: "Project B",
      path: "/projects/project-b",
      roadmapPath: "/projects/project-b/ROADMAP.md",
      sessionPath: null,
      isExplicit: false,
    },
    {
      slug: "project-c",
      name: "Project C",
      path: "/projects/project-c",
      roadmapPath: null,
      sessionPath: null,
      isExplicit: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockDiscoverProjects.mockResolvedValue(discoveredProjects);
  });

  it("returns empty array when no projects are archived", async () => {
    mockLoadConfig.mockResolvedValue({
      ...defaultConfig,
      archived_projects: [],
    });

    const result = await getArchivedProjects();

    expect(result).toEqual([]);
  });

  it("returns archived project info for matching slugs", async () => {
    mockLoadConfig.mockResolvedValue({
      ...defaultConfig,
      archived_projects: ["project-a", "project-b"],
    });

    const result = await getArchivedProjects();

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        { slug: "project-a", name: "Project A", path: "/projects/project-a" },
        { slug: "project-b", name: "Project B", path: "/projects/project-b" },
      ]),
    );
  });

  it("calls discoverProjects with includeArchived: true", async () => {
    mockLoadConfig.mockResolvedValue({
      ...defaultConfig,
      archived_projects: ["project-a"],
    });

    await getArchivedProjects();

    expect(mockDiscoverProjects).toHaveBeenCalledWith(expect.anything(), {
      includeArchived: true,
    });
  });

  it("skips slugs in archived_projects that are not discovered", async () => {
    mockLoadConfig.mockResolvedValue({
      ...defaultConfig,
      archived_projects: ["ghost-project"],
    });

    const result = await getArchivedProjects();

    expect(result).toEqual([]);
  });

  it("returns only slug, name, and path fields", async () => {
    mockLoadConfig.mockResolvedValue({
      ...defaultConfig,
      archived_projects: ["project-a"],
    });

    const result = await getArchivedProjects();

    expect(result[0]).toEqual({
      slug: "project-a",
      name: "Project A",
      path: "/projects/project-a",
    });
    // Should not include roadmapPath, sessionPath, isExplicit
    expect(result[0]).not.toHaveProperty("roadmapPath");
    expect(result[0]).not.toHaveProperty("sessionPath");
  });
});
