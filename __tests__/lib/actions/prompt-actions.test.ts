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

const { mockDiscoverProjects, mockParseRoadmap, mockParseSession } = vi.hoisted(
  () => ({
    mockDiscoverProjects: vi.fn(),
    mockParseRoadmap: vi.fn(),
    mockParseSession: vi.fn(),
  }),
);

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

const { mockGetProjectCards } = vi.hoisted(() => ({
  mockGetProjectCards: vi.fn(),
}));
vi.mock("@/lib/projects/get-projects", () => ({
  getProjectCards: mockGetProjectCards,
}));

// Import AFTER mocks
import {
  generateProjectPrompt,
  generateCrossProjectPrompt,
} from "@/lib/actions/prompt-actions";

// --- Helpers ---

const defaultConfig = {
  scan_dirs: [],
  explicit_projects: [],
  exclude_dirs: [],
  scan_depth: 2,
};

function makeRoadmap(): RoadmapFile {
  return {
    schema: "cc-dash/roadmap@1",
    project: "test-project",
    description: "A test roadmap",
    last_updated: "2026-03-01T10:00:00-07:00",
    categories: [
      {
        title: "Core Features",
        slug: "core-features",
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
  };
}

function makeSession(): SessionFile {
  return {
    schema: "cc-dash/session@1",
    project: "test-project",
    session_id: "s_2026-03-05_feature-work",
    started: "2026-03-05T09:00:00-07:00",
    last_updated: "2026-03-05T12:00:00-07:00",
    status: "in-progress",
    tasks: [],
    currentStatus: "Working on: testing",
    decisions: [],
    failedAttempts: [],
    completedWork: [],
    filePath: "/projects/test-project/SESSION_PROGRESS.md",
  };
}

function setupMocks(opts: { hasRoadmap?: boolean; hasSession?: boolean } = {}) {
  const { hasRoadmap = true, hasSession = true } = opts;
  mockLoadConfig.mockResolvedValue(defaultConfig);
  mockDiscoverProjects.mockResolvedValue([
    {
      name: "Test Project",
      path: "/projects/test-project",
      roadmapPath: hasRoadmap ? "/projects/test-project/ROADMAP.md" : null,
      sessionPath: hasSession
        ? "/projects/test-project/SESSION_PROGRESS.md"
        : null,
      isExplicit: false,
    },
  ]);
  mockReadFile.mockResolvedValue("raw-content");
  if (hasRoadmap) {
    mockParseRoadmap.mockReturnValue({
      success: true,
      data: makeRoadmap(),
      preserved: { preamble: "", unknownSections: [], trailingContent: "" },
    });
  }
  if (hasSession) {
    mockParseSession.mockReturnValue({
      success: true,
      data: makeSession(),
      preserved: { unknownSections: [] },
    });
  }
}

// --- Tests ---

describe("generateProjectPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success with prompt for valid slug", async () => {
    setupMocks();

    const result = await generateProjectPrompt("test-project");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.prompt).toContain("cd /projects/test-project");
      expect(result.prompt).toContain("Project: Test Project");
    }
  });

  it("returns error for unknown slug", async () => {
    mockLoadConfig.mockResolvedValue(defaultConfig);
    mockDiscoverProjects.mockResolvedValue([]);

    const result = await generateProjectPrompt("nonexistent");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("not found");
    }
  });

  it("re-reads files fresh, not from cache", async () => {
    setupMocks();

    await generateProjectPrompt("test-project");

    // readFile should be called for both roadmap and session files
    expect(mockReadFile).toHaveBeenCalledWith(
      "/projects/test-project/ROADMAP.md",
      "utf-8",
    );
    expect(mockReadFile).toHaveBeenCalledWith(
      "/projects/test-project/SESSION_PROGRESS.md",
      "utf-8",
    );
  });
});

describe("generateCrossProjectPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success with prompt for best project", async () => {
    // Setup for cross-project: getProjectCards returns active project
    mockGetProjectCards.mockResolvedValue([
      {
        slug: "test-project",
        name: "Test Project",
        description: "A test",
        path: "/projects/test-project",
        doneCount: 0,
        totalCount: 1,
        hasActiveSession: true,
        sessionStatusText: "Working on: testing",
        lastUpdated: "2026-03-05T12:00:00Z",
        isStale: false,
        status: "active" as const,
      },
    ]);
    // Also setup for generateProjectPrompt which is called internally
    setupMocks();

    const result = await generateCrossProjectPrompt();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.prompt).toContain("cd /projects/test-project");
    }
  });

  it("returns empty state message when all projects complete", async () => {
    mockGetProjectCards.mockResolvedValue([
      {
        slug: "done-project",
        name: "Done Project",
        description: "All done",
        path: "/projects/done",
        doneCount: 5,
        totalCount: 5,
        hasActiveSession: false,
        sessionStatusText: null,
        lastUpdated: "2026-03-01T10:00:00Z",
        isStale: false,
        status: "complete" as const,
      },
    ]);

    const result = await generateCrossProjectPrompt();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("up to date");
    }
  });

  it("returns empty state message when no projects discovered", async () => {
    mockGetProjectCards.mockResolvedValue([]);

    const result = await generateCrossProjectPrompt();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("up to date");
    }
  });
});
