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
import { updateRoadmapItem } from "@/lib/actions/roadmap-actions";

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
            depends: ["r_ghi56"],
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

describe("updateRoadmapItem - depends", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets depends array on item", async () => {
    setupMocks();

    const result = await updateRoadmapItem("test-project", "r_abc12", {
      depends: ["r_abc12"],
    });

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const item = writtenData.categories[0].items.find(
      (i: { id: string }) => i.id === "r_abc12",
    );
    expect(item.depends).toEqual(["r_abc12"]);
  });

  it("clears depends when empty array passed", async () => {
    setupMocks();

    // r_def34 has depends: ["r_ghi56"] in fixture
    const result = await updateRoadmapItem("test-project", "r_def34", {
      depends: [],
    });

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const item = writtenData.categories[0].items.find(
      (i: { id: string }) => i.id === "r_def34",
    );
    expect(item.depends).toBeUndefined();
  });

  it("preserves existing fields when updating depends", async () => {
    setupMocks();

    await updateRoadmapItem("test-project", "r_abc12", {
      depends: ["r_ghi56"],
    });

    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const item = writtenData.categories[0].items.find(
      (i: { id: string }) => i.id === "r_abc12",
    );
    // Original fields preserved
    expect(item.name).toBe("Feature A");
    expect(item.description).toBe("First feature");
    expect(item.status).toBe("planned");
    expect(item.id).toBe("r_abc12");
  });

  it("does not modify depends when depends not in updates", async () => {
    setupMocks();

    // r_def34 has depends: ["r_ghi56"]
    await updateRoadmapItem("test-project", "r_def34", {
      name: "Updated Feature B",
    });

    const [, writtenData] = mockWriteRoadmapFile.mock.calls[0];
    const item = writtenData.categories[0].items.find(
      (i: { id: string }) => i.id === "r_def34",
    );
    // Depends should remain unchanged
    expect(item.depends).toEqual(["r_ghi56"]);
    expect(item.name).toBe("Updated Feature B");
  });
});
