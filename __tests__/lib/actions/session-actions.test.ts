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

const { mockRevalidatePath } = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

const { mockGenerateTaskId } = vi.hoisted(() => ({
  mockGenerateTaskId: vi.fn(),
}));
vi.mock("@/lib/utils/generate-id", () => ({
  generateTaskId: mockGenerateTaskId,
}));

// Import AFTER mocks
import {
  toggleTaskCheckbox,
  addSessionTask,
  updateSessionTask,
  deleteSessionTask,
  reorderSessionTasks,
  updateCurrentStatus,
} from "@/lib/actions/session-actions";

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
    session_id: "s_2026-03-01_feature-work",
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
      {
        id: "t_ghi56",
        checked: false,
        dependency: "t_def34",
        description: "Third task",
      },
    ],
    currentStatus: "Working on feature implementation",
    decisions: ["Decision 1"],
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

function setupMocks(session?: SessionFile, preserved?: SessionParseResult) {
  const sess = session ?? makeSession();
  const pr = preserved ?? makePreserved();
  mockLoadConfig.mockResolvedValue(defaultConfig);
  mockDiscoverProjects.mockResolvedValue([
    {
      name: "Test Project",
      path: "/projects/test-project",
      roadmapPath: "/projects/test-project/ROADMAP.md",
      sessionPath: "/projects/test-project/SESSION_PROGRESS.md",
      isExplicit: false,
    },
  ]);
  mockReadFile.mockResolvedValue("raw-session");
  mockParseSession.mockReturnValue({
    success: true,
    data: sess,
    preserved: pr,
  });
  mockWriteSessionFile.mockResolvedValue({
    success: true,
    data: undefined,
  });
  mockGenerateTaskId.mockReturnValue("t_new01");
  return { session: sess, preserved: pr };
}

// --- Tests ---

describe("toggleTaskCheckbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("toggles checked from false to true for valid task ID", async () => {
    setupMocks();

    const result = await toggleTaskCheckbox("test-project", "t_abc12");

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteSessionFile.mock.calls[0];
    const task = writtenData.tasks.find(
      (t: { id: string }) => t.id === "t_abc12",
    );
    expect(task.checked).toBe(true);
  });

  it("toggles checked from true to false for valid task ID", async () => {
    setupMocks();

    const result = await toggleTaskCheckbox("test-project", "t_def34");

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteSessionFile.mock.calls[0];
    const task = writtenData.tasks.find(
      (t: { id: string }) => t.id === "t_def34",
    );
    expect(task.checked).toBe(false);
  });

  it("returns error for non-existent project slug", async () => {
    mockLoadConfig.mockResolvedValue(defaultConfig);
    mockDiscoverProjects.mockResolvedValue([]);

    const result = await toggleTaskCheckbox("nonexistent", "t_abc12");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("slug");
    }
  });

  it("returns error for non-existent task ID", async () => {
    setupMocks();

    const result = await toggleTaskCheckbox("test-project", "t_zzzzz");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("taskId");
    }
  });

  it("returns error for invalid task ID format (not starting with t_)", async () => {
    setupMocks();

    const result = await toggleTaskCheckbox("test-project", "invalid_id");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("taskId");
    }
  });

  it("calls revalidatePath after successful toggle", async () => {
    setupMocks();

    await toggleTaskCheckbox("test-project", "t_abc12");

    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/project/test-project/session",
    );
  });
});

describe("addSessionTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds task with description and no dependency", async () => {
    setupMocks();

    const result = await addSessionTask("test-project", {
      description: "New task",
      dependency: "none",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("t_new01");
    }
    const [, writtenData] = mockWriteSessionFile.mock.calls[0];
    expect(writtenData.tasks).toHaveLength(4);
    const newTask = writtenData.tasks[3];
    expect(newTask.description).toBe("New task");
    expect(newTask.dependency).toBe("none");
    expect(newTask.checked).toBe(false);
  });

  it("adds task with description and valid dependency", async () => {
    setupMocks();

    const result = await addSessionTask("test-project", {
      description: "Dependent task",
      dependency: "t_abc12",
    });

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteSessionFile.mock.calls[0];
    const newTask = writtenData.tasks[3];
    expect(newTask.dependency).toBe("t_abc12");
  });

  it("generates unique t_ ID for new task", async () => {
    setupMocks();

    const result = await addSessionTask("test-project", {
      description: "New task",
      dependency: "none",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toMatch(/^t_[a-z0-9]{5}$/);
    }
    expect(mockGenerateTaskId).toHaveBeenCalledOnce();
  });

  it("returns error for empty description", async () => {
    setupMocks();

    const result = await addSessionTask("test-project", {
      description: "   ",
      dependency: "none",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("description");
    }
  });

  it("returns error for non-existent dependency task ID", async () => {
    setupMocks();

    const result = await addSessionTask("test-project", {
      description: "New task",
      dependency: "t_zzzzz",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("dependency");
    }
  });

  it("calls revalidatePath after successful add", async () => {
    setupMocks();

    await addSessionTask("test-project", {
      description: "New task",
      dependency: "none",
    });

    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/project/test-project/session",
    );
  });
});

describe("updateSessionTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates task description", async () => {
    setupMocks();

    const result = await updateSessionTask("test-project", "t_abc12", {
      description: "Updated description",
    });

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteSessionFile.mock.calls[0];
    const task = writtenData.tasks.find(
      (t: { id: string }) => t.id === "t_abc12",
    );
    expect(task.description).toBe("Updated description");
  });

  it("updates task dependency to valid task", async () => {
    setupMocks();

    const result = await updateSessionTask("test-project", "t_abc12", {
      dependency: "t_ghi56",
    });

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteSessionFile.mock.calls[0];
    const task = writtenData.tasks.find(
      (t: { id: string }) => t.id === "t_abc12",
    );
    expect(task.dependency).toBe("t_ghi56");
  });

  it("updates task dependency to none", async () => {
    setupMocks();

    const result = await updateSessionTask("test-project", "t_def34", {
      dependency: "none",
    });

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteSessionFile.mock.calls[0];
    const task = writtenData.tasks.find(
      (t: { id: string }) => t.id === "t_def34",
    );
    expect(task.dependency).toBe("none");
  });

  it("returns error for non-existent task ID", async () => {
    setupMocks();

    const result = await updateSessionTask("test-project", "t_zzzzz", {
      description: "Updated",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("taskId");
    }
  });

  it("returns error for non-existent dependency", async () => {
    setupMocks();

    const result = await updateSessionTask("test-project", "t_abc12", {
      dependency: "t_zzzzz",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("dependency");
    }
  });
});

describe("deleteSessionTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes task from tasks array", async () => {
    setupMocks();

    const result = await deleteSessionTask("test-project", "t_abc12");

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteSessionFile.mock.calls[0];
    expect(writtenData.tasks).toHaveLength(2);
    expect(
      writtenData.tasks.find((t: { id: string }) => t.id === "t_abc12"),
    ).toBeUndefined();
  });

  it("cleans up orphaned dependencies pointing to deleted task", async () => {
    setupMocks();

    // t_def34 has dependency: "t_abc12", so deleting t_abc12 should orphan it
    const result = await deleteSessionTask("test-project", "t_abc12");

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteSessionFile.mock.calls[0];
    const orphanedTask = writtenData.tasks.find(
      (t: { id: string }) => t.id === "t_def34",
    );
    expect(orphanedTask.dependency).toBe("none");
  });

  it("returns error for non-existent task ID", async () => {
    setupMocks();

    const result = await deleteSessionTask("test-project", "t_zzzzz");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("taskId");
    }
  });

  it("returns error for invalid task ID format", async () => {
    setupMocks();

    const result = await deleteSessionTask("test-project", "invalid_id");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("taskId");
    }
  });

  it("calls revalidatePath after successful delete", async () => {
    setupMocks();

    await deleteSessionTask("test-project", "t_abc12");

    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/project/test-project/session",
    );
  });
});

describe("reorderSessionTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reorders tasks to match provided ID order", async () => {
    setupMocks();

    const result = await reorderSessionTasks("test-project", [
      "t_ghi56",
      "t_abc12",
      "t_def34",
    ]);

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteSessionFile.mock.calls[0];
    expect(writtenData.tasks[0].id).toBe("t_ghi56");
    expect(writtenData.tasks[1].id).toBe("t_abc12");
    expect(writtenData.tasks[2].id).toBe("t_def34");
  });

  it("returns error for mismatched task count", async () => {
    setupMocks();

    const result = await reorderSessionTasks("test-project", [
      "t_abc12",
      "t_def34",
    ]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("orderedTaskIds");
    }
  });

  it("returns error for non-existent task ID in order array", async () => {
    setupMocks();

    const result = await reorderSessionTasks("test-project", [
      "t_abc12",
      "t_def34",
      "t_zzzzz",
    ]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("orderedTaskIds");
    }
  });

  it("calls revalidatePath after successful reorder", async () => {
    setupMocks();

    await reorderSessionTasks("test-project", [
      "t_ghi56",
      "t_abc12",
      "t_def34",
    ]);

    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/project/test-project/session",
    );
  });
});

describe("updateCurrentStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("replaces currentStatus with new string", async () => {
    setupMocks();

    const result = await updateCurrentStatus(
      "test-project",
      "Now working on tests",
    );

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteSessionFile.mock.calls[0];
    expect(writtenData.currentStatus).toBe("Now working on tests");
  });

  it("handles empty string currentStatus", async () => {
    setupMocks();

    const result = await updateCurrentStatus("test-project", "");

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteSessionFile.mock.calls[0];
    expect(writtenData.currentStatus).toBe("");
  });

  it("returns error for non-existent project", async () => {
    mockLoadConfig.mockResolvedValue(defaultConfig);
    mockDiscoverProjects.mockResolvedValue([]);

    const result = await updateCurrentStatus("nonexistent", "Some status");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("slug");
    }
  });

  it("calls revalidatePath after successful update", async () => {
    setupMocks();

    await updateCurrentStatus("test-project", "New status");

    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/project/test-project/session",
    );
  });
});
