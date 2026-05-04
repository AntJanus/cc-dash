import { describe, it, expect, vi, beforeEach } from "vitest";
import type { QaFile, QaItem } from "@/lib/schemas/qa";
import type { QaParseResult, RoadmapParseResult } from "@/lib/fs/types";
import type { RoadmapFile } from "@/lib/schemas/roadmap";

// --- Mocks ---

const { mockLoadConfig } = vi.hoisted(() => ({ mockLoadConfig: vi.fn() }));
vi.mock("@/lib/config", () => ({ loadConfig: mockLoadConfig }));

const {
  mockDiscoverProjects,
  mockParseQa,
  mockParseRoadmap,
  mockWriteQaFile,
  mockWriteRoadmapFile,
} = vi.hoisted(() => ({
  mockDiscoverProjects: vi.fn(),
  mockParseQa: vi.fn(),
  mockParseRoadmap: vi.fn(),
  mockWriteQaFile: vi.fn(),
  mockWriteRoadmapFile: vi.fn(),
}));
vi.mock("@/lib/fs", () => ({
  discoverProjects: mockDiscoverProjects,
  parseQa: mockParseQa,
  parseRoadmap: mockParseRoadmap,
  writeQaFile: mockWriteQaFile,
  writeRoadmapFile: mockWriteRoadmapFile,
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

const { mockRevalidatePath } = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

const { mockGenerateRoadmapId, mockGenerateCategorySlug } = vi.hoisted(() => ({
  mockGenerateRoadmapId: vi.fn(),
  mockGenerateCategorySlug: vi.fn(),
}));
vi.mock("@/lib/utils/generate-id", () => ({
  generateRoadmapId: mockGenerateRoadmapId,
  generateCategorySlug: mockGenerateCategorySlug,
}));

import {
  approveQaItem,
  failQaItem,
  skipQaItem,
  markQaNeedsDecision,
  resetQaItem,
} from "@/lib/actions/qa-actions";

// --- Factories ---

function makeQaItem(overrides: Partial<QaItem> = {}): QaItem {
  return {
    id: "q_aaaaa",
    status: "pending",
    description: "Sample QA check",
    ...overrides,
  };
}

function makeQa(overrides: Partial<QaFile> = {}): QaFile {
  return {
    schema: "cc-dash/qa@1",
    project: "test-project",
    last_updated: "2026-05-04T10:00:00Z",
    setup: "Run: `make test`",
    items: [makeQaItem()],
    filePath: "/projects/test/QA.md",
    ...overrides,
  };
}

function makePreservedQa(): QaParseResult {
  return { preamble: "", unknownSections: [], trailingContent: "" };
}

function makeRoadmap(overrides: Partial<RoadmapFile> = {}): RoadmapFile {
  return {
    schema: "cc-dash/roadmap@1",
    project: "test-project",
    description: "Test roadmap",
    last_updated: "2026-05-04T10:00:00Z",
    categories: [
      {
        title: "Core",
        slug: "core",
        items: [],
      },
    ],
    filePath: "/projects/test/ROADMAP.md",
    ...overrides,
  };
}

function makePreservedRoadmap(): RoadmapParseResult {
  return { preamble: "", unknownSections: [], trailingContent: "" };
}

const project = {
  name: "test-project",
  slug: "test-project",
  path: "/projects/test",
  roadmapPath: "/projects/test/ROADMAP.md",
  sessionPath: null,
  qaPath: "/projects/test/QA.md",
  isExplicit: false,
};

const projectNoRoadmap = { ...project, roadmapPath: null };
const projectNoQa = { ...project, qaPath: null };

// --- Setup ---

beforeEach(() => {
  vi.clearAllMocks();
  mockLoadConfig.mockResolvedValue({
    scan_dirs: [],
    explicit_projects: [],
    exclude_dirs: [],
    scan_depth: 2,
  });
  mockDiscoverProjects.mockResolvedValue([project]);
  mockReadFile.mockResolvedValue("dummy raw markdown");
  mockWriteQaFile.mockResolvedValue({ success: true, data: undefined });
  mockWriteRoadmapFile.mockResolvedValue({ success: true, data: undefined });
  mockGenerateRoadmapId.mockReturnValue("r_zzzzz");
  mockGenerateCategorySlug.mockReturnValue("qa-issues");
});

function setQa(qa: QaFile) {
  mockParseQa.mockReturnValue({
    success: true,
    data: qa,
    preserved: makePreservedQa(),
  });
}

function setRoadmap(rm: RoadmapFile) {
  mockParseRoadmap.mockReturnValue({
    success: true,
    data: rm,
    preserved: makePreservedRoadmap(),
  });
}

// --- Tests ---

describe("approveQaItem", () => {
  it("flips a pending item to passed and stamps `at`", async () => {
    const qa = makeQa();
    setQa(qa);

    const result = await approveQaItem("test-project", "q_aaaaa");
    expect(result.success).toBe(true);

    const written = mockWriteQaFile.mock.calls[0][1] as QaFile;
    expect(written.items[0].status).toBe("passed");
    expect(written.items[0].at).toBeDefined();
    expect(typeof written.items[0].at).toBe("string");
  });

  it("rejects an item that is already passed", async () => {
    setQa(
      makeQa({
        items: [makeQaItem({ status: "passed", at: "2026-05-04T10:00:00Z" })],
      }),
    );

    const result = await approveQaItem("test-project", "q_aaaaa");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].message).toContain("already passed");
    }
    expect(mockWriteQaFile).not.toHaveBeenCalled();
  });

  it("returns not-found when itemId does not exist", async () => {
    setQa(makeQa());
    const result = await approveQaItem("test-project", "q_zzzzz");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("itemId");
    }
  });

  it("returns project-not-found when slug is unknown", async () => {
    mockDiscoverProjects.mockResolvedValue([]);
    const result = await approveQaItem("missing", "q_aaaaa");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("slug");
    }
  });

  it("fails when the project has no QA.md", async () => {
    mockDiscoverProjects.mockResolvedValue([projectNoQa]);
    const result = await approveQaItem("test-project", "q_aaaaa");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("qaPath");
    }
  });
});

describe("failQaItem", () => {
  it("flips a pending item to failed, sets `at`, sets `roadmapRef`, stores note", async () => {
    setQa(makeQa());
    setRoadmap(makeRoadmap());

    const result = await failQaItem(
      "test-project",
      "q_aaaaa",
      "Saw error X — see log",
    );
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.roadmapItemId).toBe("r_zzzzz");

    const writtenQa = mockWriteQaFile.mock.calls[0][1] as QaFile;
    expect(writtenQa.items[0].status).toBe("failed");
    expect(writtenQa.items[0].roadmapRef).toBe("r_zzzzz");
    expect(writtenQa.items[0].note).toBe("Saw error X — see log");
    expect(writtenQa.items[0].at).toBeDefined();
  });

  it("creates a new 'QA Issues' category when none exists", async () => {
    setQa(makeQa());
    setRoadmap(makeRoadmap()); // only has the "Core" category

    await failQaItem("test-project", "q_aaaaa", "broken");

    const writtenRoadmap = mockWriteRoadmapFile.mock.calls[0][1] as RoadmapFile;
    const qaCategory = writtenRoadmap.categories.find(
      (c) => c.slug === "qa-issues",
    );
    expect(qaCategory).toBeDefined();
    expect(qaCategory!.title).toBe("QA Issues");
    expect(qaCategory!.items).toHaveLength(1);
    expect(qaCategory!.items[0].id).toBe("r_zzzzz");
    expect(qaCategory!.items[0].name).toBe("Sample QA check");
    expect(qaCategory!.items[0].status).toBe("planned");
    expect(qaCategory!.items[0].description).toContain("broken");
    expect(qaCategory!.items[0].description).toContain(
      "*From QA item: q_aaaaa in test-project*",
    );
  });

  it("appends to an existing 'QA Issues' category instead of duplicating it", async () => {
    setQa(makeQa());
    setRoadmap(
      makeRoadmap({
        categories: [
          { title: "Core", slug: "core", items: [] },
          {
            title: "QA Issues",
            slug: "qa-issues",
            items: [
              {
                id: "r_existing",
                status: "planned",
                name: "Old QA issue",
                description: "Existing",
              },
            ],
          },
        ],
      }),
    );

    await failQaItem("test-project", "q_aaaaa", "another problem");

    const writtenRoadmap = mockWriteRoadmapFile.mock.calls[0][1] as RoadmapFile;
    const qaCategories = writtenRoadmap.categories.filter(
      (c) => c.slug === "qa-issues",
    );
    expect(qaCategories).toHaveLength(1);
    expect(qaCategories[0].items).toHaveLength(2);
    expect(qaCategories[0].items.map((i) => i.id)).toContain("r_existing");
    expect(qaCategories[0].items.map((i) => i.id)).toContain("r_zzzzz");
  });

  it("requires a non-empty note", async () => {
    setQa(makeQa());
    setRoadmap(makeRoadmap());

    const result = await failQaItem("test-project", "q_aaaaa", "   ");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("note");
    }
    expect(mockWriteRoadmapFile).not.toHaveBeenCalled();
    expect(mockWriteQaFile).not.toHaveBeenCalled();
  });

  it("rejects when the project has no ROADMAP.md (cannot record the issue)", async () => {
    mockDiscoverProjects.mockResolvedValue([projectNoRoadmap]);
    const result = await failQaItem("test-project", "q_aaaaa", "broken");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("roadmapPath");
    }
    expect(mockWriteQaFile).not.toHaveBeenCalled();
  });

  it("rejects an item that is not pending", async () => {
    setQa(
      makeQa({
        items: [makeQaItem({ status: "passed", at: "2026-05-04T10:00:00Z" })],
      }),
    );
    setRoadmap(makeRoadmap());

    const result = await failQaItem("test-project", "q_aaaaa", "note");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].message).toContain("already passed");
    }
    expect(mockWriteRoadmapFile).not.toHaveBeenCalled();
    expect(mockWriteQaFile).not.toHaveBeenCalled();
  });
});

describe("skipQaItem", () => {
  it("flips pending to skipped without requiring a note", async () => {
    setQa(makeQa());
    const result = await skipQaItem("test-project", "q_aaaaa");
    expect(result.success).toBe(true);

    const written = mockWriteQaFile.mock.calls[0][1] as QaFile;
    expect(written.items[0].status).toBe("skipped");
    expect(written.items[0].at).toBeDefined();
    expect(written.items[0].note).toBeUndefined();
  });

  it("stores an optional note when one is provided", async () => {
    setQa(makeQa());
    await skipQaItem("test-project", "q_aaaaa", "RAWG_API_KEY not set");

    const written = mockWriteQaFile.mock.calls[0][1] as QaFile;
    expect(written.items[0].note).toBe("RAWG_API_KEY not set");
  });

  it("rejects a non-pending item", async () => {
    setQa(
      makeQa({
        items: [makeQaItem({ status: "skipped", at: "2026-05-04T10:00:00Z" })],
      }),
    );
    const result = await skipQaItem("test-project", "q_aaaaa");
    expect(result.success).toBe(false);
  });
});

describe("markQaNeedsDecision", () => {
  it("flips pending to needs-decision and requires a note", async () => {
    setQa(makeQa());
    const result = await markQaNeedsDecision(
      "test-project",
      "q_aaaaa",
      "Needs design conversation first",
    );
    expect(result.success).toBe(true);

    const written = mockWriteQaFile.mock.calls[0][1] as QaFile;
    expect(written.items[0].status).toBe("needs-decision");
    expect(written.items[0].note).toBe("Needs design conversation first");
    expect(written.items[0].at).toBeDefined();
  });

  it("rejects an empty note", async () => {
    setQa(makeQa());
    const result = await markQaNeedsDecision("test-project", "q_aaaaa", "");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("note");
    }
    expect(mockWriteQaFile).not.toHaveBeenCalled();
  });

  it("does NOT touch ROADMAP.md", async () => {
    setQa(makeQa());
    await markQaNeedsDecision("test-project", "q_aaaaa", "Decision needed");
    expect(mockWriteRoadmapFile).not.toHaveBeenCalled();
  });
});

describe("resetQaItem", () => {
  it("resets a failed item back to pending and clears at/ref/note", async () => {
    setQa(
      makeQa({
        items: [
          makeQaItem({
            status: "failed",
            at: "2026-05-04T10:00:00Z",
            roadmapRef: "r_xyz12",
            note: "Earlier failure",
          }),
        ],
      }),
    );

    const result = await resetQaItem("test-project", "q_aaaaa");
    expect(result.success).toBe(true);

    const written = mockWriteQaFile.mock.calls[0][1] as QaFile;
    expect(written.items[0].status).toBe("pending");
    expect(written.items[0].at).toBeUndefined();
    expect(written.items[0].roadmapRef).toBeUndefined();
    expect(written.items[0].note).toBeUndefined();
  });

  it("is idempotent on an already-pending item (no write)", async () => {
    setQa(makeQa());
    const result = await resetQaItem("test-project", "q_aaaaa");
    expect(result.success).toBe(true);
    expect(mockWriteQaFile).not.toHaveBeenCalled();
  });

  it("does not delete the linked roadmap item", async () => {
    setQa(
      makeQa({
        items: [
          makeQaItem({
            status: "failed",
            at: "2026-05-04T10:00:00Z",
            roadmapRef: "r_xyz12",
          }),
        ],
      }),
    );
    await resetQaItem("test-project", "q_aaaaa");
    expect(mockWriteRoadmapFile).not.toHaveBeenCalled();
  });
});
