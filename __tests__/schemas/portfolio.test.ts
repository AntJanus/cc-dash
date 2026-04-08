import { describe, it, expect } from "vitest";
import {
  PortfolioFileSchema,
  ProjectEntrySchema,
  ProjectStatus,
} from "@/lib/schemas/portfolio";

describe("ProjectStatus", () => {
  it("accepts valid statuses", () => {
    expect(ProjectStatus.safeParse("active").success).toBe(true);
    expect(ProjectStatus.safeParse("inactive").success).toBe(true);
    expect(ProjectStatus.safeParse("maintenance").success).toBe(true);
  });

  it("rejects invalid statuses", () => {
    expect(ProjectStatus.safeParse("archived").success).toBe(false);
    expect(ProjectStatus.safeParse("").success).toBe(false);
  });
});

describe("ProjectEntrySchema", () => {
  it("parses entry with status and order", () => {
    const result = ProjectEntrySchema.safeParse({
      status: "active",
      order: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("active");
      expect(result.data.order).toBe(1);
    }
  });

  it("defaults status to active", () => {
    const result = ProjectEntrySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("active");
      expect(result.data.order).toBeUndefined();
    }
  });

  it("allows order to be omitted", () => {
    const result = ProjectEntrySchema.safeParse({ status: "maintenance" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.order).toBeUndefined();
    }
  });

  it("rejects negative order", () => {
    const result = ProjectEntrySchema.safeParse({
      status: "active",
      order: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer order", () => {
    const result = ProjectEntrySchema.safeParse({
      status: "active",
      order: 1.5,
    });
    expect(result.success).toBe(false);
  });
});

describe("PortfolioFileSchema", () => {
  it("parses a full portfolio file", () => {
    const result = PortfolioFileSchema.safeParse({
      schema: "cc-dash/portfolio@1",
      projects: {
        "prd-board": { status: "active", order: 0 },
        alpha-app: { status: "maintenance" },
        "old-project": { status: "inactive" },
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Object.keys(result.data.projects)).toHaveLength(3);
      expect(result.data.projects["prd-board"].order).toBe(0);
      expect(result.data.projects.alpha-app.status).toBe("maintenance");
    }
  });

  it("defaults projects to empty object", () => {
    const result = PortfolioFileSchema.safeParse({
      schema: "cc-dash/portfolio@1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projects).toEqual({});
    }
  });

  it("rejects wrong schema version", () => {
    const result = PortfolioFileSchema.safeParse({
      schema: "cc-dash/portfolio@2",
      projects: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing schema field", () => {
    const result = PortfolioFileSchema.safeParse({
      projects: {},
    });
    expect(result.success).toBe(false);
  });
});
