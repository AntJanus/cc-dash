import { describe, it, expect } from "vitest";
import {
  PROJECT_TEMPLATES,
  getTemplateById,
} from "@/lib/templates/project-templates";

describe("PROJECT_TEMPLATES", () => {
  it("includes at least 7 templates", () => {
    expect(PROJECT_TEMPLATES.length).toBeGreaterThanOrEqual(7);
  });

  it("has no duplicate template IDs", () => {
    const ids = PROJECT_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every template has required fields", () => {
    for (const t of PROJECT_TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(Array.isArray(t.defaultStack)).toBe(true);
      expect(Array.isArray(t.categories)).toBe(true);
      expect(Array.isArray(t.starterItems)).toBe(true);
    }
  });

  it("every category has title and slug", () => {
    for (const t of PROJECT_TEMPLATES) {
      for (const cat of t.categories) {
        expect(cat.title).toBeTruthy();
        expect(cat.slug).toBeTruthy();
      }
    }
  });

  it("category slugs are unique within each template", () => {
    for (const t of PROJECT_TEMPLATES) {
      const slugs = t.categories.map((c) => c.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("starter items reference valid category slugs", () => {
    for (const t of PROJECT_TEMPLATES) {
      const slugs = new Set(t.categories.map((c) => c.slug));
      for (const item of t.starterItems) {
        expect(slugs.has(item.categorySlug)).toBe(true);
      }
    }
  });

  it("blank template has no categories or starter items", () => {
    const blank = getTemplateById("blank");
    expect(blank).toBeDefined();
    expect(blank!.categories).toHaveLength(0);
    expect(blank!.starterItems).toHaveLength(0);
  });

  it("non-blank templates have at least one category and one starter item", () => {
    for (const t of PROJECT_TEMPLATES) {
      if (t.id === "blank") continue;
      expect(t.categories.length).toBeGreaterThanOrEqual(1);
      expect(t.starterItems.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("getTemplateById", () => {
  it("returns template for valid ID", () => {
    expect(getTemplateById("go-cli")).toBeDefined();
    expect(getTemplateById("go-cli")!.name).toBe("Go CLI");
  });

  it("returns undefined for unknown ID", () => {
    expect(getTemplateById("nonexistent")).toBeUndefined();
  });
});
