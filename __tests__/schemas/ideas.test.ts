import { describe, it, expect } from "vitest";
import {
  IdeaStatus,
  IdeasFrontmatterSchema,
  IdeaItemSchema,
  IdeasFileSchema,
  validateIdeasFrontmatter,
  validateIdeasFile,
} from "@/lib/schemas/ideas";
import { generateIdeaId } from "@/lib/utils/generate-id";

describe("IdeaStatus", () => {
  it("has exactly three values: not-started, started, complete", () => {
    expect(IdeaStatus.options).toEqual(["not-started", "started", "complete"]);
  });

  it("exposes enum values via enum object", () => {
    expect(IdeaStatus.enum["not-started"]).toBe("not-started");
    expect(IdeaStatus.enum.started).toBe("started");
    expect(IdeaStatus.enum.complete).toBe("complete");
  });
});

describe("IdeasFrontmatterSchema", () => {
  const validFrontmatter = {
    schema: "cc-dash/ideas@1",
    last_updated: "2026-03-14T12:00:00-07:00",
  };

  it("accepts valid frontmatter", () => {
    const result = IdeasFrontmatterSchema.safeParse(validFrontmatter);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.schema).toBe("cc-dash/ideas@1");
      expect(result.data.last_updated).toBe("2026-03-14T12:00:00-07:00");
    }
  });

  it("rejects wrong schema literal", () => {
    const result = IdeasFrontmatterSchema.safeParse({
      ...validFrontmatter,
      schema: "cc-dash/ideas@2",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing last_updated", () => {
    const result = IdeasFrontmatterSchema.safeParse({
      schema: "cc-dash/ideas@1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-datetime string for last_updated", () => {
    const result = IdeasFrontmatterSchema.safeParse({
      ...validFrontmatter,
      last_updated: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("accepts datetime with Z timezone", () => {
    const result = IdeasFrontmatterSchema.safeParse({
      ...validFrontmatter,
      last_updated: "2026-03-14T12:00:00Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("IdeaItemSchema", () => {
  const validItem = {
    id: "i_a8k2m",
    status: "started",
    title: "Test Idea",
    body: "A description of the idea.",
    path: "foo/",
    stack: ["Go"],
  };

  it("accepts valid idea item with all fields", () => {
    const result = IdeaItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("i_a8k2m");
      expect(result.data.status).toBe("started");
      expect(result.data.title).toBe("Test Idea");
      expect(result.data.body).toBe("A description of the idea.");
      expect(result.data.path).toBe("foo/");
      expect(result.data.stack).toEqual(["Go"]);
    }
  });

  it.each([
    ["wrong prefix", "r_a8k2m"],
    ["wrong length (too short)", "i_a8k"],
    ["wrong length (too long)", "i_a8k2m1"],
    ["uppercase chars", "i_A8K2M"],
    ["missing prefix", "a8k2m"],
  ])("rejects invalid ID format: %s", (_desc, id) => {
    const result = IdeaItemSchema.safeParse({ ...validItem, id });
    expect(result.success).toBe(false);
  });

  it("accepts optional path and stack fields", () => {
    const { path: _p, stack: _s, ...minimal } = validItem;
    const result = IdeaItemSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.path).toBeUndefined();
      expect(result.data.stack).toBeUndefined();
    }
  });

  it("accepts item with multiple stack tags", () => {
    const result = IdeaItemSchema.safeParse({
      ...validItem,
      stack: ["Godot 4", "GDScript", "Pixel Art"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stack).toEqual(["Godot 4", "GDScript", "Pixel Art"]);
    }
  });
});

describe("IdeasFileSchema", () => {
  const validFile = {
    schema: "cc-dash/ideas@1",
    last_updated: "2026-03-14T12:00:00-07:00",
    ideas: [
      {
        id: "i_a8k2m",
        status: "started",
        title: "Test Idea",
        body: "Description",
        path: "foo/",
        stack: ["Go"],
      },
    ],
    filePath: "/path/to/PROJECT_IDEAS.md",
  };

  it("accepts valid complete ideas file", () => {
    const result = IdeasFileSchema.safeParse(validFile);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ideas).toHaveLength(1);
      expect(result.data.filePath).toBe("/path/to/PROJECT_IDEAS.md");
    }
  });

  it("rejects file without ideas array", () => {
    const { ideas: _, ...noIdeas } = validFile;
    const result = IdeasFileSchema.safeParse(noIdeas);
    expect(result.success).toBe(false);
  });

  it("rejects file without filePath", () => {
    const { filePath: _, ...noPath } = validFile;
    const result = IdeasFileSchema.safeParse(noPath);
    expect(result.success).toBe(false);
  });
});

describe("validateIdeasFrontmatter", () => {
  it("returns success with data for valid input", () => {
    const result = validateIdeasFrontmatter({
      schema: "cc-dash/ideas@1",
      last_updated: "2026-03-14T12:00:00-07:00",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.schema).toBe("cc-dash/ideas@1");
    }
  });

  it("returns failure with structured errors for invalid input", () => {
    const result = validateIdeasFrontmatter({
      schema: "wrong",
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

describe("validateIdeasFile", () => {
  it("returns success for valid file", () => {
    const result = validateIdeasFile({
      schema: "cc-dash/ideas@1",
      last_updated: "2026-03-14T12:00:00-07:00",
      ideas: [],
      filePath: "/path/to/PROJECT_IDEAS.md",
    });
    expect(result.success).toBe(true);
  });

  it("returns failure for invalid file", () => {
    const result = validateIdeasFile({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});

describe("generateIdeaId", () => {
  it("returns string matching /^i_[a-z0-9]{5}$/", () => {
    const id = generateIdeaId();
    expect(id).toMatch(/^i_[a-z0-9]{5}$/);
  });

  it("produces unique IDs across 100 calls", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateIdeaId());
    }
    expect(ids.size).toBe(100);
  });
});
