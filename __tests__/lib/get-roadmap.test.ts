import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RoadmapFile } from "@/lib/schemas/roadmap";
import type { SessionFile } from "@/lib/schemas/session";

// --- Mocks must be set up before importing the module under test ---

const { mockLoadConfig } = vi.hoisted(() => ({
  mockLoadConfig: vi.fn(),
}));
vi.mock("@/lib/config", () => ({
  loadConfig: mockLoadConfig,
}));

const { mockDiscoverProjects } = vi.hoisted(() => ({
  mockDiscoverProjects: vi.fn(),
}));

const { mockParseRoadmap, mockParseSession } = vi.hoisted(() => ({
  mockParseRoadmap: vi.fn(),
  mockParseSession: vi.fn(),
}));

vi.mock("@/lib/fs", () => ({
  discoverProjects: mockDiscoverProjects,
  parseRoadmap: mockParseRoadmap,
  parseSession: mockParseSession,
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
import { getRoadmapBySlug } from "@/lib/projects/get-roadmap";

// --- Helpers ---

const defaultConfig = {
  scan_dirs: [],
  explicit_projects: [],
  exclude_dirs: [],
  scan_depth: 2,
};

function makeRoadmap(overrides: Partial<RoadmapFile> = {}): RoadmapFile {
  return {
    schema: "cc-dash/roadmap@1",
    project: "test-project",
    description: "A test project",
    last_updated: "2026-03-01T12:00:00-07:00",
    categories: [
      {
        title: "Core",
        slug: "core",
        items: [
          {
            id: "r_abc12",
            status: "planned",
            name: "Feature A",
            description: "First feature",
          },
        ],
      },
    ],
    filePath: "/projects/test-project/ROADMAP.md",
    ...overrides,
  };
}

function makeSession(overrides: Partial<SessionFile> = {}): SessionFile {
  return {
    schema: "cc-dash/session@1",
    project: "test-project",
    session_id: "s_2026-03-01_work",
    started: "2026-03-01T10:00:00-07:00",
    last_updated: "2026-03-01T12:00:00-07:00",
    status: "in-progress",
    tasks: [],
    currentStatus: "Working on: Phase 3",
    decisions: [],
    failedAttempts: [],
    completedWork: [],
    filePath: "/projects/test-project/SESSION_PROGRESS.md",
    ...overrides,
  };
}

// --- Tests ---

describe("getRoadmapBySlug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadConfig.mockResolvedValue(defaultConfig);
  });

  it("returns roadmap data for a valid project slug", async () => {
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "Test Project",
        path: "/projects/test-project",
        roadmapPath: "/projects/test-project/ROADMAP.md",
        sessionPath: null,
        isExplicit: false,
      },
    ]);

    mockReadFile.mockResolvedValue("raw-roadmap");

    const roadmap = makeRoadmap();
    mockParseRoadmap.mockReturnValue({
      success: true,
      data: roadmap,
      preserved: {},
    });

    const result = await getRoadmapBySlug("test-project");

    expect(result).not.toBeNull();
    expect(result!.roadmap).toEqual(roadmap);
    expect(result!.projectName).toBe("Test Project");
    expect(result!.sessionRefs).toEqual({});
  });

  it("returns null when slug does not match any project", async () => {
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "Other Project",
        path: "/projects/other-project",
        roadmapPath: "/projects/other-project/ROADMAP.md",
        sessionPath: null,
        isExplicit: false,
      },
    ]);

    const result = await getRoadmapBySlug("nonexistent");
    expect(result).toBeNull();
  });

  it("returns null when project has no roadmap file", async () => {
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "No Roadmap",
        path: "/projects/no-roadmap",
        roadmapPath: null,
        sessionPath: "/projects/no-roadmap/SESSION_PROGRESS.md",
        isExplicit: false,
      },
    ]);

    const result = await getRoadmapBySlug("no-roadmap");
    expect(result).toBeNull();
  });

  it("includes session ref when session references a roadmap item", async () => {
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "With Session",
        path: "/projects/with-session",
        roadmapPath: "/projects/with-session/ROADMAP.md",
        sessionPath: "/projects/with-session/SESSION_PROGRESS.md",
        isExplicit: false,
      },
    ]);

    mockReadFile.mockImplementation((path: string) => {
      if (path.includes("ROADMAP")) return Promise.resolve("raw-roadmap");
      if (path.includes("SESSION")) return Promise.resolve("raw-session");
      return Promise.reject(new Error("not found"));
    });

    mockParseRoadmap.mockReturnValue({
      success: true,
      data: makeRoadmap({
        filePath: "/projects/with-session/ROADMAP.md",
      }),
      preserved: {},
    });

    mockParseSession.mockReturnValue({
      success: true,
      data: makeSession({
        roadmap_ref: "r_abc12",
        filePath: "/projects/with-session/SESSION_PROGRESS.md",
      }),
      preserved: {},
    });

    const result = await getRoadmapBySlug("with-session");

    expect(result).not.toBeNull();
    expect(result!.sessionRefs).toEqual({
      r_abc12: "/project/with-session/session",
    });
  });

  it("returns empty sessionRefs when project has no session", async () => {
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "No Session",
        path: "/projects/no-session",
        roadmapPath: "/projects/no-session/ROADMAP.md",
        sessionPath: null,
        isExplicit: false,
      },
    ]);

    mockReadFile.mockResolvedValue("raw-roadmap");

    mockParseRoadmap.mockReturnValue({
      success: true,
      data: makeRoadmap({
        filePath: "/projects/no-session/ROADMAP.md",
      }),
      preserved: {},
    });

    const result = await getRoadmapBySlug("no-session");

    expect(result).not.toBeNull();
    expect(result!.sessionRefs).toEqual({});
  });

  it("derives slug from directory basename, not frontmatter", async () => {
    // The project path ends with "my-dir-name" but frontmatter says "Different Name"
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "Different Name",
        path: "/projects/my-dir-name",
        roadmapPath: "/projects/my-dir-name/ROADMAP.md",
        sessionPath: null,
        isExplicit: false,
      },
    ]);

    mockReadFile.mockResolvedValue("raw-roadmap");

    mockParseRoadmap.mockReturnValue({
      success: true,
      data: makeRoadmap({
        project: "Different Name",
        filePath: "/projects/my-dir-name/ROADMAP.md",
      }),
      preserved: {},
    });

    // Look up by directory basename, not by frontmatter project name
    const result = await getRoadmapBySlug("my-dir-name");
    expect(result).not.toBeNull();
    expect(result!.projectName).toBe("Different Name");

    // Looking up by frontmatter name should NOT work
    const resultByName = await getRoadmapBySlug("Different Name");
    expect(resultByName).toBeNull();
  });
});
