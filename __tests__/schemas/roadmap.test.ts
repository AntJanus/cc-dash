import { describe, it, expect } from "vitest";
import {
  RoadmapStatus,
  RoadmapFrontmatterSchema,
  RoadmapItemMetadataSchema,
  RoadmapItemSchema,
  RoadmapCategorySchema,
  RoadmapFileSchema,
  validateRoadmapFrontmatter,
  validateRoadmapItem,
  validateRoadmapFile,
} from "@/lib/schemas/roadmap";

describe("RoadmapFrontmatterSchema", () => {
  const validFrontmatter = {
    schema: "cc-dash/roadmap@1",
    project: "my-project",
    description: "A project",
    last_updated: "2026-03-09T14:30:00-07:00",
  };

  it("accepts valid frontmatter", () => {
    const result = RoadmapFrontmatterSchema.safeParse(validFrontmatter);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.schema).toBe("cc-dash/roadmap@1");
      expect(result.data.project).toBe("my-project");
      expect(result.data.description).toBe("A project");
      expect(result.data.last_updated).toBe("2026-03-09T14:30:00-07:00");
    }
  });

  it.each([
    ["schema", { ...validFrontmatter, schema: undefined }],
    ["project", { ...validFrontmatter, project: undefined }],
    ["description", { ...validFrontmatter, description: undefined }],
    ["last_updated", { ...validFrontmatter, last_updated: undefined }],
  ])("rejects missing required field: %s", (_field, input) => {
    const result = RoadmapFrontmatterSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects wrong schema value", () => {
    const result = RoadmapFrontmatterSchema.safeParse({
      ...validFrontmatter,
      schema: "cc-dash/roadmap@2",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid datetime format for last_updated", () => {
    const result = RoadmapFrontmatterSchema.safeParse({
      ...validFrontmatter,
      last_updated: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("accepts datetime with Z timezone", () => {
    const result = RoadmapFrontmatterSchema.safeParse({
      ...validFrontmatter,
      last_updated: "2026-03-09T21:30:00Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("RoadmapItemMetadataSchema", () => {
  const validMetadata = {
    id: "r_k8x2m",
    status: "planned",
  };

  it("accepts valid item metadata", () => {
    const result = RoadmapItemMetadataSchema.safeParse(validMetadata);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("r_k8x2m");
      expect(result.data.status).toBe("planned");
    }
  });

  it("accepts optional started date", () => {
    const result = RoadmapItemMetadataSchema.safeParse({
      ...validMetadata,
      started: "2026-02-15",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.started).toBe("2026-02-15");
    }
  });

  it("accepts optional completed date", () => {
    const result = RoadmapItemMetadataSchema.safeParse({
      ...validMetadata,
      completed: "2026-03-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.completed).toBe("2026-03-01");
    }
  });

  it("accepts optional depends field (comma-separated string)", () => {
    const result = RoadmapItemMetadataSchema.safeParse({
      ...validMetadata,
      depends: "r_abc12,r_def34",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.depends).toBe("r_abc12,r_def34");
    }
  });

  it.each([
    ["missing r_ prefix", "k8x2m"],
    ["wrong prefix", "t_k8x2m"],
    ["too short", "r_k8x"],
    ["too long", "r_k8x2m1"],
    ["uppercase chars", "r_K8X2M"],
  ])("rejects invalid ID format: %s", (_desc, id) => {
    const result = RoadmapItemMetadataSchema.safeParse({
      ...validMetadata,
      id,
    });
    expect(result.success).toBe(false);
  });

  it.each([
    ["unknown", "unknown"],
    ["empty string", ""],
    ["number", 42],
  ])("rejects invalid status: %s", (_desc, status) => {
    const result = RoadmapItemMetadataSchema.safeParse({
      ...validMetadata,
      status,
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid status values", () => {
    const statuses = ["planned", "in-progress", "done", "idea"];
    for (const status of statuses) {
      const result = RoadmapItemMetadataSchema.safeParse({
        ...validMetadata,
        status,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("RoadmapItemSchema", () => {
  const validItem = {
    id: "r_k8x2m",
    status: "planned" as const,
    name: "Feature Name",
    description: "A feature description",
  };

  it("accepts valid full item", () => {
    const result = RoadmapItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Feature Name");
      expect(result.data.description).toBe("A feature description");
    }
  });

  it("accepts item with optional dates and depends array", () => {
    const result = RoadmapItemSchema.safeParse({
      ...validItem,
      started: "2026-02-15",
      completed: "2026-03-01",
      depends: ["r_abc12", "r_def34"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.depends).toEqual(["r_abc12", "r_def34"]);
    }
  });

  it("rejects item without name", () => {
    const { name: _, ...noName } = validItem;
    const result = RoadmapItemSchema.safeParse(noName);
    expect(result.success).toBe(false);
  });

  it("rejects item with invalid ID", () => {
    const result = RoadmapItemSchema.safeParse({ ...validItem, id: "bad" });
    expect(result.success).toBe(false);
  });
});

describe("RoadmapCategorySchema", () => {
  it("accepts valid category with items", () => {
    const result = RoadmapCategorySchema.safeParse({
      title: "Core Features",
      slug: "core",
      items: [
        {
          id: "r_k8x2m",
          status: "planned",
          name: "Feature",
          description: "Desc",
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(1);
    }
  });

  it("accepts category with empty items array", () => {
    const result = RoadmapCategorySchema.safeParse({
      title: "Empty",
      slug: "empty",
      items: [],
    });
    expect(result.success).toBe(true);
  });
});

describe("RoadmapFileSchema", () => {
  const validFile = {
    schema: "cc-dash/roadmap@1",
    project: "my-project",
    description: "A project",
    last_updated: "2026-03-09T14:30:00-07:00",
    categories: [
      {
        title: "Core",
        slug: "core",
        items: [
          {
            id: "r_k8x2m",
            status: "planned",
            name: "Feature",
            description: "Desc",
          },
        ],
      },
    ],
    filePath: "/path/to/ROADMAP.md",
  };

  it("accepts valid complete roadmap file", () => {
    const result = RoadmapFileSchema.safeParse(validFile);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.categories).toHaveLength(1);
      expect(result.data.filePath).toBe("/path/to/ROADMAP.md");
    }
  });

  it("rejects file without categories", () => {
    const { categories: _, ...noCategories } = validFile;
    const result = RoadmapFileSchema.safeParse(noCategories);
    expect(result.success).toBe(false);
  });

  it("rejects file without filePath", () => {
    const { filePath: _, ...noPath } = validFile;
    const result = RoadmapFileSchema.safeParse(noPath);
    expect(result.success).toBe(false);
  });
});

describe("validateRoadmapFrontmatter", () => {
  it("returns success with data for valid input", () => {
    const result = validateRoadmapFrontmatter({
      schema: "cc-dash/roadmap@1",
      project: "my-project",
      description: "A project",
      last_updated: "2026-03-09T14:30:00-07:00",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project).toBe("my-project");
    }
  });

  it("returns failure with structured errors for invalid input", () => {
    const result = validateRoadmapFrontmatter({
      schema: "wrong",
      project: 123,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toHaveProperty("field");
      expect(result.errors[0]).toHaveProperty("message");
      expect(result.errors[0]).toHaveProperty("received");
    }
  });
});

describe("validateRoadmapItem", () => {
  it("returns success for valid item", () => {
    const result = validateRoadmapItem({
      id: "r_k8x2m",
      status: "planned",
      name: "Feature",
      description: "Desc",
    });
    expect(result.success).toBe(true);
  });

  it("returns failure for invalid item", () => {
    const result = validateRoadmapItem({ id: "bad", status: "unknown" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});

describe("validateRoadmapFile", () => {
  it("returns success for valid file", () => {
    const result = validateRoadmapFile({
      schema: "cc-dash/roadmap@1",
      project: "my-project",
      description: "A project",
      last_updated: "2026-03-09T14:30:00-07:00",
      categories: [],
      filePath: "/path/to/ROADMAP.md",
    });
    expect(result.success).toBe(true);
  });

  it("returns failure for invalid file", () => {
    const result = validateRoadmapFile({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});

describe("RoadmapStatus", () => {
  it("exposes enum values", () => {
    expect(RoadmapStatus.enum).toContain("planned");
    expect(RoadmapStatus.enum).toContain("in-progress");
    expect(RoadmapStatus.enum).toContain("done");
    expect(RoadmapStatus.enum).toContain("idea");
  });
});
