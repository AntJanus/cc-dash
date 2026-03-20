import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SessionFile } from "@/lib/schemas/session";
import type { SessionParseResult } from "@/lib/fs/types";

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

const { mockParseSession } = vi.hoisted(() => ({
  mockParseSession: vi.fn(),
}));

vi.mock("@/lib/fs", () => ({
  discoverProjects: mockDiscoverProjects,
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
import { getSessionBySlug } from "@/lib/projects/get-session";

// --- Helpers ---

const defaultConfig = {
  scan_dirs: [],
  explicit_projects: [],
  exclude_dirs: [],
  scan_depth: 2,
};

function makeSession(overrides: Partial<SessionFile> = {}): SessionFile {
  return {
    schema: "cc-dash/session@1",
    project: "test-project",
    session_id: "s_2026-03-01_work",
    started: "2026-03-01T10:00:00-07:00",
    last_updated: "2026-03-01T12:00:00-07:00",
    status: "in-progress",
    tasks: [
      {
        id: "t_abc12",
        checked: false,
        dependency: "none",
        description: "First task",
      },
      {
        id: "t_def34",
        checked: true,
        dependency: "t_abc12",
        description: "Second task",
      },
    ],
    currentStatus: "Working on: Phase 3",
    decisions: ["Use TypeScript"],
    failedAttempts: [
      {
        id: "f_xyz99",
        taskRef: "t_abc12",
        description: "Tried approach A",
      },
    ],
    completedWork: [
      {
        taskRef: "t_def34",
        timestamp: "2026-03-01T11:00:00-07:00",
        description: "Completed second task",
      },
    ],
    filePath: "/projects/test-project/SESSION_PROGRESS.md",
    ...overrides,
  };
}

function makePreserved(
  overrides: Partial<SessionParseResult> = {},
): SessionParseResult {
  return {
    preamble: "# Session Progress",
    unknownSections: [
      {
        heading: "Verification Results",
        raw: "\n### Successfully Verified\n\n- Feature A works\n",
      },
      {
        heading: "Custom Notes",
        raw: "\nSome custom content\n",
      },
    ],
    trailingContent: "",
    ...overrides,
  };
}

// --- Tests ---

describe("getSessionBySlug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadConfig.mockResolvedValue(defaultConfig);
  });

  it("returns null when slug not found", async () => {
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "Other Project",
        path: "/projects/other-project",
        roadmapPath: null,
        sessionPath: "/projects/other-project/SESSION_PROGRESS.md",
        isExplicit: false,
      },
    ]);

    const result = await getSessionBySlug("nonexistent");
    expect(result).toBeNull();
  });

  it("returns null when project has no session file", async () => {
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "No Session",
        path: "/projects/no-session",
        roadmapPath: "/projects/no-session/ROADMAP.md",
        sessionPath: null,
        isExplicit: false,
      },
    ]);

    const result = await getSessionBySlug("no-session");
    expect(result).toBeNull();
  });

  it("returns session data for valid slug", async () => {
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "Test Project",
        path: "/projects/test-project",
        roadmapPath: null,
        sessionPath: "/projects/test-project/SESSION_PROGRESS.md",
        isExplicit: false,
      },
    ]);

    mockReadFile.mockResolvedValue("raw-session");

    const session = makeSession();
    const preserved = makePreserved();
    mockParseSession.mockReturnValue({
      success: true,
      data: session,
      preserved,
    });

    const result = await getSessionBySlug("test-project");

    expect(result).not.toBeNull();
    expect(result!.session).toEqual(session);
    expect(result!.projectName).toBe("Test Project");
    expect(result!.sessionFilePath).toBe(
      "/projects/test-project/SESSION_PROGRESS.md",
    );
  });

  it("returns verification sections from unknown sections", async () => {
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "Test Project",
        path: "/projects/test-project",
        roadmapPath: null,
        sessionPath: "/projects/test-project/SESSION_PROGRESS.md",
        isExplicit: false,
      },
    ]);

    mockReadFile.mockResolvedValue("raw-session");

    const session = makeSession();
    const preserved = makePreserved();
    mockParseSession.mockReturnValue({
      success: true,
      data: session,
      preserved,
    });

    const result = await getSessionBySlug("test-project");

    expect(result).not.toBeNull();
    // Should include only the "Verification Results" unknown section, not "Custom Notes"
    expect(result!.verificationSections).toHaveLength(1);
    expect(result!.verificationSections[0].heading).toBe(
      "Verification Results",
    );
    // Should also have preserved content for write-back
    expect(result!.preserved).toEqual(preserved);
  });

  it("builds task name lookup map", async () => {
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "Test Project",
        path: "/projects/test-project",
        roadmapPath: null,
        sessionPath: "/projects/test-project/SESSION_PROGRESS.md",
        isExplicit: false,
      },
    ]);

    mockReadFile.mockResolvedValue("raw-session");

    const session = makeSession();
    const preserved = makePreserved();
    mockParseSession.mockReturnValue({
      success: true,
      data: session,
      preserved,
    });

    const result = await getSessionBySlug("test-project");

    expect(result).not.toBeNull();
    expect(result!.taskNames).toEqual({
      t_abc12: "First task",
      t_def34: "Second task",
    });
  });
});
