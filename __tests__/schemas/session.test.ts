import { describe, it, expect } from "vitest";
import {
  SessionStatus,
  SessionFrontmatterSchema,
  SessionTaskSchema,
  FailedAttemptSchema,
  CompletionEntrySchema,
  SessionFileSchema,
  validateSessionFrontmatter,
  validateSessionFile,
} from "@/lib/schemas/session";

describe("SessionFrontmatterSchema", () => {
  const validFrontmatter = {
    schema: "cc-dash/session@1",
    project: "my-project",
    session_id: "s_2026-03-09_auth",
    started: "2026-03-09T10:30:00-07:00",
    last_updated: "2026-03-09T14:15:00-07:00",
    status: "in-progress",
  };

  it("accepts valid frontmatter", () => {
    const result = SessionFrontmatterSchema.safeParse(validFrontmatter);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.schema).toBe("cc-dash/session@1");
      expect(result.data.project).toBe("my-project");
      expect(result.data.session_id).toBe("s_2026-03-09_auth");
      expect(result.data.status).toBe("in-progress");
    }
  });

  it("accepts optional roadmap_ref with r_ pattern", () => {
    const result = SessionFrontmatterSchema.safeParse({
      ...validFrontmatter,
      roadmap_ref: "r_k8x2m",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.roadmap_ref).toBe("r_k8x2m");
    }
  });

  it("accepts frontmatter without roadmap_ref", () => {
    const result = SessionFrontmatterSchema.safeParse(validFrontmatter);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.roadmap_ref).toBeUndefined();
    }
  });

  it.each([
    ["missing schema", { ...validFrontmatter, schema: undefined }],
    ["missing project", { ...validFrontmatter, project: undefined }],
    ["missing session_id", { ...validFrontmatter, session_id: undefined }],
    ["missing started", { ...validFrontmatter, started: undefined }],
    ["missing last_updated", { ...validFrontmatter, last_updated: undefined }],
    ["missing status", { ...validFrontmatter, status: undefined }],
  ])("rejects %s", (_desc, input) => {
    const result = SessionFrontmatterSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it.each([
    ["no s_ prefix", "2026-03-09_auth"],
    ["empty string", ""],
    ["just prefix", "s_"],
  ])("rejects invalid session_id: %s", (_desc, session_id) => {
    const result = SessionFrontmatterSchema.safeParse({
      ...validFrontmatter,
      session_id,
    });
    expect(result.success).toBe(false);
  });

  it.each([
    ["unknown", "unknown"],
    ["empty string", ""],
    ["active", "active"],
  ])("rejects invalid status: %s", (_desc, status) => {
    const result = SessionFrontmatterSchema.safeParse({
      ...validFrontmatter,
      status,
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid status values", () => {
    const statuses = ["in-progress", "paused", "completed", "blocked"];
    for (const status of statuses) {
      const result = SessionFrontmatterSchema.safeParse({
        ...validFrontmatter,
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid roadmap_ref pattern", () => {
    const result = SessionFrontmatterSchema.safeParse({
      ...validFrontmatter,
      roadmap_ref: "bad_ref",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid datetime for started", () => {
    const result = SessionFrontmatterSchema.safeParse({
      ...validFrontmatter,
      started: "not-a-date",
    });
    expect(result.success).toBe(false);
  });
});

describe("SessionTaskSchema", () => {
  const validTask = {
    id: "t_a1b2c",
    checked: false,
    dependency: "none",
    description: "Do stuff",
  };

  it("accepts valid task", () => {
    const result = SessionTaskSchema.safeParse(validTask);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("t_a1b2c");
      expect(result.data.checked).toBe(false);
      expect(result.data.dependency).toBe("none");
      expect(result.data.description).toBe("Do stuff");
    }
  });

  it("accepts checked task", () => {
    const result = SessionTaskSchema.safeParse({ ...validTask, checked: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.checked).toBe(true);
    }
  });

  it("accepts task with dependency on another task", () => {
    const result = SessionTaskSchema.safeParse({
      ...validTask,
      dependency: "t_d3e4f",
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ["missing t_ prefix", "a1b2c"],
    ["wrong prefix", "r_a1b2c"],
    ["too short", "t_a1b"],
    ["too long", "t_a1b2c3"],
    ["uppercase", "t_A1B2C"],
  ])("rejects invalid task ID: %s", (_desc, id) => {
    const result = SessionTaskSchema.safeParse({ ...validTask, id });
    expect(result.success).toBe(false);
  });

  it("rejects task without description", () => {
    const { description: _, ...noDesc } = validTask;
    const result = SessionTaskSchema.safeParse(noDesc);
    expect(result.success).toBe(false);
  });
});

describe("FailedAttemptSchema", () => {
  const validAttempt = {
    id: "f_m1n2o",
    taskRef: "t_g5h6i",
    description: "Tried in-memory sessions, failed",
  };

  it("accepts valid failed attempt", () => {
    const result = FailedAttemptSchema.safeParse(validAttempt);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("f_m1n2o");
      expect(result.data.taskRef).toBe("t_g5h6i");
      expect(result.data.description).toBe("Tried in-memory sessions, failed");
    }
  });

  it.each([
    ["missing f_ prefix", "m1n2o"],
    ["wrong prefix", "t_m1n2o"],
    ["too short", "f_m1n"],
  ])("rejects invalid failed attempt ID: %s", (_desc, id) => {
    const result = FailedAttemptSchema.safeParse({ ...validAttempt, id });
    expect(result.success).toBe(false);
  });

  it("rejects invalid taskRef (not t_ prefixed)", () => {
    const result = FailedAttemptSchema.safeParse({
      ...validAttempt,
      taskRef: "r_g5h6i",
    });
    expect(result.success).toBe(false);
  });
});

describe("CompletionEntrySchema", () => {
  const validEntry = {
    taskRef: "t_a1b2c",
    timestamp: "2026-03-09T11:00:00-07:00",
    description: "Completed phase 1 research",
  };

  it("accepts valid completion entry", () => {
    const result = CompletionEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.taskRef).toBe("t_a1b2c");
      expect(result.data.timestamp).toBe("2026-03-09T11:00:00-07:00");
      expect(result.data.description).toBe("Completed phase 1 research");
    }
  });

  it("rejects invalid taskRef", () => {
    const result = CompletionEntrySchema.safeParse({
      ...validEntry,
      taskRef: "bad_ref",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid timestamp", () => {
    const result = CompletionEntrySchema.safeParse({
      ...validEntry,
      timestamp: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing description", () => {
    const { description: _, ...noDesc } = validEntry;
    const result = CompletionEntrySchema.safeParse(noDesc);
    expect(result.success).toBe(false);
  });
});

describe("SessionFileSchema", () => {
  const validFile = {
    schema: "cc-dash/session@1",
    project: "my-project",
    session_id: "s_2026-03-09_auth",
    started: "2026-03-09T10:30:00-07:00",
    last_updated: "2026-03-09T14:15:00-07:00",
    status: "in-progress",
    tasks: [
      {
        id: "t_a1b2c",
        checked: false,
        dependency: "none",
        description: "Phase 1: Research",
      },
    ],
    currentStatus: "Working on phase 1",
    decisions: ["Chose Passport.js"],
    failedAttempts: [],
    completedWork: [],
    filePath: "/path/to/SESSION_PROGRESS.md",
  };

  it("accepts valid complete session file", () => {
    const result = SessionFileSchema.safeParse(validFile);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tasks).toHaveLength(1);
      expect(result.data.filePath).toBe("/path/to/SESSION_PROGRESS.md");
    }
  });

  it("accepts file with failed attempts and completed work", () => {
    const result = SessionFileSchema.safeParse({
      ...validFile,
      failedAttempts: [
        {
          id: "f_m1n2o",
          taskRef: "t_a1b2c",
          description: "Tried something",
        },
      ],
      completedWork: [
        {
          taskRef: "t_a1b2c",
          timestamp: "2026-03-09T11:00:00-07:00",
          description: "Finished research",
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.failedAttempts).toHaveLength(1);
      expect(result.data.completedWork).toHaveLength(1);
    }
  });

  it("accepts file with optional roadmap_ref", () => {
    const result = SessionFileSchema.safeParse({
      ...validFile,
      roadmap_ref: "r_k8x2m",
    });
    expect(result.success).toBe(true);
  });

  it("rejects file without tasks", () => {
    const { tasks: _, ...noTasks } = validFile;
    const result = SessionFileSchema.safeParse(noTasks);
    expect(result.success).toBe(false);
  });

  it("rejects file without filePath", () => {
    const { filePath: _, ...noPath } = validFile;
    const result = SessionFileSchema.safeParse(noPath);
    expect(result.success).toBe(false);
  });
});

describe("validateSessionFrontmatter", () => {
  it("returns success with data for valid input", () => {
    const result = validateSessionFrontmatter({
      schema: "cc-dash/session@1",
      project: "my-project",
      session_id: "s_2026-03-09_auth",
      started: "2026-03-09T10:30:00-07:00",
      last_updated: "2026-03-09T14:15:00-07:00",
      status: "in-progress",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project).toBe("my-project");
    }
  });

  it("returns failure with structured errors for invalid input", () => {
    const result = validateSessionFrontmatter({
      schema: "wrong",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toHaveProperty("field");
      expect(result.errors[0]).toHaveProperty("message");
      expect(result.errors[0]).toHaveProperty("received");
    }
  });
});

describe("validateSessionFile", () => {
  it("returns success for valid file", () => {
    const result = validateSessionFile({
      schema: "cc-dash/session@1",
      project: "my-project",
      session_id: "s_2026-03-09_auth",
      started: "2026-03-09T10:30:00-07:00",
      last_updated: "2026-03-09T14:15:00-07:00",
      status: "in-progress",
      tasks: [],
      currentStatus: "",
      decisions: [],
      failedAttempts: [],
      completedWork: [],
      filePath: "/path",
    });
    expect(result.success).toBe(true);
  });

  it("returns failure for invalid file", () => {
    const result = validateSessionFile({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});

describe("SessionStatus", () => {
  it("exposes enum values", () => {
    expect(SessionStatus.enum).toContain("in-progress");
    expect(SessionStatus.enum).toContain("paused");
    expect(SessionStatus.enum).toContain("completed");
    expect(SessionStatus.enum).toContain("blocked");
  });
});
