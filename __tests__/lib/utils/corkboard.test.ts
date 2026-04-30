import { describe, it, expect } from "vitest";
import {
  tiltFromSlug,
  pinColorFromSlug,
  pinPositionFromSlug,
} from "@/lib/utils/corkboard";

describe("tiltFromSlug", () => {
  it("returns the same value for the same slug across calls", () => {
    const slug = "project-gamma";
    expect(tiltFromSlug(slug)).toBe(tiltFromSlug(slug));
  });

  it("produces a tilt within the expected -1..1 degree range", () => {
    const slugs = [
      "project-gamma",
      "project-delta",
      "theta-blog",
      "alpha-app",
      "project-alpha",
      "epsilon-game",
      "project-beta",
      "project-epsilon",
      "zeta-app",
      "beta-tracker",
    ];
    for (const slug of slugs) {
      const tilt = tiltFromSlug(slug);
      expect(tilt).toBeGreaterThanOrEqual(-1);
      expect(tilt).toBeLessThanOrEqual(1);
    }
  });

  it("does not always return the same tilt for different slugs", () => {
    // Sample many slugs — should hit at least 2 distinct tilt values.
    const tilts = new Set(
      [
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "abc",
        "def",
        "xyz",
        "qwerty",
        "claude",
        "agent",
      ].map(tiltFromSlug),
    );
    expect(tilts.size).toBeGreaterThan(1);
  });
});

describe("pinColorFromSlug", () => {
  it("returns one of the cozy CSS variables", () => {
    const allowed = new Set([
      "var(--accent-clay)",
      "var(--accent-gold)",
      "var(--accent-moss)",
      "var(--accent-plum)",
      "var(--accent-sky)",
    ]);
    const samples = [
      "project-gamma",
      "theta-blog",
      "alpha-app",
      "project-alpha",
      "epsilon-game",
    ];
    for (const slug of samples) {
      expect(allowed.has(pinColorFromSlug(slug))).toBe(true);
    }
  });

  it("is stable for the same slug", () => {
    expect(pinColorFromSlug("foo")).toBe(pinColorFromSlug("foo"));
  });
});

describe("pinPositionFromSlug", () => {
  it("returns left, center, or right", () => {
    const positions = new Set(["left", "center", "right"]);
    const samples = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta"];
    for (const slug of samples) {
      expect(positions.has(pinPositionFromSlug(slug))).toBe(true);
    }
  });

  it("is stable for the same slug", () => {
    expect(pinPositionFromSlug("foo")).toBe(pinPositionFromSlug("foo"));
  });
});
