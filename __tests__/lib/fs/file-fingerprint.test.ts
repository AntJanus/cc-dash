import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockStat } = vi.hoisted(() => ({
  mockStat: vi.fn(),
}));

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual, default: { ...actual, stat: mockStat }, stat: mockStat };
});

vi.mock("@/lib/config", () => ({
  loadConfig: vi.fn().mockResolvedValue({
    scan_dirs: ["~/projects"],
    exclude_dirs: ["node_modules"],
    explicit_projects: [],
    scan_depth: 2,
    orchestrator_dir: "~/portfolio",
  }),
}));

vi.mock("@/lib/fs", () => ({
  discoverProjects: vi.fn().mockResolvedValue([
    {
      name: "project-a",
      slug: "project-a",
      path: "/tmp/project-a",
      roadmapPath: "/tmp/project-a/ROADMAP.md",
      sessionPath: "/tmp/project-a/SESSION_PROGRESS.md",
      isExplicit: false,
    },
    {
      name: "project-b",
      slug: "project-b",
      path: "/tmp/project-b",
      roadmapPath: "/tmp/project-b/ROADMAP.md",
      sessionPath: null,
      isExplicit: false,
    },
  ]),
}));

import { computeFileFingerprint } from "@/lib/fs/file-fingerprint";

describe("computeFileFingerprint", () => {
  beforeEach(() => {
    mockStat.mockReset();
  });

  it("returns a hex string", async () => {
    mockStat.mockResolvedValue({ mtimeMs: 1000 });
    const fp = await computeFileFingerprint();
    expect(fp).toMatch(/^[a-f0-9]{16}$/);
  });

  it("returns different fingerprint when mtimes change", async () => {
    mockStat.mockResolvedValue({ mtimeMs: 1000 });
    const fp1 = await computeFileFingerprint();

    mockStat.mockResolvedValue({ mtimeMs: 2000 });
    const fp2 = await computeFileFingerprint();

    expect(fp1).not.toBe(fp2);
  });

  it("returns same fingerprint for same mtimes", async () => {
    mockStat.mockResolvedValue({ mtimeMs: 1000 });
    const fp1 = await computeFileFingerprint();

    mockStat.mockResolvedValue({ mtimeMs: 1000 });
    const fp2 = await computeFileFingerprint();

    expect(fp1).toBe(fp2);
  });

  it("handles missing files gracefully", async () => {
    mockStat.mockRejectedValue(new Error("ENOENT"));
    const fp = await computeFileFingerprint();
    // Should not throw, and should return a valid hash (of empty input)
    expect(fp).toMatch(/^[a-f0-9]{16}$/);
  });

  it("stats roadmap, session, and the portfolio TODAYS_DIRECTIONS.md", async () => {
    mockStat.mockResolvedValue({ mtimeMs: 1000 });
    await computeFileFingerprint();
    // project-a has 2 files, project-b has 1 (sessionPath is null),
    // plus the portfolio-level TODAYS_DIRECTIONS.md.
    expect(mockStat).toHaveBeenCalledTimes(4);
    expect(mockStat).toHaveBeenCalledWith("/tmp/project-a/ROADMAP.md");
    expect(mockStat).toHaveBeenCalledWith("/tmp/project-a/SESSION_PROGRESS.md");
    expect(mockStat).toHaveBeenCalledWith("/tmp/project-b/ROADMAP.md");
    expect(mockStat).toHaveBeenCalledWith(
      expect.stringMatching(/\/portfolio\/TODAYS_DIRECTIONS\.md$/),
    );
  });

  it("changes the fingerprint when only the directions file mtime changes", async () => {
    let directionsMtime = 1000;
    mockStat.mockImplementation((path: string) => {
      if (path.endsWith("TODAYS_DIRECTIONS.md")) {
        return Promise.resolve({ mtimeMs: directionsMtime });
      }
      return Promise.resolve({ mtimeMs: 5000 });
    });

    const before = await computeFileFingerprint();
    directionsMtime = 9999;
    const after = await computeFileFingerprint();

    expect(before).not.toBe(after);
  });
});
