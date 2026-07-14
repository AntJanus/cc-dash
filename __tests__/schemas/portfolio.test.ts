import { describe, it, expect } from "vitest";
import {
  CanvasPositionSchema,
  PortfolioFileSchema,
  ProjectCadence,
  ProjectEntrySchema,
  ProjectStatus,
} from "@/lib/schemas/portfolio";

describe("ProjectCadence", () => {
  it("accepts valid cadences", () => {
    expect(ProjectCadence.safeParse("weekly").success).toBe(true);
    expect(ProjectCadence.safeParse("monthly").success).toBe(true);
    expect(ProjectCadence.safeParse("quarterly").success).toBe(true);
  });

  it("rejects cadences outside the three declared rhythms", () => {
    expect(ProjectCadence.safeParse("daily").success).toBe(false);
    expect(ProjectCadence.safeParse("yearly").success).toBe(false);
    expect(ProjectCadence.safeParse("").success).toBe(false);
  });
});

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

  it("parses entry with cadence and dormant_until", () => {
    const result = ProjectEntrySchema.safeParse({
      status: "inactive",
      cadence: "quarterly",
      dormant_until: "2026-10-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cadence).toBe("quarterly");
      expect(result.data.dormant_until).toBe("2026-10-01");
    }
  });

  it("defaults cadence and dormant_until to null when omitted", () => {
    const result = ProjectEntrySchema.safeParse({ status: "active", order: 0 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        status: "active",
        order: 0,
        cadence: null,
        dormant_until: null,
      });
    }
  });

  it("accepts explicit nulls for cadence and dormant_until", () => {
    const result = ProjectEntrySchema.safeParse({
      status: "active",
      cadence: null,
      dormant_until: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cadence).toBeNull();
      expect(result.data.dormant_until).toBeNull();
    }
  });

  it("rejects a cadence outside the enum", () => {
    const result = ProjectEntrySchema.safeParse({
      status: "active",
      cadence: "biweekly",
    });
    expect(result.success).toBe(false);
  });

  it("rejects dormant_until that is not a YYYY-MM-DD date", () => {
    for (const bad of ["2026-7-1", "next tuesday", "2026-10-01T00:00:00Z"]) {
      const result = ProjectEntrySchema.safeParse({
        status: "active",
        dormant_until: bad,
      });
      expect(result.success, `expected ${bad} to be rejected`).toBe(false);
    }
  });

  it("rejects a well-formed but impossible calendar date", () => {
    const result = ProjectEntrySchema.safeParse({
      status: "active",
      dormant_until: "2026-02-30",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/calendar date/);
    }
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

  it("parses a legacy portfolio file with no rhythm fields (backward-compatible)", () => {
    // Fixture predating r_al002: not a single entry declares cadence or
    // dormant_until. This must keep parsing, with both fields defaulting to null.
    const legacyFile = {
      schema: "cc-dash/portfolio@1",
      projects: {
        "prd-board": { status: "active", order: 0 },
        "alpha-app": { status: "maintenance" },
        "old-project": { status: "inactive", canvas: { x: 10, y: 20 } },
      },
    };
    const result = PortfolioFileSchema.safeParse(legacyFile);
    expect(result.success).toBe(true);
    if (result.success) {
      for (const entry of Object.values(result.data.projects)) {
        expect(entry.cadence).toBeNull();
        expect(entry.dormant_until).toBeNull();
      }
      // Pre-existing fields survive untouched.
      expect(result.data.projects["prd-board"].order).toBe(0);
      expect(result.data.projects["old-project"].canvas).toEqual({
        x: 10,
        y: 20,
      });
    }
  });

  it("parses a portfolio file carrying rhythm metadata", () => {
    const result = PortfolioFileSchema.safeParse({
      schema: "cc-dash/portfolio@1",
      projects: {
        "prd-board": { status: "active", cadence: "weekly" },
        "shelved-app": {
          status: "inactive",
          cadence: "quarterly",
          dormant_until: "2026-12-01",
        },
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projects["prd-board"].cadence).toBe("weekly");
      expect(result.data.projects["shelved-app"].dormant_until).toBe(
        "2026-12-01",
      );
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
