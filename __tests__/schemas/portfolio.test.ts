import { describe, it, expect } from "vitest";
import {
  CanvasPositionSchema,
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

  it("parses entry with canvas position", () => {
    const result = ProjectEntrySchema.safeParse({
      status: "active",
      canvas: { x: 120.5, y: -42 },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.canvas).toEqual({ x: 120.5, y: -42 });
    }
  });

  it("allows canvas to be omitted", () => {
    const result = ProjectEntrySchema.safeParse({ status: "active" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.canvas).toBeUndefined();
    }
  });

  it("rejects canvas with NaN or Infinity coords", () => {
    const nan = ProjectEntrySchema.safeParse({
      status: "active",
      canvas: { x: NaN, y: 0 },
    });
    expect(nan.success).toBe(false);
    const inf = ProjectEntrySchema.safeParse({
      status: "active",
      canvas: { x: 0, y: Infinity },
    });
    expect(inf.success).toBe(false);
  });

  it("rejects canvas missing a coord", () => {
    const result = ProjectEntrySchema.safeParse({
      status: "active",
      canvas: { x: 0 },
    });
    expect(result.success).toBe(false);
  });
});

describe("CanvasPositionSchema", () => {
  it("accepts integer and float coords", () => {
    expect(CanvasPositionSchema.safeParse({ x: 0, y: 0 }).success).toBe(true);
    expect(CanvasPositionSchema.safeParse({ x: 1.5, y: -2.25 }).success).toBe(
      true,
    );
    expect(CanvasPositionSchema.safeParse({ x: -1000, y: 99999 }).success).toBe(
      true,
    );
  });

  it("rejects non-finite values", () => {
    expect(CanvasPositionSchema.safeParse({ x: NaN, y: 0 }).success).toBe(
      false,
    );
    expect(CanvasPositionSchema.safeParse({ x: 0, y: Infinity }).success).toBe(
      false,
    );
    expect(CanvasPositionSchema.safeParse({ x: -Infinity, y: 0 }).success).toBe(
      false,
    );
  });
});

describe("PortfolioFileSchema", () => {
  it("parses a full portfolio file", () => {
    const result = PortfolioFileSchema.safeParse({
      schema: "cc-dash/portfolio@1",
      projects: {
        "prd-board": { status: "active", order: 0 },
        "alpha-app": { status: "maintenance" },
        "old-project": { status: "inactive" },
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Object.keys(result.data.projects)).toHaveLength(3);
      expect(result.data.projects["prd-board"].order).toBe(0);
      expect(result.data.projects["alpha-app"].status).toBe("maintenance");
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
