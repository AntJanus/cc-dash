import { describe, it, expect } from "vitest";
import {
  getSeasonalState,
  HOT_DAYS,
  WARM_DAYS,
  type SeasonalInput,
  type SeasonalState,
} from "@/lib/projects/get-seasonal-state";

const NOW = new Date("2026-07-14T12:00:00Z");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * MS_PER_DAY).toISOString();
}

function makeInput(overrides: Partial<SeasonalInput> = {}): SeasonalInput {
  return {
    lastActivity: daysAgo(1),
    completionPercent: 40,
    portfolioStatus: "active",
    ...overrides,
  };
}

function stateOf(overrides: Partial<SeasonalInput> = {}): SeasonalState {
  return getSeasonalState(makeInput(overrides), { now: NOW });
}

describe("getSeasonalState", () => {
  describe("each state", () => {
    it("returns 'harvested' when every roadmap item is done", () => {
      expect(stateOf({ completionPercent: 100 })).toBe("harvested");
    });

    it("returns 'dormant' when the project is shelved as portfolio-inactive", () => {
      expect(
        stateOf({ portfolioStatus: "inactive", completionPercent: 40 }),
      ).toBe("dormant");
    });

    it("returns 'dormant' when the project has never been touched", () => {
      expect(stateOf({ lastActivity: null })).toBe("dormant");
    });

    it("returns 'in-season' for a project touched within the hot window", () => {
      expect(stateOf({ lastActivity: daysAgo(2) })).toBe("in-season");
    });

    it("returns 'warming-up' for a project touched within the warm window", () => {
      expect(stateOf({ lastActivity: daysAgo(10) })).toBe("warming-up");
    });

    it("returns 'dormant' for a project untouched beyond the warm window", () => {
      expect(stateOf({ lastActivity: daysAgo(60) })).toBe("dormant");
    });
  });

  describe("precedence: completion outranks status, status outranks recency", () => {
    it("prefers 'harvested' over 'in-season' when a complete project was just touched", () => {
      expect(
        stateOf({ completionPercent: 100, lastActivity: daysAgo(0) }),
      ).toBe("harvested");
    });

    it("prefers 'harvested' over 'dormant' when a complete project is portfolio-inactive", () => {
      expect(
        stateOf({
          completionPercent: 100,
          portfolioStatus: "inactive",
          lastActivity: daysAgo(90),
        }),
      ).toBe("harvested");
    });

    it("prefers 'dormant' over 'in-season' when a shelved project has a fresh timestamp", () => {
      expect(
        stateOf({ portfolioStatus: "inactive", lastActivity: daysAgo(0) }),
      ).toBe("dormant");
    });

    it("prefers 'dormant' over 'warming-up' when a shelved project sits in the warm window", () => {
      expect(
        stateOf({ portfolioStatus: "inactive", lastActivity: daysAgo(10) }),
      ).toBe("dormant");
    });

    it("bands a maintenance project by recency rather than forcing it dormant", () => {
      expect(
        stateOf({ portfolioStatus: "maintenance", lastActivity: daysAgo(1) }),
      ).toBe("in-season");
      expect(
        stateOf({ portfolioStatus: "maintenance", lastActivity: daysAgo(10) }),
      ).toBe("warming-up");
      expect(
        stateOf({ portfolioStatus: "maintenance", lastActivity: daysAgo(60) }),
      ).toBe("dormant");
    });
  });

  describe("recency boundaries", () => {
    it("treats exactly HOT_DAYS old as 'in-season' (inclusive upper edge)", () => {
      expect(stateOf({ lastActivity: daysAgo(HOT_DAYS) })).toBe("in-season");
    });

    it("tips to 'warming-up' one minute past the hot window", () => {
      const justPastHot = new Date(
        NOW.getTime() - HOT_DAYS * MS_PER_DAY - 60_000,
      ).toISOString();
      expect(stateOf({ lastActivity: justPastHot })).toBe("warming-up");
    });

    it("treats exactly WARM_DAYS old as 'warming-up' (inclusive upper edge)", () => {
      expect(stateOf({ lastActivity: daysAgo(WARM_DAYS) })).toBe("warming-up");
    });

    it("tips to 'dormant' one minute past the warm window", () => {
      const justPastWarm = new Date(
        NOW.getTime() - WARM_DAYS * MS_PER_DAY - 60_000,
      ).toISOString();
      expect(stateOf({ lastActivity: justPastWarm })).toBe("dormant");
    });

    it("uses the windows specified by the almanac plan (Phase 0)", () => {
      expect(HOT_DAYS).toBe(7);
      expect(WARM_DAYS).toBe(30);
    });

    it("keeps a project idle for three weeks 'warming-up' rather than dormant", () => {
      expect(stateOf({ lastActivity: daysAgo(21) })).toBe("warming-up");
    });

    it("treats a future-dated timestamp as 'in-season' rather than dormant", () => {
      const tomorrow = new Date(NOW.getTime() + MS_PER_DAY).toISOString();
      expect(stateOf({ lastActivity: tomorrow })).toBe("in-season");
    });
  });

  describe("completion boundary", () => {
    it("is not yet 'harvested' with a single item outstanding", () => {
      expect(
        stateOf({ completionPercent: 99.9, lastActivity: daysAgo(2) }),
      ).toBe("in-season");
    });

    it("becomes 'harvested' exactly at 100 percent", () => {
      expect(stateOf({ completionPercent: 100 })).toBe("harvested");
    });

    it("stays 'harvested' if completion somehow overshoots 100", () => {
      expect(stateOf({ completionPercent: 120 })).toBe("harvested");
    });

    it("does not treat an empty roadmap (0 percent) as harvested", () => {
      expect(stateOf({ completionPercent: 0, lastActivity: daysAgo(2) })).toBe(
        "in-season",
      );
    });
  });

  describe("purity", () => {
    it("defaults 'now' to the current clock when no override is given", () => {
      expect(
        getSeasonalState({
          lastActivity: new Date().toISOString(),
          completionPercent: 10,
          portfolioStatus: "active",
        }),
      ).toBe("in-season");
    });

    it("returns the same state for the same input and does not mutate it", () => {
      const input = makeInput({ lastActivity: daysAgo(10) });
      const snapshot = { ...input };

      const first = getSeasonalState(input, { now: NOW });
      const second = getSeasonalState(input, { now: NOW });

      expect(first).toBe(second);
      expect(first).toBe("warming-up");
      expect(input).toEqual(snapshot);
    });
  });
});
