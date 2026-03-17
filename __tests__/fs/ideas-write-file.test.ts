/**
 * Tests for writeIdeasFile wrapper.
 * Verifies: auto-update last_updated, atomic write, error handling.
 *
 * Uses mocks for atomicWriteFile and serializeIdeas to isolate orchestration logic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IdeasFile } from "@/lib/schemas/ideas";
import type { IdeasParseResult } from "@/lib/fs/types";

// --- Mocks ---

const { mockAtomicWriteFile, mockSerializeIdeas } = vi.hoisted(() => ({
  mockAtomicWriteFile: vi.fn(),
  mockSerializeIdeas: vi.fn(),
}));

vi.mock("@/lib/fs/atomic-write", () => ({
  atomicWriteFile: mockAtomicWriteFile,
}));

vi.mock("@/lib/fs/serializer", () => ({
  serializeIdeas: mockSerializeIdeas,
}));

import { writeIdeasFile } from "@/lib/fs/write-file";

// --- Test data factories ---

function makeIdeasData(overrides: Partial<IdeasFile> = {}): IdeasFile {
  return {
    schema: "cc-dash/ideas@1" as const,
    last_updated: "2026-01-01T00:00:00Z",
    ideas: [
      {
        id: "i_a8k2m",
        status: "started",
        title: "Test idea",
        body: "Description",
      },
    ],
    filePath: "/projects/PROJECT_IDEAS.md",
    ...overrides,
  };
}

// --- Tests ---

describe("writeIdeasFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSerializeIdeas.mockReturnValue(
      "---\nschema: cc-dash/ideas@1\n---\n# Project Ideas\n",
    );
    mockAtomicWriteFile.mockResolvedValue(undefined);
  });

  it("auto-updates last_updated timestamp before serializing", async () => {
    const data = makeIdeasData();
    const before = Date.now();

    await writeIdeasFile("/test/PROJECT_IDEAS.md", data, {});

    const after = Date.now();
    const calledWith = mockSerializeIdeas.mock.calls[0][0];
    const timestamp = new Date(calledWith.last_updated).getTime();
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it("calls serializeIdeas then atomicWriteFile (atomic write)", async () => {
    const serialized = "---\nfrontmatter\n---\nbody\n";
    mockSerializeIdeas.mockReturnValue(serialized);

    const data = makeIdeasData();
    const preserved: Partial<IdeasParseResult> = {
      preamble: "\n# Project Ideas\n",
    };
    await writeIdeasFile("/test/PROJECT_IDEAS.md", data, preserved);

    expect(mockSerializeIdeas).toHaveBeenCalledOnce();
    const calledWith = mockSerializeIdeas.mock.calls[0][0];
    expect(calledWith.preamble).toBe("\n# Project Ideas\n");

    expect(mockAtomicWriteFile).toHaveBeenCalledWith(
      "/test/PROJECT_IDEAS.md",
      serialized,
    );
  });

  it("returns { success: true, data: undefined } on success", async () => {
    const result = await writeIdeasFile(
      "/test/PROJECT_IDEAS.md",
      makeIdeasData(),
      {},
    );
    expect(result).toEqual({ success: true, data: undefined });
  });

  it("returns error for invalid path (ENOENT)", async () => {
    const err = Object.assign(new Error("no such file or directory"), {
      code: "ENOENT",
    });
    mockAtomicWriteFile.mockRejectedValue(err);

    const result = await writeIdeasFile(
      "/nonexistent/PROJECT_IDEAS.md",
      makeIdeasData(),
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
