/**
 * Tests for high-level file write wrappers.
 * Verifies FILE-02: auto-update last_updated to current ISO timestamp.
 * Verifies FILE-03: typed error return via Result pattern.
 *
 * Uses mocks for atomicWriteFile and serializers to isolate orchestration logic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RoadmapFile } from "@/lib/schemas/roadmap";
import type { SessionFile } from "@/lib/schemas/session";
import type { RoadmapParseResult, SessionParseResult } from "@/lib/fs/types";

// --- Mocks ---

const { mockAtomicWriteFile, mockSerializeRoadmap, mockSerializeSession } =
  vi.hoisted(() => ({
    mockAtomicWriteFile: vi.fn(),
    mockSerializeRoadmap: vi.fn(),
    mockSerializeSession: vi.fn(),
  }));

vi.mock("@/lib/fs/atomic-write", () => ({
  atomicWriteFile: mockAtomicWriteFile,
}));

vi.mock("@/lib/fs/serializer", () => ({
  serializeRoadmap: mockSerializeRoadmap,
  serializeSession: mockSerializeSession,
}));

import { writeRoadmapFile, writeSessionFile } from "@/lib/fs/write-file";

// --- Test data factories ---

function makeRoadmapData(overrides: Partial<RoadmapFile> = {}): RoadmapFile {
  return {
    schema: "cc-dash/roadmap@1" as const,
    project: "test-project",
    description: "Test roadmap",
    last_updated: "2026-01-01T00:00:00Z",
    categories: [],
    filePath: "/projects/test/ROADMAP.md",
    ...overrides,
  };
}

function makeSessionData(overrides: Partial<SessionFile> = {}): SessionFile {
  return {
    schema: "cc-dash/session@1" as const,
    project: "test-project",
    session_id: "s_2026-03-10_test",
    started: "2026-03-10T10:00:00Z",
    last_updated: "2026-03-10T10:00:00Z",
    status: "in-progress",
    tasks: [],
    currentStatus: "Working on tests",
    decisions: [],
    failedAttempts: [],
    completedWork: [],
    filePath: "/projects/test/SESSION_PROGRESS.md",
    ...overrides,
  };
}

// --- Tests ---

describe("writeRoadmapFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSerializeRoadmap.mockReturnValue(
      "---\nschema: cc-dash/roadmap@1\n---\n# Roadmap\n",
    );
    mockAtomicWriteFile.mockResolvedValue(undefined);
  });

  it("sets last_updated to current ISO timestamp before serializing", async () => {
    const data = makeRoadmapData();
    const before = Date.now();

    await writeRoadmapFile("/test/ROADMAP.md", data, {});

    const after = Date.now();
    const calledWith = mockSerializeRoadmap.mock.calls[0][0];
    const timestamp = new Date(calledWith.last_updated).getTime();
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it("calls serializeRoadmap then atomicWriteFile", async () => {
    const serialized = "---\nfrontmatter\n---\nbody\n";
    mockSerializeRoadmap.mockReturnValue(serialized);

    const data = makeRoadmapData();
    const preserved: Partial<RoadmapParseResult> = {
      preamble: "\n# Roadmap\n",
    };
    await writeRoadmapFile("/test/ROADMAP.md", data, preserved);

    expect(mockSerializeRoadmap).toHaveBeenCalledOnce();
    // Verify preserved content is merged into the serializer call
    const calledWith = mockSerializeRoadmap.mock.calls[0][0];
    expect(calledWith.preamble).toBe("\n# Roadmap\n");

    expect(mockAtomicWriteFile).toHaveBeenCalledWith(
      "/test/ROADMAP.md",
      serialized,
    );
  });

  it("returns { success: true, data: undefined } on success", async () => {
    const result = await writeRoadmapFile(
      "/test/ROADMAP.md",
      makeRoadmapData(),
      {},
    );
    expect(result).toEqual({ success: true, data: undefined });
  });

  it("returns { success: false, errors: [...] } when atomicWriteFile throws ENOENT", async () => {
    const err = Object.assign(new Error("no such file or directory"), {
      code: "ENOENT",
    });
    mockAtomicWriteFile.mockRejectedValue(err);

    const result = await writeRoadmapFile(
      "/test/ROADMAP.md",
      makeRoadmapData(),
      {},
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe("file");
      expect(result.errors[0].message).toContain("NOT_FOUND");
    }
  });
});

describe("writeSessionFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSerializeSession.mockReturnValue(
      "---\nschema: cc-dash/session@1\n---\n# Session\n",
    );
    mockAtomicWriteFile.mockResolvedValue(undefined);
  });

  it("sets last_updated to current ISO timestamp before serializing", async () => {
    const data = makeSessionData();
    const before = Date.now();

    await writeSessionFile("/test/SESSION_PROGRESS.md", data, {});

    const after = Date.now();
    const calledWith = mockSerializeSession.mock.calls[0][0];
    const timestamp = new Date(calledWith.last_updated).getTime();
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it("calls serializeSession then atomicWriteFile", async () => {
    const serialized = "---\nsession frontmatter\n---\nbody\n";
    mockSerializeSession.mockReturnValue(serialized);

    const data = makeSessionData();
    const preserved: Partial<SessionParseResult> = {
      preamble: "\n# Session Progress\n",
    };
    await writeSessionFile("/test/SESSION_PROGRESS.md", data, preserved);

    expect(mockSerializeSession).toHaveBeenCalledOnce();
    const calledWith = mockSerializeSession.mock.calls[0][0];
    expect(calledWith.preamble).toBe("\n# Session Progress\n");

    expect(mockAtomicWriteFile).toHaveBeenCalledWith(
      "/test/SESSION_PROGRESS.md",
      serialized,
    );
  });

  it("returns { success: true, data: undefined } on success", async () => {
    const result = await writeSessionFile(
      "/test/SESSION_PROGRESS.md",
      makeSessionData(),
      {},
    );
    expect(result).toEqual({ success: true, data: undefined });
  });

  it("returns { success: false, errors: [...] } on filesystem error", async () => {
    const err = Object.assign(new Error("permission denied"), {
      code: "EACCES",
    });
    mockAtomicWriteFile.mockRejectedValue(err);

    const result = await writeSessionFile(
      "/test/SESSION_PROGRESS.md",
      makeSessionData(),
      {},
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe("file");
      expect(result.errors[0].message).toContain("PERMISSION");
    }
  });
});
