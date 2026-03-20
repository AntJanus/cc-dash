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

import { getRecentActivity } from "@/lib/activity/get-activity";

// Helper: mock a discovered project
function makeProject(
  overrides: Partial<{
    name: string;
    path: string;
    roadmapPath: string | null;
    sessionPath: string | null;
  }> = {},
) {
  return {
    name: overrides.name ?? "TestProject",
    path: overrides.path ?? "/projects/test-project",
    roadmapPath: overrides.roadmapPath ?? null,
    sessionPath: overrides.sessionPath ?? null,
    isExplicit: false,
  };
}

describe("getRecentActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadConfig.mockResolvedValue({ scan_dirs: ["/projects"] });
    mockDiscoverProjects.mockResolvedValue([]);
    mockReadFile.mockResolvedValue("");
  });

  it("returns empty array when no projects", async () => {
    const events = await getRecentActivity();
    expect(events).toEqual([]);
  });

  it("extracts roadmap_item_completed events", async () => {
    mockDiscoverProjects.mockResolvedValue([
      makeProject({ roadmapPath: "/projects/test-project/ROADMAP.md" }),
    ]);
    mockReadFile.mockResolvedValue("raw");
    mockParseRoadmap.mockReturnValue({
      success: true,
      data: {
        categories: [
          {
            slug: "core",
            title: "Core",
            items: [
              {
                id: "r_abc12",
                status: "done",
                name: "Phase 1",
                description: "Setup",
                completed: "2026-03-15",
              },
            ],
          },
        ],
      },
    });

    const events = await getRecentActivity();

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("roadmap_item_completed");
    expect(events[0].title).toBe("Completed: Phase 1");
    expect(events[0].projectSlug).toBe("test-project");
    expect(events[0].timestamp).toBe("2026-03-15T00:00:00Z");
  });

  it("extracts roadmap_item_started events", async () => {
    mockDiscoverProjects.mockResolvedValue([
      makeProject({ roadmapPath: "/projects/test-project/ROADMAP.md" }),
    ]);
    mockReadFile.mockResolvedValue("raw");
    mockParseRoadmap.mockReturnValue({
      success: true,
      data: {
        categories: [
          {
            slug: "core",
            title: "Core",
            items: [
              {
                id: "r_def34",
                status: "in-progress",
                name: "Phase 2",
                description: "Build",
                started: "2026-03-10",
              },
            ],
          },
        ],
      },
    });

    const events = await getRecentActivity();

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("roadmap_item_started");
    expect(events[0].title).toBe("Started: Phase 2");
  });

  it("extracts session_started events", async () => {
    mockDiscoverProjects.mockResolvedValue([
      makeProject({
        sessionPath: "/projects/test-project/SESSION_PROGRESS.md",
      }),
    ]);
    mockReadFile.mockResolvedValue("raw");
    mockParseSession.mockReturnValue({
      success: true,
      data: {
        session_id: "s_2026-03-15_work",
        started: "2026-03-15T10:00:00-07:00",
        status: "in-progress",
        completedWork: [],
      },
    });

    const events = await getRecentActivity();

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("session_started");
    expect(events[0].title).toBe("Session started: s_2026-03-15_work");
  });

  it("extracts session_work_completed events", async () => {
    mockDiscoverProjects.mockResolvedValue([
      makeProject({
        sessionPath: "/projects/test-project/SESSION_PROGRESS.md",
      }),
    ]);
    mockReadFile.mockResolvedValue("raw");
    mockParseSession.mockReturnValue({
      success: true,
      data: {
        session_id: "s_2026-03-15_work",
        started: "2026-03-15T10:00:00-07:00",
        status: "in-progress",
        completedWork: [
          {
            taskRef: "t_abc12",
            timestamp: "2026-03-15T14:00:00-07:00",
            description: "Implemented login",
          },
        ],
      },
    });

    const events = await getRecentActivity();

    expect(events.some((e) => e.type === "session_work_completed")).toBe(true);
    const workEvent = events.find((e) => e.type === "session_work_completed")!;
    expect(workEvent.title).toBe("Work completed: Implemented login");
  });

  it("sorts events by timestamp descending", async () => {
    mockDiscoverProjects.mockResolvedValue([
      makeProject({ roadmapPath: "/projects/test/ROADMAP.md" }),
    ]);
    mockReadFile.mockResolvedValue("raw");
    mockParseRoadmap.mockReturnValue({
      success: true,
      data: {
        categories: [
          {
            slug: "core",
            title: "Core",
            items: [
              {
                id: "r_aaa11",
                status: "done",
                name: "First",
                description: "",
                completed: "2026-03-01",
              },
              {
                id: "r_bbb22",
                status: "done",
                name: "Second",
                description: "",
                completed: "2026-03-15",
              },
              {
                id: "r_ccc33",
                status: "done",
                name: "Third",
                description: "",
                completed: "2026-03-10",
              },
            ],
          },
        ],
      },
    });

    const events = await getRecentActivity();

    expect(events[0].title).toContain("Second");
    expect(events[1].title).toContain("Third");
    expect(events[2].title).toContain("First");
  });

  it("respects limit parameter", async () => {
    mockDiscoverProjects.mockResolvedValue([
      makeProject({ roadmapPath: "/projects/test/ROADMAP.md" }),
    ]);
    mockReadFile.mockResolvedValue("raw");
    mockParseRoadmap.mockReturnValue({
      success: true,
      data: {
        categories: [
          {
            slug: "core",
            title: "Core",
            items: [
              {
                id: "r_aaa11",
                status: "done",
                name: "A",
                description: "",
                completed: "2026-03-01",
              },
              {
                id: "r_bbb22",
                status: "done",
                name: "B",
                description: "",
                completed: "2026-03-02",
              },
              {
                id: "r_ccc33",
                status: "done",
                name: "C",
                description: "",
                completed: "2026-03-03",
              },
            ],
          },
        ],
      },
    });

    const events = await getRecentActivity(2);

    expect(events).toHaveLength(2);
  });

  it("handles unreadable files gracefully", async () => {
    mockDiscoverProjects.mockResolvedValue([
      makeProject({ roadmapPath: "/projects/test/ROADMAP.md" }),
    ]);
    mockReadFile.mockRejectedValue(new Error("ENOENT"));

    const events = await getRecentActivity();

    expect(events).toEqual([]);
  });

  it("handles parse failures gracefully", async () => {
    mockDiscoverProjects.mockResolvedValue([
      makeProject({ roadmapPath: "/projects/test/ROADMAP.md" }),
    ]);
    mockReadFile.mockResolvedValue("raw");
    mockParseRoadmap.mockReturnValue({ success: false, error: "bad" });

    const events = await getRecentActivity();

    expect(events).toEqual([]);
  });
});
