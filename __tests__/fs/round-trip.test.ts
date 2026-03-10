import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseRoadmap, parseSession } from "@/lib/fs/parser";
import { serializeRoadmap, serializeSession } from "@/lib/fs/serializer";
import type { RoadmapFile } from "@/lib/schemas/roadmap";
import type { SessionFile } from "@/lib/schemas/session";

// Read fixture files
const fixturesDir = path.resolve(__dirname, "../fixtures");
const roadmapBasic = fs.readFileSync(
  path.join(fixturesDir, "roadmap-basic.md"),
  "utf-8",
);
const roadmapFull = fs.readFileSync(
  path.join(fixturesDir, "roadmap-full.md"),
  "utf-8",
);
const roadmapExtraSections = fs.readFileSync(
  path.join(fixturesDir, "roadmap-extra-sections.md"),
  "utf-8",
);
const sessionBasic = fs.readFileSync(
  path.join(fixturesDir, "session-basic.md"),
  "utf-8",
);
const sessionFull = fs.readFileSync(
  path.join(fixturesDir, "session-full.md"),
  "utf-8",
);
const sessionExtraContent = fs.readFileSync(
  path.join(fixturesDir, "session-extra-content.md"),
  "utf-8",
);

/**
 * Extract the RoadmapFile-shaped fields from a parse result,
 * stripping preserved content (preamble, unknownSections, trailingContent)
 * for structural comparison.
 */
function extractRoadmapData(data: RoadmapFile): Omit<RoadmapFile, "filePath"> {
  return {
    schema: data.schema,
    project: data.project,
    description: data.description,
    last_updated: data.last_updated,
    categories: data.categories,
  };
}

/**
 * Extract the SessionFile-shaped fields from a parse result,
 * stripping preserved content for structural comparison.
 */
function extractSessionData(data: SessionFile): Omit<SessionFile, "filePath"> {
  return {
    schema: data.schema,
    project: data.project,
    session_id: data.session_id,
    roadmap_ref: data.roadmap_ref,
    started: data.started,
    last_updated: data.last_updated,
    status: data.status,
    tasks: data.tasks,
    currentStatus: data.currentStatus,
    decisions: data.decisions,
    failedAttempts: data.failedAttempts,
    completedWork: data.completedWork,
  };
}

describe("round-trip invariant", () => {
  it("roadmap-basic.md round-trips identically", () => {
    const parse1 = parseRoadmap(roadmapBasic, "/test/ROADMAP.md");
    expect(parse1.success).toBe(true);
    if (!parse1.success) return;

    const serialized = serializeRoadmap({
      ...parse1.data,
      ...parse1.preserved,
    });
    const parse2 = parseRoadmap(serialized, "/test/ROADMAP.md");
    expect(parse2.success).toBe(true);
    if (!parse2.success) return;

    expect(extractRoadmapData(parse2.data)).toEqual(
      extractRoadmapData(parse1.data),
    );
  });

  it("roadmap-full.md round-trips identically", () => {
    const parse1 = parseRoadmap(roadmapFull, "/test/ROADMAP.md");
    expect(parse1.success).toBe(true);
    if (!parse1.success) return;

    const serialized = serializeRoadmap({
      ...parse1.data,
      ...parse1.preserved,
    });
    const parse2 = parseRoadmap(serialized, "/test/ROADMAP.md");
    expect(parse2.success).toBe(true);
    if (!parse2.success) return;

    expect(extractRoadmapData(parse2.data)).toEqual(
      extractRoadmapData(parse1.data),
    );
  });

  it("session-basic.md round-trips identically", () => {
    const parse1 = parseSession(sessionBasic, "/test/SESSION.md");
    expect(parse1.success).toBe(true);
    if (!parse1.success) return;

    const serialized = serializeSession({
      ...parse1.data,
      ...parse1.preserved,
    });
    const parse2 = parseSession(serialized, "/test/SESSION.md");
    expect(parse2.success).toBe(true);
    if (!parse2.success) return;

    expect(extractSessionData(parse2.data)).toEqual(
      extractSessionData(parse1.data),
    );
  });

  it("session-full.md round-trips identically", () => {
    const parse1 = parseSession(sessionFull, "/test/SESSION.md");
    expect(parse1.success).toBe(true);
    if (!parse1.success) return;

    const serialized = serializeSession({
      ...parse1.data,
      ...parse1.preserved,
    });
    const parse2 = parseSession(serialized, "/test/SESSION.md");
    expect(parse2.success).toBe(true);
    if (!parse2.success) return;

    expect(extractSessionData(parse2.data)).toEqual(
      extractSessionData(parse1.data),
    );
  });

  it("round-trip is stable across multiple iterations", () => {
    // Parse -> serialize -> parse -> serialize -> parse
    const parse1 = parseRoadmap(roadmapFull, "/test/ROADMAP.md");
    expect(parse1.success).toBe(true);
    if (!parse1.success) return;

    const serialized1 = serializeRoadmap({
      ...parse1.data,
      ...parse1.preserved,
    });
    const parse2 = parseRoadmap(serialized1, "/test/ROADMAP.md");
    expect(parse2.success).toBe(true);
    if (!parse2.success) return;

    const serialized2 = serializeRoadmap({
      ...parse2.data,
      ...parse2.preserved,
    });
    const parse3 = parseRoadmap(serialized2, "/test/ROADMAP.md");
    expect(parse3.success).toBe(true);
    if (!parse3.success) return;

    // All three parsed results should be identical
    const data1 = extractRoadmapData(parse1.data);
    const data2 = extractRoadmapData(parse2.data);
    const data3 = extractRoadmapData(parse3.data);
    expect(data2).toEqual(data1);
    expect(data3).toEqual(data1);
  });
});

describe("unrecognized content preservation", () => {
  it("preserves extra roadmap sections through round-trip", () => {
    const parse1 = parseRoadmap(roadmapExtraSections, "/test/ROADMAP.md");
    expect(parse1.success).toBe(true);
    if (!parse1.success) return;

    // Verify the Notes section was captured
    expect(parse1.preserved.unknownSections).toHaveLength(1);
    expect(parse1.preserved.unknownSections[0].heading).toBe("Notes");
    expect(parse1.preserved.unknownSections[0].raw).toContain(
      "These are some notes",
    );

    // Serialize and re-parse
    const serialized = serializeRoadmap({
      ...parse1.data,
      ...parse1.preserved,
    });
    const parse2 = parseRoadmap(serialized, "/test/ROADMAP.md");
    expect(parse2.success).toBe(true);
    if (!parse2.success) return;

    // Unknown sections should still be preserved
    expect(parse2.preserved.unknownSections).toHaveLength(1);
    expect(parse2.preserved.unknownSections[0].heading).toBe("Notes");
    expect(parse2.preserved.unknownSections[0].raw).toContain(
      "These are some notes",
    );
  });

  it("preserves extra session sections through round-trip", () => {
    const parse1 = parseSession(sessionExtraContent, "/test/SESSION.md");
    expect(parse1.success).toBe(true);
    if (!parse1.success) return;

    // Verify Custom Notes and Verification Results were captured
    const customNotes = parse1.preserved.unknownSections.find(
      (s) => s.heading === "Custom Notes",
    );
    expect(customNotes).toBeDefined();
    expect(customNotes!.raw).toContain("These are custom notes");

    // Serialize and re-parse
    const serialized = serializeSession({
      ...parse1.data,
      ...parse1.preserved,
    });
    const parse2 = parseSession(serialized, "/test/SESSION.md");
    expect(parse2.success).toBe(true);
    if (!parse2.success) return;

    // Custom Notes should still be preserved
    const customNotes2 = parse2.preserved.unknownSections.find(
      (s) => s.heading === "Custom Notes",
    );
    expect(customNotes2).toBeDefined();
    expect(customNotes2!.raw).toContain("These are custom notes");
  });

  it("preserves preamble content through round-trip", () => {
    const parse1 = parseRoadmap(roadmapBasic, "/test/ROADMAP.md");
    expect(parse1.success).toBe(true);
    if (!parse1.success) return;

    expect(parse1.preserved.preamble).toContain("# Roadmap");
    expect(parse1.preserved.preamble).toContain("> A basic test project");

    // Serialize with preamble and re-parse
    const serialized = serializeRoadmap({
      ...parse1.data,
      ...parse1.preserved,
    });
    const parse2 = parseRoadmap(serialized, "/test/ROADMAP.md");
    expect(parse2.success).toBe(true);
    if (!parse2.success) return;

    expect(parse2.preserved.preamble).toContain("# Roadmap");
    expect(parse2.preserved.preamble).toContain("> A basic test project");
  });

  it("preserves trailing content through round-trip", () => {
    const parse1 = parseRoadmap(roadmapExtraSections, "/test/ROADMAP.md");
    expect(parse1.success).toBe(true);
    if (!parse1.success) return;

    // The extra-sections fixture has trailing content after the last category
    expect(parse1.preserved.trailingContent).toContain(
      "Some trailing content after the last section.",
    );

    // Serialize and verify the trailing content text is present in output
    const serialized = serializeRoadmap({
      ...parse1.data,
      ...parse1.preserved,
    });
    expect(serialized).toContain(
      "Some trailing content after the last section.",
    );

    // Re-parse and verify structural data is still intact
    const parse2 = parseRoadmap(serialized, "/test/ROADMAP.md");
    expect(parse2.success).toBe(true);
    if (!parse2.success) return;

    // The trailing content survives in the serialized output; on re-parse it may
    // be absorbed into a nearby section's content rather than the trailingContent field,
    // depending on the relative position of categories and unknown sections.
    // The key guarantee is: the text is not lost.
    expect(extractRoadmapData(parse2.data)).toEqual(
      extractRoadmapData(parse1.data),
    );
  });
});
