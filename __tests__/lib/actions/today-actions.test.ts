import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockApproveQaItem } = vi.hoisted(() => ({
  mockApproveQaItem: vi.fn(),
}));
vi.mock("@/lib/actions/qa-actions", () => ({
  approveQaItem: mockApproveQaItem,
}));

const { mockReadFile } = vi.hoisted(() => ({ mockReadFile: vi.fn() }));
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    default: { ...actual, readFile: mockReadFile },
    readFile: mockReadFile,
  };
});

const { mockAtomicWriteFile } = vi.hoisted(() => ({
  mockAtomicWriteFile: vi.fn(),
}));
vi.mock("@/lib/fs/atomic-write", () => ({
  atomicWriteFile: mockAtomicWriteFile,
}));

const { mockRevalidatePath } = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

import { approveQaFromDirections } from "@/lib/actions/today-actions";

const DIRECTIONS_FIXTURE = `---
schema: cc-dash/today-directions@1
generated: 2026-05-07T08:30:00-06:00
for_date: 2026-05-07
---

# Today's Directions

## QA items to run today
- [ ] <!-- ref:q_aaaaa slug:project-beta --> First check
- [ ] <!-- ref:q_bbbbb slug:project-gamma --> Second check
- [x] <!-- ref:q_ccccc slug:theta-blog --> Already done
`;

describe("approveQaFromDirections", () => {
  beforeEach(() => {
    mockApproveQaItem.mockReset();
    mockReadFile.mockReset();
    mockAtomicWriteFile.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("approves the QA item and toggles its checkbox in the directions file", async () => {
    mockApproveQaItem.mockResolvedValue({ success: true, data: undefined });
    mockReadFile.mockResolvedValue(DIRECTIONS_FIXTURE);
    mockAtomicWriteFile.mockResolvedValue(undefined);

    const result = await approveQaFromDirections("project-beta", "q_aaaaa", {
      pathOverride: "/x/today.md",
    });

    expect(result.success).toBe(true);
    expect(mockApproveQaItem).toHaveBeenCalledWith("project-beta", "q_aaaaa");

    expect(mockAtomicWriteFile).toHaveBeenCalledTimes(1);
    const [, writtenContent] = mockAtomicWriteFile.mock.calls[0];
    expect(writtenContent).toContain(
      "- [x] <!-- ref:q_aaaaa slug:project-beta --> First check",
    );
    expect(writtenContent).toContain(
      "- [ ] <!-- ref:q_bbbbb slug:project-gamma --> Second check",
    );
    expect(writtenContent).toContain(
      "- [x] <!-- ref:q_ccccc slug:theta-blog --> Already done",
    );
  });

  it("revalidates the /today and /qa paths on success", async () => {
    mockApproveQaItem.mockResolvedValue({ success: true, data: undefined });
    mockReadFile.mockResolvedValue(DIRECTIONS_FIXTURE);
    mockAtomicWriteFile.mockResolvedValue(undefined);

    await approveQaFromDirections("project-beta", "q_aaaaa", {
      pathOverride: "/x/today.md",
    });

    const calls = mockRevalidatePath.mock.calls.map((call) => call[0]);
    expect(calls).toContain("/today");
    expect(calls).toContain("/qa");
  });

  it("treats 'already passed' as idempotent success and still rewrites the box", async () => {
    mockApproveQaItem.mockResolvedValue({
      success: false,
      errors: [
        {
          field: "status",
          message: "QA item is already passed; reset it before re-marking",
          received: "passed",
        },
      ],
    });
    mockReadFile.mockResolvedValue(DIRECTIONS_FIXTURE);
    mockAtomicWriteFile.mockResolvedValue(undefined);

    const result = await approveQaFromDirections("project-beta", "q_aaaaa", {
      pathOverride: "/x/today.md",
    });

    expect(result.success).toBe(true);
    expect(mockAtomicWriteFile).toHaveBeenCalledTimes(1);
  });

  it("returns the QA failure for non-status errors and skips the directions write", async () => {
    mockApproveQaItem.mockResolvedValue({
      success: false,
      errors: [
        {
          field: "slug",
          message: "Project not found",
          received: "project-beta",
        },
      ],
    });

    const result = await approveQaFromDirections("project-beta", "q_aaaaa", {
      pathOverride: "/x/today.md",
    });

    expect(result.success).toBe(false);
    expect(mockAtomicWriteFile).not.toHaveBeenCalled();
  });

  it("succeeds even when the directions file is missing (canonical state mutated)", async () => {
    mockApproveQaItem.mockResolvedValue({ success: true, data: undefined });
    const enoent = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    mockReadFile.mockRejectedValue(enoent);

    const result = await approveQaFromDirections("project-beta", "q_aaaaa", {
      pathOverride: "/x/missing.md",
    });

    expect(result.success).toBe(true);
    expect(mockAtomicWriteFile).not.toHaveBeenCalled();
  });

  it("does not rewrite when the qaId does not appear in the directions file", async () => {
    mockApproveQaItem.mockResolvedValue({ success: true, data: undefined });
    mockReadFile.mockResolvedValue(DIRECTIONS_FIXTURE);

    const result = await approveQaFromDirections("project-beta", "q_zzzzz", {
      pathOverride: "/x/today.md",
    });

    expect(result.success).toBe(true);
    expect(mockAtomicWriteFile).not.toHaveBeenCalled();
  });

  it("is idempotent on a checkbox already marked [x]", async () => {
    mockApproveQaItem.mockResolvedValue({ success: true, data: undefined });
    mockReadFile.mockResolvedValue(DIRECTIONS_FIXTURE);

    const result = await approveQaFromDirections("theta-blog", "q_ccccc", {
      pathOverride: "/x/today.md",
    });

    expect(result.success).toBe(true);
    // No rewrite needed -- box was already [x]
    expect(mockAtomicWriteFile).not.toHaveBeenCalled();
  });
});
