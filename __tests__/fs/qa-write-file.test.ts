/**
 * Tests for writeQaFile wrapper.
 * Verifies auto-update of last_updated, atomic write call sequencing,
 * and typed error return via Result pattern.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { QaFile } from "@/lib/schemas/qa";
import type { QaParseResult } from "@/lib/fs/types";

const { mockAtomicWriteFile, mockSerializeQa } = vi.hoisted(() => ({
  mockAtomicWriteFile: vi.fn(),
  mockSerializeQa: vi.fn(),
}));

vi.mock("@/lib/fs/atomic-write", () => ({
  atomicWriteFile: mockAtomicWriteFile,
}));

vi.mock("@/lib/fs/serializer", () => ({
  serializeQa: mockSerializeQa,
}));

import { writeQaFile } from "@/lib/fs/write-file";

function makeQaData(overrides: Partial<QaFile> = {}): QaFile {
  return {
    schema: "cc-dash/qa@1" as const,
    project: "test-project",
    last_updated: "2026-01-01T00:00:00Z",
    setup: "Run: `make test`",
    items: [],
    filePath: "/projects/test/QA.md",
    ...overrides,
  };
}

describe("writeQaFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSerializeQa.mockReturnValue("---\nschema: cc-dash/qa@1\n---\n# QA\n");
    mockAtomicWriteFile.mockResolvedValue(undefined);
  });

  it("sets last_updated to current ISO timestamp before serializing", async () => {
    const data = makeQaData();
    const before = Date.now();

    await writeQaFile("/test/QA.md", data, {});

    const after = Date.now();
    const calledWith = mockSerializeQa.mock.calls[0][0];
    const timestamp = new Date(calledWith.last_updated).getTime();
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it("calls serializeQa then atomicWriteFile with the rendered output", async () => {
    const serialized = "---\nqa frontmatter\n---\nbody\n";
    mockSerializeQa.mockReturnValue(serialized);

    const data = makeQaData();
    const preserved: Partial<QaParseResult> = {
      preamble: "\n# Manual QA — test-project\n",
    };
    await writeQaFile("/test/QA.md", data, preserved);

    expect(mockSerializeQa).toHaveBeenCalledOnce();
    const calledWith = mockSerializeQa.mock.calls[0][0];
    expect(calledWith.preamble).toBe("\n# Manual QA — test-project\n");

    expect(mockAtomicWriteFile).toHaveBeenCalledWith("/test/QA.md", serialized);
  });

  it("returns { success: true, data: undefined } on success", async () => {
    const result = await writeQaFile("/test/QA.md", makeQaData(), {});
    expect(result).toEqual({ success: true, data: undefined });
  });

  it("returns a typed error when atomicWriteFile rejects with EACCES", async () => {
    const err = Object.assign(new Error("permission denied"), {
      code: "EACCES",
    });
    mockAtomicWriteFile.mockRejectedValue(err);

    const result = await writeQaFile("/test/QA.md", makeQaData(), {});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe("file");
      expect(result.errors[0].message).toContain("PERMISSION");
    }
  });
});
