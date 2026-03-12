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

const { mockDiscoverProjects, mockParseSession, mockWriteSessionFile } =
  vi.hoisted(() => ({
    mockDiscoverProjects: vi.fn(),
    mockParseSession: vi.fn(),
    mockWriteSessionFile: vi.fn(),
  }));

vi.mock("@/lib/fs", () => ({
  discoverProjects: mockDiscoverProjects,
  parseSession: mockParseSession,
  writeSessionFile: mockWriteSessionFile,
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
import { updateSessionStatus } from "@/lib/actions/update-session-status";

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
    tasks: [],
    currentStatus: "Working on: Phase 3",
    decisions: [],
    failedAttempts: [],
    completedWork: [],
    filePath: "/projects/test-project/SESSION_PROGRESS.md",
    ...overrides,
  };
}

function makePreserved(
  overrides: Partial<SessionParseResult> = {},
): SessionParseResult {
  return {
    preamble: "# Session Progress",
    unknownSections: [],
    trailingContent: "",
    ...overrides,
  };
}

// --- Tests ---

describe("updateSessionStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadConfig.mockResolvedValue(defaultConfig);
  });

  it("returns error for invalid status value", async () => {
    // Should reject without needing discovery since validation happens first
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "Test Project",
        path: "/projects/test-project",
        roadmapPath: null,
        sessionPath: "/projects/test-project/SESSION_PROGRESS.md",
        isExplicit: false,
      },
    ]);

    const result = await updateSessionStatus("test-project", "invalid");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("status");
    }
  });

  it("reads current file and updates status", async () => {
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

    mockWriteSessionFile.mockResolvedValue({
      success: true,
      data: undefined,
    });

    const result = await updateSessionStatus("test-project", "completed");

    expect(result.success).toBe(true);

    // Verify writeSessionFile was called with updated status
    expect(mockWriteSessionFile).toHaveBeenCalledOnce();
    const [filePath, updatedData, preservedArg] =
      mockWriteSessionFile.mock.calls[0];
    expect(filePath).toBe("/projects/test-project/SESSION_PROGRESS.md");
    expect(updatedData.status).toBe("completed");
    expect(preservedArg).toEqual(preserved);
  });

  it("writes back atomically with preserved content", async () => {
    const preserved = makePreserved({
      unknownSections: [
        {
          heading: "Verification Results",
          raw: "\n### Successfully Verified\n\n- Feature A works\n",
        },
      ],
    });

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
    mockParseSession.mockReturnValue({
      success: true,
      data: session,
      preserved,
    });

    mockWriteSessionFile.mockResolvedValue({
      success: true,
      data: undefined,
    });

    await updateSessionStatus("test-project", "paused");

    // Verify preserved content (including unknown sections) is passed through
    const [, , preservedArg] = mockWriteSessionFile.mock.calls[0];
    expect(preservedArg).toEqual(preserved);
    expect(preservedArg.unknownSections).toHaveLength(1);
  });

  it("validates status against SessionStatus enum", async () => {
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "Test Project",
        path: "/projects/test-project",
        roadmapPath: null,
        sessionPath: "/projects/test-project/SESSION_PROGRESS.md",
        isExplicit: false,
      },
    ]);

    // Valid statuses should be accepted
    for (const validStatus of [
      "in-progress",
      "paused",
      "completed",
      "blocked",
    ]) {
      vi.clearAllMocks();
      mockLoadConfig.mockResolvedValue(defaultConfig);
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
      mockParseSession.mockReturnValue({
        success: true,
        data: makeSession(),
        preserved: makePreserved(),
      });
      mockWriteSessionFile.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const result = await updateSessionStatus("test-project", validStatus);
      expect(result.success).toBe(true);
    }

    // Invalid statuses should be rejected
    vi.clearAllMocks();
    mockLoadConfig.mockResolvedValue(defaultConfig);
    mockDiscoverProjects.mockResolvedValue([
      {
        name: "Test Project",
        path: "/projects/test-project",
        roadmapPath: null,
        sessionPath: "/projects/test-project/SESSION_PROGRESS.md",
        isExplicit: false,
      },
    ]);

    const badResult = await updateSessionStatus("test-project", "archived");
    expect(badResult.success).toBe(false);
  });
});
