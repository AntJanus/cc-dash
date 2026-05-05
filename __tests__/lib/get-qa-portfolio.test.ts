import { describe, it, expect, vi, beforeEach } from "vitest";
import type { QaFile, QaItem } from "@/lib/schemas/qa";

const { mockLoadConfig } = vi.hoisted(() => ({ mockLoadConfig: vi.fn() }));
vi.mock("@/lib/config", () => ({ loadConfig: mockLoadConfig }));

const { mockDiscoverProjects, mockParseQa } = vi.hoisted(() => ({
  mockDiscoverProjects: vi.fn(),
  mockParseQa: vi.fn(),
}));
vi.mock("@/lib/fs", () => ({
  discoverProjects: mockDiscoverProjects,
  parseQa: mockParseQa,
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

import { getQaPortfolio } from "@/lib/projects/get-qa-portfolio";

function makeItem(overrides: Partial<QaItem> = {}): QaItem {
  return {
    id: "q_aaaaa",
    status: "pending",
    description: "Item",
    ...overrides,
  };
}

function makeQa(overrides: Partial<QaFile> = {}): QaFile {
  return {
    schema: "cc-dash/qa@1",
    project: "p",
    last_updated: "2026-05-04T10:00:00Z",
    setup: "",
    items: [],
    filePath: "/p/QA.md",
    ...overrides,
  };
}

function setProjects(
  ...specs: Array<{
    slug: string;
    name?: string;
    qaPath: string | null;
    roadmapPath?: string | null;
  }>
) {
  mockDiscoverProjects.mockResolvedValue(
    specs.map((spec) => ({
      name: spec.name ?? spec.slug,
      slug: spec.slug,
      path: `/projects/${spec.slug}`,
      roadmapPath: spec.roadmapPath ?? null,
      sessionPath: null,
      qaPath: spec.qaPath,
      isExplicit: false,
    })),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLoadConfig.mockResolvedValue({
    scan_dirs: [],
    explicit_projects: [],
    exclude_dirs: [],
    scan_depth: 2,
  });
});

describe("getQaPortfolio", () => {
  it("returns empty array when no projects have QA.md", async () => {
    setProjects({ slug: "a", qaPath: null }, { slug: "b", qaPath: null });
    const cards = await getQaPortfolio();
    expect(cards).toEqual([]);
  });

  it("tallies items by status into per-project counts", async () => {
    setProjects({
      slug: "project-beta",
      qaPath: "/projects/project-beta/QA.md",
      roadmapPath: "/projects/project-beta/ROADMAP.md",
    });
    mockReadFile.mockResolvedValue("raw");
    mockParseQa.mockReturnValue({
      success: true,
      data: makeQa({
        project: "project-beta",
        items: [
          makeItem({ id: "q_aaaaa", status: "pending" }),
          makeItem({
            id: "q_bbbbb",
            status: "passed",
            at: "2026-05-04T10:00:00Z",
          }),
          makeItem({
            id: "q_ccccc",
            status: "failed",
            at: "2026-05-04T10:00:00Z",
          }),
          makeItem({
            id: "q_ddddd",
            status: "needs-decision",
            at: "2026-05-04T10:00:00Z",
          }),
          makeItem({
            id: "q_eeeee",
            status: "skipped",
            at: "2026-05-04T10:00:00Z",
          }),
        ],
      }),
      preserved: { preamble: "", unknownSections: [], trailingContent: "" },
    });

    const cards = await getQaPortfolio();
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      slug: "project-beta",
      total: 5,
      pending: 1,
      passed: 1,
      failed: 1,
      needsDecision: 1,
      skipped: 1,
      hasRoadmap: true,
    });
  });

  it("sorts cards: most pending first, then most recent last_updated", async () => {
    setProjects(
      { slug: "alpha", qaPath: "/projects/alpha/QA.md" },
      { slug: "beta", qaPath: "/projects/beta/QA.md" },
      { slug: "gamma", qaPath: "/projects/gamma/QA.md" },
    );
    mockReadFile.mockResolvedValue("raw");

    let call = 0;
    const datasets = [
      // alpha: 1 pending, older
      makeQa({
        project: "alpha",
        last_updated: "2026-05-01T10:00:00Z",
        items: [makeItem({ id: "q_aaaaa", status: "pending" })],
      }),
      // beta: 3 pending, oldest
      makeQa({
        project: "beta",
        last_updated: "2026-04-01T10:00:00Z",
        items: [
          makeItem({ id: "q_bbbbb", status: "pending" }),
          makeItem({ id: "q_bbbbc", status: "pending" }),
          makeItem({ id: "q_bbbbd", status: "pending" }),
        ],
      }),
      // gamma: 1 pending, most recent
      makeQa({
        project: "gamma",
        last_updated: "2026-05-04T10:00:00Z",
        items: [makeItem({ id: "q_ccccc", status: "pending" })],
      }),
    ];
    mockParseQa.mockImplementation(() => ({
      success: true,
      data: datasets[call++],
      preserved: { preamble: "", unknownSections: [], trailingContent: "" },
    }));

    const cards = await getQaPortfolio();
    expect(cards.map((c) => c.slug)).toEqual(["beta", "gamma", "alpha"]);
  });

  it("includes the first 3 pending item descriptions as upcomingPreview", async () => {
    setProjects({ slug: "p", qaPath: "/projects/p/QA.md" });
    mockReadFile.mockResolvedValue("raw");
    mockParseQa.mockReturnValue({
      success: true,
      data: makeQa({
        items: [
          makeItem({ id: "q_aaaaa", status: "pending", description: "First" }),
          makeItem({
            id: "q_bbbbb",
            status: "passed",
            at: "2026-05-04T10:00:00Z",
            description: "Already done",
          }),
          makeItem({ id: "q_ccccc", status: "pending", description: "Second" }),
          makeItem({ id: "q_ddddd", status: "pending", description: "Third" }),
          makeItem({
            id: "q_eeeee",
            status: "pending",
            description: "Fourth (excluded)",
          }),
        ],
      }),
      preserved: { preamble: "", unknownSections: [], trailingContent: "" },
    });

    const cards = await getQaPortfolio();
    expect(cards[0].upcomingPreview).toEqual(["First", "Second", "Third"]);
  });

  it("skips projects with unreadable QA.md without crashing the portfolio", async () => {
    setProjects(
      { slug: "alpha", qaPath: "/projects/alpha/QA.md" },
      { slug: "broken", qaPath: "/projects/broken/QA.md" },
    );
    mockReadFile.mockImplementation((path: string) => {
      if (path.includes("broken")) return Promise.reject(new Error("EACCES"));
      return Promise.resolve("raw");
    });
    mockParseQa.mockReturnValue({
      success: true,
      data: makeQa({
        project: "alpha",
        items: [makeItem({ id: "q_aaaaa", status: "pending" })],
      }),
      preserved: { preamble: "", unknownSections: [], trailingContent: "" },
    });

    const cards = await getQaPortfolio();
    expect(cards).toHaveLength(1);
    expect(cards[0].slug).toBe("alpha");
  });

  it("skips projects whose QA.md fails to parse", async () => {
    setProjects(
      { slug: "alpha", qaPath: "/projects/alpha/QA.md" },
      { slug: "bad", qaPath: "/projects/bad/QA.md" },
    );
    mockReadFile.mockResolvedValue("raw");

    let call = 0;
    mockParseQa.mockImplementation(() => {
      call++;
      if (call === 1) {
        return {
          success: true,
          data: makeQa({ project: "alpha" }),
          preserved: {
            preamble: "",
            unknownSections: [],
            trailingContent: "",
          },
        };
      }
      return {
        success: false,
        errors: [{ field: "x", message: "bad", received: null }],
      };
    });

    const cards = await getQaPortfolio();
    expect(cards.map((c) => c.slug)).toEqual(["alpha"]);
  });
});
