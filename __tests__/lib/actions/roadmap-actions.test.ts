import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RoadmapFile } from "@/lib/schemas/roadmap";
import type { RoadmapParseResult } from "@/lib/fs/types";

// --- Mocks must be set up before importing the module under test ---

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

const { mockGenerateRoadmapId, mockGenerateCategorySlug } = vi.hoisted(() => ({
  mockGenerateRoadmapId: vi.fn(),
  mockGenerateCategorySlug: vi.fn(),
}));
vi.mock("@/lib/utils/generate-id", () => ({
  generateRoadmapId: mockGenerateRoadmapId,
  generateCategorySlug: mockGenerateCategorySlug,
}));

// Import AFTER mocks
import {
  addRoadmapItem,
  updateRoadmapItem,
  deleteRoadmapItem,
  reorderRoadmapItems,
  addRoadmapCategory,
  deleteRoadmapCategory,
} from "@/lib/actions/roadmap-actions";

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
  mockGenerateRoadmapId.mockReturnValue("r_new01");
  mockGenerateCategorySlug.mockImplementation((title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
  );
  return { roadmap: rm, preserved: pr };
}

// --- Tests ---

describe("addRoadmapItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds item to correct category", async () => {
    setupMocks();

    const result = await addRoadmapItem("test-project", "core-features", {
      name: "New Item",
      description: "New description",
      status: "planned",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("r_new01");
    }

    // Verify the item was added to the correct category
    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const coreCategory = writtenData.categories.find(
      (c: { slug: string }) => c.slug === "core-features",
    );
    expect(coreCategory.items).toHaveLength(3);
    expect(coreCategory.items[2].name).toBe("New Item");
  });

  it("generates unique r_ ID", async () => {
    setupMocks();

    const result = await addRoadmapItem("test-project", "core-features", {
      name: "New Item",
      description: "desc",
      status: "planned",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toMatch(/^r_[a-z0-9]{5}$/);
    }
    expect(mockGenerateRoadmapId).toHaveBeenCalledOnce();
  });

  it("validates name is non-empty", async () => {
    setupMocks();

    const result = await addRoadmapItem("test-project", "core-features", {
      name: "   ",
      description: "desc",
      status: "planned",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("name");
    }
  });

  it("validates status against RoadmapStatus enum", async () => {
    setupMocks();

    const result = await addRoadmapItem("test-project", "core-features", {
      name: "Item",
      description: "desc",
      status: "invalid-status" as never,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("status");
    }
  });

  it("returns error for unknown category slug", async () => {
    setupMocks();

    const result = await addRoadmapItem("test-project", "nonexistent", {
      name: "Item",
      description: "desc",
      status: "planned",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("categorySlug");
    }
  });

  it("returns error for unknown project slug", async () => {
    mockLoadConfig.mockResolvedValue(defaultConfig);
    mockDiscoverProjects.mockResolvedValue([]);

    const result = await addRoadmapItem("nonexistent", "core-features", {
      name: "Item",
      description: "desc",
      status: "planned",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("slug");
    }
  });

  it("auto-sets started date when status is in-progress", async () => {
    setupMocks();

    await addRoadmapItem("test-project", "core-features", {
      name: "New Item",
      description: "desc",
      status: "in-progress",
    });

    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const coreCategory = writtenData.categories.find(
      (c: { slug: string }) => c.slug === "core-features",
    );
    const newItem = coreCategory.items[coreCategory.items.length - 1];
    expect(newItem.started).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("auto-sets completed date when status is done", async () => {
    setupMocks();

    await addRoadmapItem("test-project", "core-features", {
      name: "New Item",
      description: "desc",
      status: "done",
    });

    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const coreCategory = writtenData.categories.find(
      (c: { slug: string }) => c.slug === "core-features",
    );
    const newItem = coreCategory.items[coreCategory.items.length - 1];
    expect(newItem.completed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("passes preserved content to writeRoadmapFile", async () => {
    const { preserved } = setupMocks();

    await addRoadmapItem("test-project", "core-features", {
      name: "New Item",
      description: "desc",
      status: "planned",
    });

    const [, , preservedArg] = mockWriteRoadmapFile.mock.calls[0];
    expect(preservedArg).toEqual(preserved);
  });

  it("calls revalidatePath after write", async () => {
    setupMocks();

    await addRoadmapItem("test-project", "core-features", {
      name: "New Item",
      description: "desc",
      status: "planned",
    });

    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/project/test-project/roadmap",
    );
  });
});

describe("updateRoadmapItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates item name", async () => {
    setupMocks();

    const result = await updateRoadmapItem("test-project", "r_abc12", {
      name: "Updated Name",
    });

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const item = writtenData.categories[0].items.find(
      (i: { id: string }) => i.id === "r_abc12",
    );
    expect(item.name).toBe("Updated Name");
  });

  it("updates item description", async () => {
    setupMocks();

    const result = await updateRoadmapItem("test-project", "r_abc12", {
      description: "Updated Description",
    });

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const item = writtenData.categories[0].items.find(
      (i: { id: string }) => i.id === "r_abc12",
    );
    expect(item.description).toBe("Updated Description");
  });

  it("updates item status", async () => {
    setupMocks();

    const result = await updateRoadmapItem("test-project", "r_abc12", {
      status: "in-progress",
    });

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const item = writtenData.categories[0].items.find(
      (i: { id: string }) => i.id === "r_abc12",
    );
    expect(item.status).toBe("in-progress");
  });

  it("auto-sets started on status change to in-progress", async () => {
    setupMocks();

    await updateRoadmapItem("test-project", "r_abc12", {
      status: "in-progress",
    });

    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const item = writtenData.categories[0].items.find(
      (i: { id: string }) => i.id === "r_abc12",
    );
    expect(item.started).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("auto-sets completed on status change to done", async () => {
    setupMocks();

    await updateRoadmapItem("test-project", "r_abc12", {
      status: "done",
    });

    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const item = writtenData.categories[0].items.find(
      (i: { id: string }) => i.id === "r_abc12",
    );
    expect(item.completed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("moves item to different category when categorySlug provided", async () => {
    setupMocks();

    const result = await updateRoadmapItem("test-project", "r_abc12", {
      categorySlug: "nice-to-have",
    });

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    // Item removed from source category
    const sourceCategory = writtenData.categories.find(
      (c: { slug: string }) => c.slug === "core-features",
    );
    expect(
      sourceCategory.items.find((i: { id: string }) => i.id === "r_abc12"),
    ).toBeUndefined();
    // Item added to target category
    const targetCategory = writtenData.categories.find(
      (c: { slug: string }) => c.slug === "nice-to-have",
    );
    expect(
      targetCategory.items.find((i: { id: string }) => i.id === "r_abc12"),
    ).toBeDefined();
  });

  it("returns error for unknown item ID", async () => {
    setupMocks();

    const result = await updateRoadmapItem("test-project", "r_zzzzz", {
      name: "Updated",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("itemId");
    }
  });

  it("preserves other fields during partial update", async () => {
    setupMocks();

    await updateRoadmapItem("test-project", "r_abc12", {
      name: "Updated Name",
    });

    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const item = writtenData.categories[0].items.find(
      (i: { id: string }) => i.id === "r_abc12",
    );
    // Original fields preserved
    expect(item.description).toBe("First feature");
    expect(item.status).toBe("planned");
    expect(item.id).toBe("r_abc12");
  });
});

describe("deleteRoadmapItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes item from category", async () => {
    setupMocks();

    const result = await deleteRoadmapItem("test-project", "r_abc12");

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const coreCategory = writtenData.categories.find(
      (c: { slug: string }) => c.slug === "core-features",
    );
    expect(coreCategory.items).toHaveLength(1);
    expect(
      coreCategory.items.find((i: { id: string }) => i.id === "r_abc12"),
    ).toBeUndefined();
  });

  it("returns error for unknown item ID", async () => {
    setupMocks();

    const result = await deleteRoadmapItem("test-project", "r_zzzzz");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("itemId");
    }
  });

  it("validates item ID format (r_ prefix)", async () => {
    setupMocks();

    const result = await deleteRoadmapItem("test-project", "invalid_id");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("itemId");
    }
  });

  it("passes preserved content to writeRoadmapFile", async () => {
    const { preserved } = setupMocks();

    await deleteRoadmapItem("test-project", "r_abc12");

    const [, , preservedArg] = mockWriteRoadmapFile.mock.calls[0];
    expect(preservedArg).toEqual(preserved);
  });
});

describe("reorderRoadmapItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reorders items within category", async () => {
    setupMocks();

    const result = await reorderRoadmapItems("test-project", "core-features", [
      "r_def34",
      "r_abc12",
    ]);

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const coreCategory = writtenData.categories.find(
      (c: { slug: string }) => c.slug === "core-features",
    );
    expect(coreCategory.items[0].id).toBe("r_def34");
    expect(coreCategory.items[1].id).toBe("r_abc12");
  });

  it("validates all IDs exist in category", async () => {
    setupMocks();

    const result = await reorderRoadmapItems("test-project", "core-features", [
      "r_abc12",
      "r_zzzzz",
    ]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("orderedItemIds");
    }
  });

  it("validates ID count matches item count", async () => {
    setupMocks();

    const result = await reorderRoadmapItems("test-project", "core-features", [
      "r_abc12",
    ]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("orderedItemIds");
    }
  });

  it("returns error for unknown category", async () => {
    setupMocks();

    const result = await reorderRoadmapItems("test-project", "nonexistent", [
      "r_abc12",
    ]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("categorySlug");
    }
  });
});

describe("addRoadmapCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds empty category", async () => {
    setupMocks();

    const result = await addRoadmapCategory("test-project", "New Category");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBe("new-category");
    }
    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const newCategory = writtenData.categories.find(
      (c: { slug: string }) => c.slug === "new-category",
    );
    expect(newCategory).toBeDefined();
    expect(newCategory.title).toBe("New Category");
    expect(newCategory.items).toEqual([]);
  });

  it("generates slug from title", async () => {
    setupMocks();

    await addRoadmapCategory("test-project", "My Great Category");

    expect(mockGenerateCategorySlug).toHaveBeenCalledWith("My Great Category");
  });

  it("rejects duplicate slug", async () => {
    setupMocks();
    // "core-features" already exists in makeRoadmap
    mockGenerateCategorySlug.mockReturnValue("core-features");

    const result = await addRoadmapCategory("test-project", "Core Features");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("slug");
    }
  });

  it("rejects empty title", async () => {
    setupMocks();

    const result = await addRoadmapCategory("test-project", "   ");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("title");
    }
  });
});

describe("deleteRoadmapCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes category and its items", async () => {
    setupMocks();

    const result = await deleteRoadmapCategory("test-project", "core-features");

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    expect(
      writtenData.categories.find(
        (c: { slug: string }) => c.slug === "core-features",
      ),
    ).toBeUndefined();
    expect(writtenData.categories).toHaveLength(1);
  });

  it("returns error for unknown category slug", async () => {
    setupMocks();

    const result = await deleteRoadmapCategory("test-project", "nonexistent");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("categorySlug");
    }
  });

  it("passes preserved content", async () => {
    const { preserved } = setupMocks();

    await deleteRoadmapCategory("test-project", "core-features");

    const [, , preservedArg] = mockWriteRoadmapFile.mock.calls[0];
    expect(preservedArg).toEqual(preserved);
  });
});
