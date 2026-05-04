import { describe, it, expect } from "vitest";
import {
  QaStatus,
  QaFrontmatterSchema,
  QaItemMetadataSchema,
  QaItemSchema,
  QaFileSchema,
  validateQaFrontmatter,
  validateQaItem,
  validateQaFile,
} from "@/lib/schemas/qa";

describe("QaFrontmatterSchema", () => {
  const validFrontmatter = {
    schema: "cc-dash/qa@1",
    project: "project-beta",
    last_updated: "2026-05-04T10:00:00-06:00",
  };

  it("accepts valid frontmatter", () => {
    const result = QaFrontmatterSchema.safeParse(validFrontmatter);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.schema).toBe("cc-dash/qa@1");
      expect(result.data.project).toBe("project-beta");
      expect(result.data.last_updated).toBe("2026-05-04T10:00:00-06:00");
    }
  });

  it.each([
    ["schema", { ...validFrontmatter, schema: undefined }],
    ["project", { ...validFrontmatter, project: undefined }],
    ["last_updated", { ...validFrontmatter, last_updated: undefined }],
  ])("rejects missing required field: %s", (_field, input) => {
    const result = QaFrontmatterSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects wrong schema value", () => {
    const result = QaFrontmatterSchema.safeParse({
      ...validFrontmatter,
      schema: "cc-dash/qa@2",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid datetime format for last_updated", () => {
    const result = QaFrontmatterSchema.safeParse({
      ...validFrontmatter,
      last_updated: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("accepts datetime with Z timezone", () => {
    const result = QaFrontmatterSchema.safeParse({
      ...validFrontmatter,
      last_updated: "2026-05-04T17:00:00Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("QaItemMetadataSchema", () => {
  const validMetadata = {
    id: "q_a1b2c",
    status: "pending",
  };

  it("accepts valid item metadata", () => {
    const result = QaItemMetadataSchema.safeParse(validMetadata);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("q_a1b2c");
      expect(result.data.status).toBe("pending");
    }
  });

  it("accepts optional at timestamp", () => {
    const result = QaItemMetadataSchema.safeParse({
      ...validMetadata,
      status: "passed",
      at: "2026-05-04T10:15:00-06:00",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.at).toBe("2026-05-04T10:15:00-06:00");
    }
  });

  it("accepts optional ref (roadmap id)", () => {
    const result = QaItemMetadataSchema.safeParse({
      ...validMetadata,
      status: "failed",
      at: "2026-05-04T10:20:00-06:00",
      ref: "r_xyz12",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ref).toBe("r_xyz12");
    }
  });

  it.each([
    ["missing q_ prefix", "a1b2c"],
    ["wrong prefix", "r_a1b2c"],
    ["too short", "q_a1b"],
    ["too long", "q_a1b2c1"],
    ["uppercase chars", "q_A1B2C"],
  ])("rejects invalid ID format: %s", (_desc, id) => {
    const result = QaItemMetadataSchema.safeParse({
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
    const result = QaItemMetadataSchema.safeParse({
      ...validMetadata,
      status,
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid status values", () => {
    const statuses = [
      "pending",
      "passed",
      "failed",
      "needs-decision",
      "skipped",
    ];
    for (const status of statuses) {
      const result = QaItemMetadataSchema.safeParse({
        ...validMetadata,
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects ref that does not match roadmap id pattern", () => {
    const result = QaItemMetadataSchema.safeParse({
      ...validMetadata,
      status: "failed",
      at: "2026-05-04T10:20:00-06:00",
      ref: "not-a-roadmap-id",
    });
    expect(result.success).toBe(false);
  });
});

describe("QaItemSchema", () => {
  const validPendingItem = {
    id: "q_a1b2c",
    status: "pending" as const,
    description: "CI workflow runs clean on a fresh PR",
  };

  const validPassedItem = {
    id: "q_d3e4f",
    status: "passed" as const,
    description: "Skills under 500-line limit",
    at: "2026-05-04T10:15:00-06:00",
  };

  const validFailedItem = {
    id: "q_g5h6i",
    status: "failed" as const,
    description: "AGENTS.md last_updated date is current",
    at: "2026-05-04T10:20:00-06:00",
    roadmapRef: "r_xyz12",
    note: "**Note (2026-05-04):** Date shows 2026-04-17. Filed as r_xyz12.",
  };

  it("accepts valid pending item without timestamp", () => {
    const result = QaItemSchema.safeParse(validPendingItem);
    expect(result.success).toBe(true);
  });

  it("accepts valid passed item with timestamp", () => {
    const result = QaItemSchema.safeParse(validPassedItem);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.at).toBe("2026-05-04T10:15:00-06:00");
    }
  });

  it("accepts valid failed item with roadmap ref and note", () => {
    const result = QaItemSchema.safeParse(validFailedItem);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.roadmapRef).toBe("r_xyz12");
      expect(result.data.note).toContain("Date shows 2026-04-17");
    }
  });

  it("accepts needs-decision with timestamp and note", () => {
    const result = QaItemSchema.safeParse({
      id: "q_j7k8l",
      status: "needs-decision",
      description: "UI redesign discussion",
      at: "2026-05-04T10:25:00-06:00",
      note: "**Note:** Needs design conversation before code.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-pending item without timestamp", () => {
    const { at: _, ...noAt } = validPassedItem;
    const result = QaItemSchema.safeParse(noAt);
    expect(result.success).toBe(false);
  });

  it("rejects item without description", () => {
    const { description: _, ...noDesc } = validPendingItem;
    const result = QaItemSchema.safeParse(noDesc);
    expect(result.success).toBe(false);
  });

  it("rejects item with invalid ID", () => {
    const result = QaItemSchema.safeParse({ ...validPendingItem, id: "bad" });
    expect(result.success).toBe(false);
  });

  it("rejects item with malformed roadmap ref", () => {
    const result = QaItemSchema.safeParse({
      ...validFailedItem,
      roadmapRef: "not-an-id",
    });
    expect(result.success).toBe(false);
  });
});

describe("QaFileSchema", () => {
  const validFile = {
    schema: "cc-dash/qa@1",
    project: "project-beta",
    last_updated: "2026-05-04T10:00:00-06:00",
    setup: "Run: `cd project-beta && bash scripts/test-skills.sh`",
    items: [
      {
        id: "q_a1b2c",
        status: "pending",
        description: "CI workflow runs clean",
      },
    ],
    filePath: "/path/to/QA.md",
  };

  it("accepts valid complete QA file", () => {
    const result = QaFileSchema.safeParse(validFile);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(1);
      expect(result.data.filePath).toBe("/path/to/QA.md");
      expect(result.data.setup).toContain("test-skills.sh");
    }
  });

  it("accepts file with empty items list", () => {
    const result = QaFileSchema.safeParse({ ...validFile, items: [] });
    expect(result.success).toBe(true);
  });

  it("accepts empty setup string", () => {
    const result = QaFileSchema.safeParse({ ...validFile, setup: "" });
    expect(result.success).toBe(true);
  });

  it("rejects file without items array", () => {
    const { items: _, ...noItems } = validFile;
    const result = QaFileSchema.safeParse(noItems);
    expect(result.success).toBe(false);
  });

  it("rejects file without filePath", () => {
    const { filePath: _, ...noPath } = validFile;
    const result = QaFileSchema.safeParse(noPath);
    expect(result.success).toBe(false);
  });

  it("rejects file without setup", () => {
    const { setup: _, ...noSetup } = validFile;
    const result = QaFileSchema.safeParse(noSetup);
    expect(result.success).toBe(false);
  });
});

describe("validateQaFrontmatter", () => {
  it("returns success with data for valid input", () => {
    const result = validateQaFrontmatter({
      schema: "cc-dash/qa@1",
      project: "project-beta",
      last_updated: "2026-05-04T10:00:00-06:00",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project).toBe("project-beta");
    }
  });

  it("returns failure with structured errors for invalid input", () => {
    const result = validateQaFrontmatter({ schema: "wrong", project: 123 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toHaveProperty("field");
      expect(result.errors[0]).toHaveProperty("message");
      expect(result.errors[0]).toHaveProperty("received");
    }
  });
});

describe("validateQaItem", () => {
  it("returns success for valid item", () => {
    const result = validateQaItem({
      id: "q_a1b2c",
      status: "pending",
      description: "Item",
    });
    expect(result.success).toBe(true);
  });

  it("returns failure for invalid item", () => {
    const result = validateQaItem({ id: "bad", status: "unknown" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});

describe("validateQaFile", () => {
  it("returns success for valid file", () => {
    const result = validateQaFile({
      schema: "cc-dash/qa@1",
      project: "project-beta",
      last_updated: "2026-05-04T10:00:00-06:00",
      setup: "",
      items: [],
      filePath: "/path/to/QA.md",
    });
    expect(result.success).toBe(true);
  });

  it("returns failure for invalid file", () => {
    const result = validateQaFile({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});

describe("QaStatus", () => {
  it("exposes enum values via options array", () => {
    expect(QaStatus.options).toContain("pending");
    expect(QaStatus.options).toContain("passed");
    expect(QaStatus.options).toContain("failed");
    expect(QaStatus.options).toContain("needs-decision");
    expect(QaStatus.options).toContain("skipped");
  });

  it("exposes enum values via enum object", () => {
    expect(QaStatus.enum.pending).toBe("pending");
    expect(QaStatus.enum.passed).toBe("passed");
    expect(QaStatus.enum.failed).toBe("failed");
    expect(QaStatus.enum["needs-decision"]).toBe("needs-decision");
    expect(QaStatus.enum.skipped).toBe("skipped");
  });
});
