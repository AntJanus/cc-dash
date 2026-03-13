import { describe, it, expect } from "vitest";
import {
  generateRoadmapId,
  generateCategorySlug,
} from "@/lib/utils/generate-id";

describe("generateRoadmapId", () => {
  it("returns string matching /^r_[a-z0-9]{5}$/", () => {
    const id = generateRoadmapId();
    expect(id).toMatch(/^r_[a-z0-9]{5}$/);
  });

  it("produces unique IDs across 100 calls (no collisions)", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateRoadmapId());
    }
    expect(ids.size).toBe(100);
  });
});

describe("generateCategorySlug", () => {
  it('converts "Core Features" to "core-features"', () => {
    expect(generateCategorySlug("Core Features")).toBe("core-features");
  });

  it('converts "UI & UX" to "ui-ux"', () => {
    expect(generateCategorySlug("UI & UX")).toBe("ui-ux");
  });

  it('converts "  Leading Spaces  " to "leading-spaces"', () => {
    expect(generateCategorySlug("  Leading Spaces  ")).toBe("leading-spaces");
  });

  it('converts "" to "untitled"', () => {
    expect(generateCategorySlug("")).toBe("untitled");
  });
});
