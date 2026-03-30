import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RoadmapFile } from "@/lib/schemas/roadmap";
import type { RoadmapParseResult } from "@/lib/fs/types";

// --- Mocks must be hoisted before module imports ---

const { mockLoadConfig } = vi.hoisted(() => ({
  mockLoadConfig: vi.fn(),
}));
vi.mock("@/lib/config", () => ({
  loadConfig: mockLoadConfig,
}));

const { mockDiscoverProjects, mockParseRoadmap, mockWriteRoadmapFile } =
  vi.hoisted(() => ({
    mockDiscoverProjects: vi.fn(),
    mockParseRoadmap: vi.fn(),
    mockWriteRoadmapFile: vi.fn(),
  }));

vi.mock("@/lib/fs", () => ({
  discoverProjects: mockDiscoverProjects,
  parseRoadmap: mockParseRoadmap,
  writeRoadmapFile: mockWriteRoadmapFile,
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

// Import AFTER mocks
import {
  bulkUpdateStatus,
  bulkMoveToCategory,
  bulkDeleteItems,
} from "@/lib/actions/bulk-roadmap-actions";

// --- Helpers ---

const defaultConfig = {
  scan_dirs: [],
  explicit_projects: [],
  exclude_dirs: [],
  scan_depth: 2,
};

function makeRoadmap(overrides: Partial<RoadmapFile> = {}): RoadmapFile {
  return {
    schema: "cc-dash/roadmap@1",
    project: "test-project",
    description: "A test roadmap",
    last_updated: "2026-03-01T10:00:00-07:00",
    categories: [
      {
        title: "Core Features",
        slug: "core-features",
        items: [
          {
            id: "r_abc12",
            status: "planned",
            name: "Feature A",
            description: "First feature",
          },
          {
            id: "r_def34",
            status: "in-progress",
            name: "Feature B",
            description: "Second feature",
            started: "2026-03-01",
          },
        ],
      },
      {
        title: "Nice to Have",
        slug: "nice-to-have",
        items: [
          {
            id: "r_ghi56",
            status: "idea",
            name: "Feature C",
            description: "Third feature",
          },
          {
            id: "r_jkl78",
            status: "planned",
            name: "Feature D",
            description: "Fourth feature",
          },
        ],
      },
    ],
    filePath: "/projects/test-project/ROADMAP.md",
    ...overrides,
  };
}

function makePreserved(
  overrides: Partial<RoadmapParseResult> = {},
): RoadmapParseResult {
  return {
    preamble: "# Roadmap",
    unknownSections: [],
    trailingContent: "",
    ...overrides,
  };
}

function setupMocks(roadmap?: RoadmapFile, preserved?: RoadmapParseResult) {
  const rm = roadmap ?? makeRoadmap();
  const pr = preserved ?? makePreserved();
  mockLoadConfig.mockResolvedValue(defaultConfig);
  mockDiscoverProjects.mockResolvedValue([
    {
      name: "Test Project",
      slug: "test-project",
      path: "/projects/test-project",
      roadmapPath: "/projects/test-project/ROADMAP.md",
      sessionPath: null,
      isExplicit: false,
    },
  ]);
  mockReadFile.mockResolvedValue("raw-roadmap");
  mockParseRoadmap.mockReturnValue({
    success: true,
    data: rm,
    preserved: pr,
  });
  mockWriteRoadmapFile.mockResolvedValue({
    success: true,
    data: undefined,
  });
  return { roadmap: rm, preserved: pr };
}

// --- bulkUpdateStatus ---

describe("bulkUpdateStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates status on multiple items", async () => {
    setupMocks();

    const result = await bulkUpdateStatus(
      "test-project",
      ["r_abc12", "r_ghi56"],
      "done",
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.updatedCount).toBe(2);
    }

    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const coreItem = writtenData.categories
      .find((c: { slug: string }) => c.slug === "core-features")
      ?.items.find((i: { id: string }) => i.id === "r_abc12");
    expect(coreItem.status).toBe("done");

    const niceItem = writtenData.categories
      .find((c: { slug: string }) => c.slug === "nice-to-have")
      ?.items.find((i: { id: string }) => i.id === "r_ghi56");
    expect(niceItem.status).toBe("done");
  });

  it("auto-sets started date when transitioning to in-progress", async () => {
    setupMocks();

    const result = await bulkUpdateStatus(
      "test-project",
      ["r_abc12"],
      "in-progress",
    );

    expect(result.success).toBe(true);

    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const item = writtenData.categories
      .find((c: { slug: string }) => c.slug === "core-features")
      ?.items.find((i: { id: string }) => i.id === "r_abc12");

    expect(item.status).toBe("in-progress");
    expect(item.started).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("does not overwrite existing started date when transitioning to in-progress", async () => {
    setupMocks();

    // r_def34 already has started: "2026-03-01"
    const result = await bulkUpdateStatus(
      "test-project",
      ["r_def34"],
      "in-progress",
    );

    expect(result.success).toBe(true);

    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const item = writtenData.categories
      .find((c: { slug: string }) => c.slug === "core-features")
      ?.items.find((i: { id: string }) => i.id === "r_def34");

    expect(item.started).toBe("2026-03-01");
  });

  it("auto-sets completed date when transitioning to done", async () => {
    setupMocks();

    const result = await bulkUpdateStatus("test-project", ["r_abc12"], "done");

    expect(result.success).toBe(true);

    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const item = writtenData.categories
      .find((c: { slug: string }) => c.slug === "core-features")
      ?.items.find((i: { id: string }) => i.id === "r_abc12");

    expect(item.completed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("revalidates after success", async () => {
    setupMocks();

    await bulkUpdateStatus("test-project", ["r_abc12"], "done");

    expect(mockRevalidatePath).toHaveBeenCalled();
  });

  it("returns error when itemIds is empty", async () => {
    setupMocks();

    const result = await bulkUpdateStatus("test-project", [], "done");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("itemIds");
    }
    expect(mockWriteRoadmapFile).not.toHaveBeenCalled();
  });

  it("returns error for invalid status", async () => {
    setupMocks();

    const result = await bulkUpdateStatus(
      "test-project",
      ["r_abc12"],
      "invalid" as never,
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("status");
    }
    expect(mockWriteRoadmapFile).not.toHaveBeenCalled();
  });

  it("returns error when no item IDs match", async () => {
    setupMocks();

    const result = await bulkUpdateStatus(
      "test-project",
      ["r_nonexistent"],
      "done",
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("itemIds");
    }
  });

  it("returns error when project not found", async () => {
    setupMocks();
    mockDiscoverProjects.mockResolvedValue([]);

    const result = await bulkUpdateStatus(
      "unknown-project",
      ["r_abc12"],
      "done",
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("slug");
    }
  });

  it("returns error when write fails", async () => {
    setupMocks();
    mockWriteRoadmapFile.mockResolvedValue({
      success: false,
      errors: [{ field: "file", message: "Write failed", received: "" }],
    });

    const result = await bulkUpdateStatus("test-project", ["r_abc12"], "done");

    expect(result.success).toBe(false);
  });
});

// --- bulkMoveToCategory ---

describe("bulkMoveToCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("moves multiple items to target category", async () => {
    setupMocks();

    const result = await bulkMoveToCategory(
      "test-project",
      ["r_abc12", "r_def34"],
      "nice-to-have",
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.movedCount).toBe(2);
    }

    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const coreCategory = writtenData.categories.find(
      (c: { slug: string }) => c.slug === "core-features",
    );
    const niceCategory = writtenData.categories.find(
      (c: { slug: string }) => c.slug === "nice-to-have",
    );

    // Source category should be empty
    expect(coreCategory.items).toHaveLength(0);

    // Target category should have original 2 + moved 2
    expect(niceCategory.items).toHaveLength(4);
    expect(niceCategory.items.map((i: { id: string }) => i.id)).toContain(
      "r_abc12",
    );
    expect(niceCategory.items.map((i: { id: string }) => i.id)).toContain(
      "r_def34",
    );
  });

  it("moves items from multiple source categories to target", async () => {
    setupMocks();

    // Move one from core-features and one from nice-to-have (but to core-features)
    const result = await bulkMoveToCategory(
      "test-project",
      ["r_ghi56"],
      "core-features",
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.movedCount).toBe(1);
    }

    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const coreCategory = writtenData.categories.find(
      (c: { slug: string }) => c.slug === "core-features",
    );
    const niceCategory = writtenData.categories.find(
      (c: { slug: string }) => c.slug === "nice-to-have",
    );

    expect(coreCategory.items).toHaveLength(3);
    expect(coreCategory.items.map((i: { id: string }) => i.id)).toContain(
      "r_ghi56",
    );
    expect(niceCategory.items).toHaveLength(1);
  });

  it("does not move items already in target category", async () => {
    setupMocks();

    // r_ghi56 and r_jkl78 are already in nice-to-have — only items from other categories count
    const result = await bulkMoveToCategory(
      "test-project",
      ["r_ghi56", "r_jkl78"],
      "nice-to-have",
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("itemIds");
    }
  });

  it("revalidates after success", async () => {
    setupMocks();

    await bulkMoveToCategory("test-project", ["r_abc12"], "nice-to-have");

    expect(mockRevalidatePath).toHaveBeenCalled();
  });

  it("returns error when itemIds is empty", async () => {
    setupMocks();

    const result = await bulkMoveToCategory("test-project", [], "nice-to-have");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("itemIds");
    }
    expect(mockWriteRoadmapFile).not.toHaveBeenCalled();
  });

  it("returns error for empty targetCategorySlug", async () => {
    setupMocks();

    const result = await bulkMoveToCategory("test-project", ["r_abc12"], "");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("targetCategorySlug");
    }
    expect(mockWriteRoadmapFile).not.toHaveBeenCalled();
  });

  it("returns error when target category does not exist", async () => {
    setupMocks();

    const result = await bulkMoveToCategory(
      "test-project",
      ["r_abc12"],
      "nonexistent-category",
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("targetCategorySlug");
    }
  });

  it("returns error when project not found", async () => {
    setupMocks();
    mockDiscoverProjects.mockResolvedValue([]);

    const result = await bulkMoveToCategory(
      "unknown-project",
      ["r_abc12"],
      "nice-to-have",
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("slug");
    }
  });

  it("returns error when write fails", async () => {
    setupMocks();
    mockWriteRoadmapFile.mockResolvedValue({
      success: false,
      errors: [{ field: "file", message: "Write failed", received: "" }],
    });

    const result = await bulkMoveToCategory(
      "test-project",
      ["r_abc12"],
      "nice-to-have",
    );

    expect(result.success).toBe(false);
  });
});

// --- bulkDeleteItems ---

describe("bulkDeleteItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes multiple items across categories", async () => {
    setupMocks();

    const result = await bulkDeleteItems("test-project", [
      "r_abc12",
      "r_ghi56",
    ]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deletedCount).toBe(2);
    }

    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const coreCategory = writtenData.categories.find(
      (c: { slug: string }) => c.slug === "core-features",
    );
    const niceCategory = writtenData.categories.find(
      (c: { slug: string }) => c.slug === "nice-to-have",
    );

    expect(coreCategory.items).toHaveLength(1);
    expect(coreCategory.items[0].id).toBe("r_def34");

    expect(niceCategory.items).toHaveLength(1);
    expect(niceCategory.items[0].id).toBe("r_jkl78");
  });

  it("deletes all items from a single category", async () => {
    setupMocks();

    const result = await bulkDeleteItems("test-project", [
      "r_abc12",
      "r_def34",
    ]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deletedCount).toBe(2);
    }

    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const coreCategory = writtenData.categories.find(
      (c: { slug: string }) => c.slug === "core-features",
    );

    expect(coreCategory.items).toHaveLength(0);
  });

  it("revalidates after success", async () => {
    setupMocks();

    await bulkDeleteItems("test-project", ["r_abc12"]);

    expect(mockRevalidatePath).toHaveBeenCalled();
  });

  it("returns error when itemIds is empty", async () => {
    setupMocks();

    const result = await bulkDeleteItems("test-project", []);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("itemIds");
    }
    expect(mockWriteRoadmapFile).not.toHaveBeenCalled();
  });

  it("returns error when an ID does not start with r_", async () => {
    setupMocks();

    const result = await bulkDeleteItems("test-project", [
      "r_abc12",
      "invalid-id",
    ]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("itemIds");
    }
    expect(mockWriteRoadmapFile).not.toHaveBeenCalled();
  });

  it("returns error when no item IDs are found", async () => {
    setupMocks();

    const result = await bulkDeleteItems("test-project", ["r_nonexistent"]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("itemIds");
    }
  });

  it("counts only items that actually existed", async () => {
    setupMocks();

    // Mix of existing and non-existing IDs
    const result = await bulkDeleteItems("test-project", [
      "r_abc12",
      "r_nonexistent",
    ]);

    // Should succeed since r_abc12 was deleted
    expect(result.success).toBe(true);
    if (result.success) {
      // Only 1 actually existed and was deleted
      expect(result.data.deletedCount).toBe(1);
    }
  });

  it("returns error when project not found", async () => {
    setupMocks();
    mockDiscoverProjects.mockResolvedValue([]);

    const result = await bulkDeleteItems("unknown-project", ["r_abc12"]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("slug");
    }
  });

  it("returns error when write fails", async () => {
    setupMocks();
    mockWriteRoadmapFile.mockResolvedValue({
      success: false,
      errors: [{ field: "file", message: "Write failed", received: "" }],
    });

    const result = await bulkDeleteItems("test-project", ["r_abc12"]);

    expect(result.success).toBe(false);
  });
});
