import { describe, it, expect } from "vitest";
import {
  TodayDirectionsFrontmatterSchema,
  validateTodayDirectionsFrontmatter,
} from "@/lib/schemas/today-directions";

describe("TodayDirectionsFrontmatterSchema", () => {
  const validFrontmatter = {
    schema: "cc-dash/today-directions@1",
    generated: "2026-05-07T08:30:00-06:00",
    for_date: "2026-05-07",
  };

  it("accepts valid frontmatter", () => {
    const result = TodayDirectionsFrontmatterSchema.safeParse(validFrontmatter);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.schema).toBe("cc-dash/today-directions@1");
      expect(result.data.generated).toBe("2026-05-07T08:30:00-06:00");
      expect(result.data.for_date).toBe("2026-05-07");
    }
  });

  it("rejects wrong schema value", () => {
    const result = TodayDirectionsFrontmatterSchema.safeParse({
      ...validFrontmatter,
      schema: "cc-dash/today-directions@2",
    });
    expect(result.success).toBe(false);
  });

  it.each([
    ["schema", { ...validFrontmatter, schema: undefined }],
    ["generated", { ...validFrontmatter, generated: undefined }],
    ["for_date", { ...validFrontmatter, for_date: undefined }],
  ])("rejects missing required field: %s", (_field, input) => {
    const result = TodayDirectionsFrontmatterSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid datetime format for generated", () => {
    const result = TodayDirectionsFrontmatterSchema.safeParse({
      ...validFrontmatter,
      generated: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed for_date (not YYYY-MM-DD)", () => {
    const result = TodayDirectionsFrontmatterSchema.safeParse({
      ...validFrontmatter,
      for_date: "May 7 2026",
    });
    expect(result.success).toBe(false);
  });

  it("validateTodayDirectionsFrontmatter returns Result.success on valid input", () => {
    const result = validateTodayDirectionsFrontmatter(validFrontmatter);
    expect(result.success).toBe(true);
  });

  it("validateTodayDirectionsFrontmatter returns Result.errors on missing field", () => {
    const result = validateTodayDirectionsFrontmatter({
      ...validFrontmatter,
      generated: undefined,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe("generated");
    }
  });
});
