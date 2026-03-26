import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RoadmapFile, RoadmapItem } from "@/lib/schemas/roadmap";
import type { SessionFile } from "@/lib/schemas/session";
import type { SessionMeta } from "@/lib/projects/get-projects";

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

const { mockReadFile, mockStat } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
  mockStat: vi.fn(),
}));
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    default: { ...actual, readFile: mockReadFile, stat: mockStat },
    readFile: mockReadFile,
    stat: mockStat,
  };
});

// Import AFTER mocks
import {
  extractWorkingOn,
  deriveStatus,
  getProjectCards,
} from "@/lib/projects/get-projects";

// --- Helpers: factory functions for test data ---

function makeRoadmap(
  overrides: Partial<RoadmapFile> & {
    categories?: RoadmapFile["categories"];
  } = {},
): RoadmapFile {
  return {
    schema: "cc-dash/roadmap@1",
    project: "test-project",
    description: "A test project",
    last_updated: "2026-03-01T12:00:00-07:00",
    categories: [],
    filePath: "/projects/test/ROADMAP.md",
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
    currentStatus: "Working on: Phase 3 - Redis sessions\nNext: Phase 4",
    decisions: [],
    failedAttempts: [],
    completedWork: [],
    filePath: "/projects/test/SESSION_PROGRESS.md",
    ...overrides,
  };
}

function makeRoadmapItem(overrides: Partial<RoadmapItem> = {}): RoadmapItem {
  return {
    id: "r_abc12",
    status: "planned",
    name: "Test Item",
    description: "A test item",
    ...overrides,
  };
}

function makeSessionMeta(overrides: Partial<SessionMeta> = {}): SessionMeta {
  return {
    status: null,
    hasUncheckedTasks: false,
    exists: false,
    isSessionStale: false,
    ...overrides,
  };
}

// --- Tests ---

describe("extractWorkingOn", () => {
  it("extracts text after 'Working on:' line", () => {
    const result = extractWorkingOn(
      "Working on: Phase 3 - Redis sessions\nNext: Phase 4",
    );
    expect(result).toBe("Phase 3 - Redis sessions");
  });

  it("returns null when 'Working on:' is missing", () => {
    const result = extractWorkingOn("Some text without working on");
    expect(result).toBeNull();
  });

  it("handles bold markdown format '**Working on:**'", () => {
    const result = extractWorkingOn("**Working on:** Bold format");
    expect(result).toBe("Bold format");
  });
});

describe("deriveStatus", () => {
  it("returns 'active' when session is in-progress", () => {
    const meta = makeSessionMeta({ status: "in-progress", exists: true });
    const result = deriveStatus(null, meta);
    expect(result).toBe("active");
  });

  it("returns 'active' when session has unchecked tasks (even if paused)", () => {
    const meta = makeSessionMeta({
      status: "paused",
      hasUncheckedTasks: true,
      exists: true,
    });
    const result = deriveStatus(null, meta);
    expect(result).toBe("active");
  });

  it("returns 'complete' when all roadmap items are done", () => {
    const roadmap = makeRoadmap({
      categories: [
        {
          title: "Core",
          slug: "core",
          items: [
            makeRoadmapItem({ id: "r_abc12", status: "done" }),
            makeRoadmapItem({ id: "r_def34", status: "done" }),
          ],
        },
      ],
    });
    const meta = makeSessionMeta();
    const result = deriveStatus(roadmap, meta);
    expect(result).toBe("complete");
  });

  it("returns 'stalled' when session is paused with no unchecked tasks", () => {
    const roadmap = makeRoadmap({
      categories: [
        {
          title: "Core",
          slug: "core",
          items: [
            makeRoadmapItem({ id: "r_abc12", status: "done" }),
            makeRoadmapItem({ id: "r_def34", status: "planned" }),
          ],
        },
      ],
    });
    const meta = makeSessionMeta({ status: "paused", exists: true });
    const result = deriveStatus(roadmap, meta);
    expect(result).toBe("stalled");
  });

  it("returns 'stalled' when session is blocked", () => {
    const meta = makeSessionMeta({ status: "blocked", exists: true });
    const result = deriveStatus(null, meta);
    expect(result).toBe("stalled");
  });

  it("returns 'stalled' when session file is stale", () => {
    const meta = makeSessionMeta({
      status: "completed",
      exists: true,
      isSessionStale: true,
    });
    const result = deriveStatus(null, meta);
    expect(result).toBe("stalled");
  });

  it("returns 'inactive' when no session exists regardless of staleness", () => {
    const roadmap = makeRoadmap({
      categories: [
        {
          title: "Core",
          slug: "core",
          items: [makeRoadmapItem({ id: "r_abc12", status: "planned" })],
        },
      ],
    });
    const meta = makeSessionMeta({ exists: false, isSessionStale: false });
    const result = deriveStatus(roadmap, meta);
    expect(result).toBe("inactive");
  });

  it("returns 'inactive' as default when no session and not complete", () => {
    const roadmap = makeRoadmap({
      categories: [
        {
          title: "Core",
          slug: "core",
          items: [makeRoadmapItem({ id: "r_abc12", status: "planned" })],
        },
      ],
    });
    const meta = makeSessionMeta();
    const result = deriveStatus(roadmap, meta);
    expect(result).toBe("inactive");
  });

  it("session status overrides roadmap-only status", () => {
    // Even when all roadmap items are done, an active session means "active"
    const roadmap = makeRoadmap({
      categories: [
        {
          title: "Core",
          slug: "core",
          items: [
            makeRoadmapItem({ id: "r_abc12", status: "done" }),
            makeRoadmapItem({ id: "r_def34", status: "done" }),
          ],
        },
      ],
    });
    const meta = makeSessionMeta({ status: "in-progress", exists: true });
    const result = deriveStatus(roadmap, meta);
    expect(result).toBe("active");
  });
});

describe("stale detection", () => {
  it("marks project as stalled when session exists and is stale", () => {
    const roadmap = makeRoadmap({
      categories: [
        {
          title: "Core",
          slug: "core",
          items: [makeRoadmapItem({ status: "planned" })],
        },
      ],
    });
    const meta = makeSessionMeta({ exists: true, isSessionStale: true });
    const result = deriveStatus(roadmap, meta);
    expect(result).toBe("stalled");
  });

  it("marks project as inactive when no session and not complete", () => {
    const roadmap = makeRoadmap({
      categories: [
        {
          title: "Core",
          slug: "core",
          items: [makeRoadmapItem({ status: "planned" })],
        },
      ],
    });
    const meta = makeSessionMeta();
    const result = deriveStatus(roadmap, meta);
    expect(result).toBe("inactive");
  });

  it("marks project as inactive when no session exists and null timestamps", () => {
    // No session → inactive, not stalled (stalled requires a session)
    const meta = makeSessionMeta();
    const result = deriveStatus(null, meta);
    expect(result).toBe("inactive");
  });
});

describe("sorting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStat.mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );
  });

  it("sorts projects descending by lastUpdated", async () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    mockLoadConfig.mockResolvedValue({
      scan_dirs: [],
      explicit_projects: [],
      exclude_dirs: [],
      scan_depth: 2,
    });

    mockDiscoverProjects.mockResolvedValue([
      {
        name: "older-project",
        slug: "older-project",
        path: "/projects/older-project",
        roadmapPath: "/projects/older-project/ROADMAP.md",
        sessionPath: null,
        isExplicit: false,
      },
      {
        name: "newer-project",
        slug: "newer-project",
        path: "/projects/newer-project",
        roadmapPath: "/projects/newer-project/ROADMAP.md",
        sessionPath: null,
        isExplicit: false,
      },
    ]);

    mockReadFile.mockImplementation((path: string) => {
      if (path === "/projects/older-project/ROADMAP.md")
        return Promise.resolve("raw-older");
      if (path === "/projects/newer-project/ROADMAP.md")
        return Promise.resolve("raw-newer");
      return Promise.reject(new Error("not found"));
    });

    mockParseRoadmap.mockImplementation((_raw: string, filePath: string) => {
      if (filePath.includes("older-project")) {
        return {
          success: true,
          data: makeRoadmap({
            project: "older-project",
            last_updated: fiveDaysAgo.toISOString(),
            categories: [],
            filePath,
          }),
          preserved: {},
        };
      }
      return {
        success: true,
        data: makeRoadmap({
          project: "newer-project",
          last_updated: twoDaysAgo.toISOString(),
          categories: [],
          filePath,
        }),
        preserved: {},
      };
    });

    mockParseSession.mockReturnValue({ success: false, errors: [] });

    const cards = await getProjectCards();
    expect(cards).toHaveLength(2);
    expect(cards[0].slug).toBe("newer-project");
    expect(cards[1].slug).toBe("older-project");
  });

  it("sorts projects with null lastUpdated last", async () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    mockLoadConfig.mockResolvedValue({
      scan_dirs: [],
      explicit_projects: [],
      exclude_dirs: [],
      scan_depth: 2,
    });

    mockDiscoverProjects.mockResolvedValue([
      {
        name: "no-timestamp",
        slug: "no-timestamp",
        path: "/projects/no-timestamp",
        roadmapPath: null,
        sessionPath: null,
        isExplicit: true,
      },
      {
        name: "has-timestamp",
        slug: "has-timestamp",
        path: "/projects/has-timestamp",
        roadmapPath: "/projects/has-timestamp/ROADMAP.md",
        sessionPath: null,
        isExplicit: false,
      },
    ]);

    mockReadFile.mockImplementation((path: string) => {
      if (path === "/projects/has-timestamp/ROADMAP.md")
        return Promise.resolve("raw");
      return Promise.reject(new Error("not found"));
    });

    mockParseRoadmap.mockImplementation((_raw: string, filePath: string) => ({
      success: true,
      data: makeRoadmap({
        project: "has-timestamp",
        last_updated: twoDaysAgo.toISOString(),
        categories: [],
        filePath,
      }),
      preserved: {},
    }));

    mockParseSession.mockReturnValue({ success: false, errors: [] });

    const cards = await getProjectCards();
    expect(cards).toHaveLength(2);
    expect(cards[0].slug).toBe("has-timestamp");
    expect(cards[1].slug).toBe("no-timestamp");
    expect(cards[1].lastUpdated).toBeNull();
  });
});

describe("getProjectCards aggregation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: stat rejects with ENOENT (no file mtimes)
    mockStat.mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );
  });

  it("degrades gracefully when a project file fails to parse", async () => {
    mockLoadConfig.mockResolvedValue({
      scan_dirs: [],
      explicit_projects: [],
      exclude_dirs: [],
      scan_depth: 2,
    });

    mockDiscoverProjects.mockResolvedValue([
      {
        name: "good-project",
        slug: "good-project",
        path: "/projects/good-project",
        roadmapPath: "/projects/good-project/ROADMAP.md",
        sessionPath: null,
        isExplicit: false,
      },
      {
        name: "bad-project",
        slug: "bad-project",
        path: "/projects/bad-project",
        roadmapPath: "/projects/bad-project/ROADMAP.md",
        sessionPath: null,
        isExplicit: false,
      },
    ]);

    mockReadFile.mockImplementation((path: string) => {
      if (path === "/projects/good-project/ROADMAP.md")
        return Promise.resolve("raw-good");
      if (path === "/projects/bad-project/ROADMAP.md")
        return Promise.resolve("raw-bad");
      return Promise.reject(new Error("not found"));
    });

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    mockParseRoadmap.mockImplementation((_raw: string, filePath: string) => {
      if (filePath.includes("good-project")) {
        return {
          success: true,
          data: makeRoadmap({
            project: "good-project",
            last_updated: oneDayAgo.toISOString(),
            categories: [
              {
                title: "Core",
                slug: "core",
                items: [
                  makeRoadmapItem({ id: "r_abc12", status: "done" }),
                  makeRoadmapItem({ id: "r_def34", status: "planned" }),
                ],
              },
            ],
            filePath,
          }),
          preserved: {},
        };
      }
      // Bad project: parse failure
      return {
        success: false,
        errors: [{ message: "Invalid frontmatter", path: [] }],
      };
    });

    mockParseSession.mockReturnValue({ success: false, errors: [] });

    const cards = await getProjectCards();
    // Both projects should be returned (graceful degradation)
    expect(cards).toHaveLength(2);

    const goodCard = cards.find((c) => c.slug === "good-project");
    const badCard = cards.find((c) => c.slug === "bad-project");

    expect(goodCard).toBeDefined();
    expect(goodCard!.doneCount).toBe(1);
    expect(goodCard!.totalCount).toBe(2);

    // Bad project degrades to zero counts
    expect(badCard).toBeDefined();
    expect(badCard!.doneCount).toBe(0);
    expect(badCard!.totalCount).toBe(0);
  });

  it("computes progress counts from roadmap items", async () => {
    mockLoadConfig.mockResolvedValue({
      scan_dirs: [],
      explicit_projects: [],
      exclude_dirs: [],
      scan_depth: 2,
    });

    mockDiscoverProjects.mockResolvedValue([
      {
        name: "my-project",
        slug: "my-project",
        path: "/projects/my-project",
        roadmapPath: "/projects/my-project/ROADMAP.md",
        sessionPath: null,
        isExplicit: false,
      },
    ]);

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    mockReadFile.mockResolvedValue("raw-roadmap");

    mockParseRoadmap.mockReturnValue({
      success: true,
      data: makeRoadmap({
        project: "my-project",
        last_updated: oneDayAgo.toISOString(),
        categories: [
          {
            title: "Core",
            slug: "core",
            items: [
              makeRoadmapItem({ id: "r_aaa11", status: "done" }),
              makeRoadmapItem({ id: "r_bbb22", status: "done" }),
              makeRoadmapItem({ id: "r_ccc33", status: "planned" }),
            ],
          },
          {
            title: "Extra",
            slug: "extra",
            items: [
              makeRoadmapItem({ id: "r_ddd44", status: "in-progress" }),
              makeRoadmapItem({ id: "r_eee55", status: "idea" }),
            ],
          },
        ],
        filePath: "/projects/my-project/ROADMAP.md",
      }),
      preserved: {},
    });

    mockParseSession.mockReturnValue({ success: false, errors: [] });

    const cards = await getProjectCards();
    expect(cards).toHaveLength(1);
    expect(cards[0].doneCount).toBe(2);
    expect(cards[0].totalCount).toBe(5);
  });

  it("returns project with null roadmapPath and null sessionPath as inactive", async () => {
    mockLoadConfig.mockResolvedValue({
      scan_dirs: [],
      explicit_projects: [],
      exclude_dirs: [],
      scan_depth: 2,
    });

    mockDiscoverProjects.mockResolvedValue([
      {
        name: "empty-project",
        slug: "empty-project",
        path: "/projects/empty-project",
        roadmapPath: null,
        sessionPath: null,
        isExplicit: true,
      },
    ]);

    const cards = await getProjectCards();
    expect(cards).toHaveLength(1);
    expect(cards[0].status).toBe("inactive");
    expect(cards[0].doneCount).toBe(0);
    expect(cards[0].totalCount).toBe(0);
    expect(cards[0].isStale).toBe(true);
    expect(cards[0].lastUpdated).toBeNull();
  });

  it("computes stale correctly: 8 days ago is stale, 6 days is not", async () => {
    const now = Date.now();
    const eightDaysAgo = new Date(now - 8 * 24 * 60 * 60 * 1000);
    const sixDaysAgo = new Date(now - 6 * 24 * 60 * 60 * 1000);

    mockLoadConfig.mockResolvedValue({
      scan_dirs: [],
      explicit_projects: [],
      exclude_dirs: [],
      scan_depth: 2,
    });

    mockDiscoverProjects.mockResolvedValue([
      {
        name: "stale-project",
        slug: "stale-project",
        path: "/projects/stale-project",
        roadmapPath: "/projects/stale-project/ROADMAP.md",
        sessionPath: null,
        isExplicit: false,
      },
      {
        name: "fresh-project",
        slug: "fresh-project",
        path: "/projects/fresh-project",
        roadmapPath: "/projects/fresh-project/ROADMAP.md",
        sessionPath: null,
        isExplicit: false,
      },
    ]);

    mockReadFile.mockImplementation((path: string) => {
      if (path.includes("stale-project")) return Promise.resolve("raw-stale");
      if (path.includes("fresh-project")) return Promise.resolve("raw-fresh");
      return Promise.reject(new Error("not found"));
    });

    mockParseRoadmap.mockImplementation((_raw: string, filePath: string) => {
      if (filePath.includes("stale-project")) {
        return {
          success: true,
          data: makeRoadmap({
            project: "stale-project",
            last_updated: eightDaysAgo.toISOString(),
            categories: [
              {
                title: "Core",
                slug: "core",
                items: [makeRoadmapItem({ status: "planned" })],
              },
            ],
            filePath,
          }),
          preserved: {},
        };
      }
      return {
        success: true,
        data: makeRoadmap({
          project: "fresh-project",
          last_updated: sixDaysAgo.toISOString(),
          categories: [
            {
              title: "Core",
              slug: "core",
              items: [makeRoadmapItem({ status: "planned" })],
            },
          ],
          filePath,
        }),
        preserved: {},
      };
    });

    mockParseSession.mockReturnValue({ success: false, errors: [] });

    const cards = await getProjectCards();
    const staleCard = cards.find((c) => c.slug === "stale-project");
    const freshCard = cards.find((c) => c.slug === "fresh-project");

    expect(staleCard!.isStale).toBe(true);
    // No session file → inactive, not stalled (stalled requires a session)
    expect(staleCard!.status).toBe("inactive");

    expect(freshCard!.isStale).toBe(false);
    expect(freshCard!.status).toBe("inactive");
  });

  it("includes sessionStatusText when session is in-progress", async () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    mockLoadConfig.mockResolvedValue({
      scan_dirs: [],
      explicit_projects: [],
      exclude_dirs: [],
      scan_depth: 2,
    });

    mockDiscoverProjects.mockResolvedValue([
      {
        name: "active-project",
        slug: "active-project",
        path: "/projects/active-project",
        roadmapPath: "/projects/active-project/ROADMAP.md",
        sessionPath: "/projects/active-project/SESSION_PROGRESS.md",
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
        project: "active-project",
        last_updated: oneDayAgo.toISOString(),
        categories: [],
        filePath: "/projects/active-project/ROADMAP.md",
      }),
      preserved: {},
    });

    mockParseSession.mockReturnValue({
      success: true,
      data: makeSession({
        project: "active-project",
        status: "in-progress",
        last_updated: oneDayAgo.toISOString(),
        currentStatus: "Working on: Phase 3 - Redis sessions\nNext: Phase 4",
      }),
      preserved: {},
    });

    const cards = await getProjectCards();
    expect(cards).toHaveLength(1);
    expect(cards[0].hasActiveSession).toBe(true);
    expect(cards[0].sessionStatusText).toBe("Phase 3 - Redis sessions");
    expect(cards[0].status).toBe("active");
  });
});
