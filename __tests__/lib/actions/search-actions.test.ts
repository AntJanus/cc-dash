import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks must be set up before importing the module under test ---

const { mockLoadConfig } = vi.hoisted(() => ({
  mockLoadConfig: vi.fn(),
}));
vi.mock("@/lib/config", () => ({
  loadConfig: mockLoadConfig,
}));

const {
  mockDiscoverProjects,
  mockParseRoadmap,
  mockParseSession,
  mockParseIdeas,
} = vi.hoisted(() => ({
  mockDiscoverProjects: vi.fn(),
  mockParseRoadmap: vi.fn(),
  mockParseSession: vi.fn(),
  mockParseIdeas: vi.fn(),
}));
vi.mock("@/lib/fs", () => ({
  discoverProjects: mockDiscoverProjects,
  parseRoadmap: mockParseRoadmap,
  parseSession: mockParseSession,
  parseIdeas: mockParseIdeas,
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

const { mockExpandTilde } = vi.hoisted(() => ({
  mockExpandTilde: vi.fn(),
}));
vi.mock("@/lib/fs/discovery", () => ({
  expandTilde: mockExpandTilde,
}));

// Import AFTER mocks
import { searchAllProjects } from "@/lib/actions/search-actions";
import type { SearchResults } from "@/lib/actions/search-actions";

// --- Helpers ---

function makeConfig(overrides: Record<string, unknown> = {}) {
  return {
    scan_dirs: ["/projects"],
    explicit_projects: [],
    exclude_dirs: ["node_modules", ".git"],
    scan_depth: 2,
    ...overrides,
  };
}

function makeDiscoveredProject(overrides: Record<string, unknown> = {}) {
  return {
    name: "My Project",
    slug: "my-project",
    path: "/projects/my-project",
    roadmapPath: "/projects/my-project/ROADMAP.md",
    sessionPath: "/projects/my-project/SESSION_PROGRESS.md",
    qaPath: null,
    isExplicit: false,
    ...overrides,
  };
}

function makeRoadmapResult(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    data: {
      schema: "cc-dash/roadmap@1",
      project: "My Project",
      description: "A test project",
      last_updated: "2026-03-17T10:00:00.000Z",
      categories: [
        {
          title: "Core Features",
          slug: "core",
          items: [
            {
              id: "r_abc12",
              status: "planned",
              name: "Build search",
              description: "Implement cross-project search feature",
            },
            {
              id: "r_def34",
              status: "done",
              name: "Add roadmap",
              description: "Setup roadmap file",
            },
          ],
        },
      ],
      filePath: "/projects/my-project/ROADMAP.md",
    },
    preserved: { preamble: "", unknownSections: [], trailingContent: "" },
    ...overrides,
  };
}

function makeSessionResult(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    data: {
      schema: "cc-dash/session@1",
      project: "My Project",
      session_id: "s_2026-03-17_feature-work",
      started: "2026-03-17T10:00:00.000Z",
      last_updated: "2026-03-17T12:00:00.000Z",
      status: "in-progress",
      tasks: [
        {
          id: "t_a1b2c",
          checked: false,
          dependency: "none",
          description: "Implement search UI component",
        },
        {
          id: "t_d3e4f",
          checked: true,
          dependency: "t_a1b2c",
          description: "Write tests for search",
        },
      ],
      currentStatus: "Working on: search implementation",
      decisions: [],
      failedAttempts: [],
      completedWork: [],
      filePath: "/projects/my-project/SESSION_PROGRESS.md",
    },
    preserved: { preamble: "", unknownSections: [], trailingContent: "" },
    ...overrides,
  };
}

function makeIdeasResult(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    data: {
      schema: "cc-dash/ideas@1",
      last_updated: "2026-03-17T10:00:00.000Z",
      ideas: [
        {
          id: "i_abc12",
          status: "not-started",
          title: "Search feature idea",
          body: "Build a search system for cross-project discovery",
          stack: ["TypeScript", "React"],
        },
        {
          id: "i_def34",
          status: "started",
          title: "CLI export tool",
          body: "Command line tool to export project data",
          path: "cli-export",
        },
      ],
      filePath: "/path/to/PROJECT_IDEAS.md",
    },
    preserved: { preamble: "", trailingContent: "" },
    ...overrides,
  };
}

function setupFullMocks() {
  mockLoadConfig.mockResolvedValue(
    makeConfig({ ideas_file: "~/PROJECT_IDEAS.md" }),
  );
  mockDiscoverProjects.mockResolvedValue([makeDiscoveredProject()]);
  mockReadFile.mockResolvedValue("raw content");
  mockParseRoadmap.mockReturnValue(makeRoadmapResult());
  mockParseSession.mockReturnValue(makeSessionResult());
  mockExpandTilde.mockReturnValue("/path/to/PROJECT_IDEAS.md");
  mockParseIdeas.mockReturnValue(makeIdeasResult());
}

// --- Tests ---

describe("searchAllProjects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("empty query", () => {
    it("returns empty results for empty string", async () => {
      mockLoadConfig.mockResolvedValue(makeConfig());
      mockDiscoverProjects.mockResolvedValue([]);

      const result = await searchAllProjects("");
      expect(result.roadmapItems).toHaveLength(0);
      expect(result.sessionTasks).toHaveLength(0);
      expect(result.ideas).toHaveLength(0);
    });

    it("returns empty results for whitespace-only string", async () => {
      mockLoadConfig.mockResolvedValue(makeConfig());
      mockDiscoverProjects.mockResolvedValue([]);

      const result = await searchAllProjects("   ");
      expect(result.roadmapItems).toHaveLength(0);
      expect(result.sessionTasks).toHaveLength(0);
      expect(result.ideas).toHaveLength(0);
    });

    it("does not call discoverProjects for empty query", async () => {
      await searchAllProjects("");
      expect(mockDiscoverProjects).not.toHaveBeenCalled();
    });
  });

  describe("roadmap item search", () => {
    it("matches roadmap item by name", async () => {
      setupFullMocks();

      const result = await searchAllProjects("search");
      expect(result.roadmapItems).toHaveLength(1);
      expect(result.roadmapItems[0].title).toBe("Build search");
    });

    it("matches roadmap item by description", async () => {
      setupFullMocks();

      const result = await searchAllProjects("cross-project search");
      expect(result.roadmapItems).toHaveLength(1);
      expect(result.roadmapItems[0].itemId).toBe("r_abc12");
    });

    it("is case-insensitive for roadmap items", async () => {
      setupFullMocks();

      const result = await searchAllProjects("BUILD SEARCH");
      expect(result.roadmapItems).toHaveLength(1);
      expect(result.roadmapItems[0].title).toBe("Build search");
    });

    it("includes correct project info in roadmap result", async () => {
      setupFullMocks();

      const result = await searchAllProjects("search");
      const item = result.roadmapItems[0];
      expect(item.projectSlug).toBe("my-project");
      expect(item.projectName).toBe("My Project");
      expect(item.type).toBe("roadmap");
      expect(item.status).toBe("planned");
      expect(item.link).toBe("/project/my-project/roadmap");
    });

    it("returns multiple matching roadmap items", async () => {
      setupFullMocks();

      // Both "Build search" and "Add roadmap" match "a"
      const result = await searchAllProjects("add");
      expect(result.roadmapItems).toHaveLength(1);
      expect(result.roadmapItems[0].title).toBe("Add roadmap");
    });

    it("returns empty roadmap results when no match", async () => {
      setupFullMocks();

      const result = await searchAllProjects("nonexistent-xyz-123");
      expect(result.roadmapItems).toHaveLength(0);
    });

    it("skips projects without roadmapPath", async () => {
      mockLoadConfig.mockResolvedValue(makeConfig());
      mockDiscoverProjects.mockResolvedValue([
        makeDiscoveredProject({ roadmapPath: null }),
      ]);
      mockReadFile.mockResolvedValue("raw content");
      mockParseSession.mockReturnValue(makeSessionResult());

      const result = await searchAllProjects("search");
      expect(result.roadmapItems).toHaveLength(0);
    });

    it("skips project on roadmap read error", async () => {
      mockLoadConfig.mockResolvedValue(makeConfig());
      mockDiscoverProjects.mockResolvedValue([makeDiscoveredProject()]);
      // readFile throws for roadmap but not for session
      mockReadFile.mockRejectedValue(new Error("ENOENT"));

      const result = await searchAllProjects("search");
      expect(result.roadmapItems).toHaveLength(0);
    });

    it("skips project when roadmap parse fails", async () => {
      mockLoadConfig.mockResolvedValue(makeConfig());
      mockDiscoverProjects.mockResolvedValue([makeDiscoveredProject()]);
      mockReadFile.mockResolvedValue("raw content");
      mockParseRoadmap.mockReturnValue({ success: false, errors: [] });
      mockParseSession.mockReturnValue({ success: false, errors: [] });

      const result = await searchAllProjects("search");
      expect(result.roadmapItems).toHaveLength(0);
    });
  });

  describe("session task search", () => {
    it("matches session task by description", async () => {
      setupFullMocks();

      const result = await searchAllProjects("search UI");
      expect(result.sessionTasks).toHaveLength(1);
      expect(result.sessionTasks[0].title).toBe(
        "Implement search UI component",
      );
    });

    it("is case-insensitive for session tasks", async () => {
      setupFullMocks();

      const result = await searchAllProjects("IMPLEMENT SEARCH");
      expect(result.sessionTasks).toHaveLength(1);
    });

    it("includes correct session task info", async () => {
      setupFullMocks();

      const result = await searchAllProjects("search UI");
      const task = result.sessionTasks[0];
      expect(task.projectSlug).toBe("my-project");
      expect(task.projectName).toBe("My Project");
      expect(task.itemId).toBe("t_a1b2c");
      expect(task.type).toBe("session");
      expect(task.status).toBe("pending");
      expect(task.link).toBe("/project/my-project/session");
    });

    it("sets status to done for checked tasks", async () => {
      setupFullMocks();

      const result = await searchAllProjects("Write tests");
      expect(result.sessionTasks).toHaveLength(1);
      expect(result.sessionTasks[0].status).toBe("done");
    });

    it("skips projects without sessionPath", async () => {
      mockLoadConfig.mockResolvedValue(makeConfig());
      mockDiscoverProjects.mockResolvedValue([
        makeDiscoveredProject({ sessionPath: null }),
      ]);
      mockReadFile.mockResolvedValue("raw content");
      mockParseRoadmap.mockReturnValue(makeRoadmapResult());

      const result = await searchAllProjects("search");
      expect(result.sessionTasks).toHaveLength(0);
    });

    it("stores session_id as description", async () => {
      setupFullMocks();

      const result = await searchAllProjects("search UI");
      expect(result.sessionTasks[0].description).toBe(
        "s_2026-03-17_feature-work",
      );
    });
  });

  describe("ideas search", () => {
    it("matches idea by title", async () => {
      setupFullMocks();

      const result = await searchAllProjects("Search feature");
      expect(result.ideas).toHaveLength(1);
      expect(result.ideas[0].title).toBe("Search feature idea");
    });

    it("matches idea by body", async () => {
      setupFullMocks();

      const result = await searchAllProjects("cross-project discovery");
      expect(result.ideas).toHaveLength(1);
      expect(result.ideas[0].itemId).toBe("i_abc12");
    });

    it("is case-insensitive for ideas", async () => {
      setupFullMocks();

      const result = await searchAllProjects("SEARCH FEATURE");
      expect(result.ideas).toHaveLength(1);
    });

    it("includes correct idea info", async () => {
      setupFullMocks();

      const result = await searchAllProjects("Search feature");
      const idea = result.ideas[0];
      expect(idea.projectSlug).toBe("ideas");
      expect(idea.projectName).toBe("Project Ideas");
      expect(idea.type).toBe("idea");
      expect(idea.status).toBe("not-started");
      expect(idea.link).toBe("/ideas");
    });

    it("truncates long idea body to 200 chars in description", async () => {
      const longBody = "A".repeat(300);
      const ideasResult = makeIdeasResult();
      (ideasResult.data.ideas[0] as Record<string, unknown>).body = longBody;
      mockLoadConfig.mockResolvedValue(
        makeConfig({ ideas_file: "~/PROJECT_IDEAS.md" }),
      );
      mockDiscoverProjects.mockResolvedValue([]);
      mockReadFile.mockResolvedValue("raw content");
      mockExpandTilde.mockReturnValue("/path/to/PROJECT_IDEAS.md");
      mockParseIdeas.mockReturnValue(ideasResult);

      const result = await searchAllProjects("AAAA");
      expect(result.ideas[0].description).toHaveLength(200);
    });

    it("returns empty ideas when no ideas_file configured", async () => {
      mockLoadConfig.mockResolvedValue(makeConfig()); // no ideas_file
      mockDiscoverProjects.mockResolvedValue([]);

      const result = await searchAllProjects("search");
      expect(result.ideas).toHaveLength(0);
    });

    it("returns empty ideas when ideas parse fails", async () => {
      mockLoadConfig.mockResolvedValue(
        makeConfig({ ideas_file: "~/PROJECT_IDEAS.md" }),
      );
      mockDiscoverProjects.mockResolvedValue([]);
      mockReadFile.mockResolvedValue("raw content");
      mockExpandTilde.mockReturnValue("/path/to/PROJECT_IDEAS.md");
      mockParseIdeas.mockReturnValue({ success: false, errors: [] });

      const result = await searchAllProjects("search");
      expect(result.ideas).toHaveLength(0);
    });
  });

  describe("multi-project search", () => {
    it("aggregates results across multiple projects", async () => {
      const project1 = makeDiscoveredProject({
        name: "Project Alpha",
        slug: "project-alpha",
        path: "/projects/project-alpha",
        roadmapPath: "/projects/project-alpha/ROADMAP.md",
        sessionPath: null,
      });
      const project2 = makeDiscoveredProject({
        name: "Project Beta",
        slug: "project-beta",
        path: "/projects/project-beta",
        roadmapPath: "/projects/project-beta/ROADMAP.md",
        sessionPath: null,
      });

      mockLoadConfig.mockResolvedValue(makeConfig());
      mockDiscoverProjects.mockResolvedValue([project1, project2]);
      mockReadFile.mockResolvedValue("raw content");
      mockParseRoadmap.mockReturnValue(makeRoadmapResult());

      const result = await searchAllProjects("search");
      // Both projects have "Build search" — expect 2 results
      expect(result.roadmapItems).toHaveLength(2);
    });

    it("continues searching other projects when one fails", async () => {
      const project1 = makeDiscoveredProject({
        name: "Project Alpha",
        slug: "project-alpha",
        roadmapPath: "/projects/alpha/ROADMAP.md",
        sessionPath: null,
      });
      const project2 = makeDiscoveredProject({
        name: "Project Beta",
        slug: "project-beta",
        roadmapPath: "/projects/beta/ROADMAP.md",
        sessionPath: null,
      });

      mockLoadConfig.mockResolvedValue(makeConfig());
      mockDiscoverProjects.mockResolvedValue([project1, project2]);
      // First project throws, second succeeds
      mockReadFile
        .mockRejectedValueOnce(new Error("ENOENT"))
        .mockResolvedValue("raw content");
      mockParseRoadmap.mockReturnValue(makeRoadmapResult());

      const result = await searchAllProjects("search");
      expect(result.roadmapItems).toHaveLength(1);
    });
  });

  describe("result structure", () => {
    it("always returns all three result groups", async () => {
      setupFullMocks();

      const result: SearchResults = await searchAllProjects("xyz-no-match");
      expect(result).toHaveProperty("roadmapItems");
      expect(result).toHaveProperty("sessionTasks");
      expect(result).toHaveProperty("ideas");
      expect(Array.isArray(result.roadmapItems)).toBe(true);
      expect(Array.isArray(result.sessionTasks)).toBe(true);
      expect(Array.isArray(result.ideas)).toBe(true);
    });
  });
});
