import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseQa } from "@/lib/fs/parser";

const fixturesDir = path.resolve(__dirname, "../fixtures");
const qaBasic = fs.readFileSync(path.join(fixturesDir, "qa-basic.md"), "utf-8");
const qaFull = fs.readFileSync(path.join(fixturesDir, "qa-full.md"), "utf-8");
const qaExtraSections = fs.readFileSync(
  path.join(fixturesDir, "qa-extra-sections.md"),
  "utf-8",
);

describe("parseQa", () => {
  it("parses a basic QA file into structured data", () => {
    const result = parseQa(qaBasic, "/test/QA.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.schema).toBe("cc-dash/qa@1");
    expect(result.data.project).toBe("my-project");
    // gray-matter coerces YAML datetimes to Date; the parser normalizes
    // them to an ISO string. Existing schemas assert on type + substring,
    // not exact equality, because the offset becomes "Z" after the round-trip.
    expect(typeof result.data.last_updated).toBe("string");
    expect(result.data.last_updated).toContain("2026-05-04");
    expect(result.data.filePath).toBe("/test/QA.md");
    expect(result.data.setup).toContain("npm test");
    expect(result.data.items).toHaveLength(2);
  });

  it("parses pending and passed items with correct status + timestamp", () => {
    const result = parseQa(qaBasic, "/test/QA.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    const pending = result.data.items[0];
    expect(pending.id).toBe("q_a1b2c");
    expect(pending.status).toBe("pending");
    expect(pending.at).toBeUndefined();
    expect(pending.description).toBe("First QA item, not yet executed.");

    const passed = result.data.items[1];
    expect(passed.id).toBe("q_d3e4f");
    expect(passed.status).toBe("passed");
    expect(passed.at).toBe("2026-05-04T10:15:00-06:00");
  });

  it("parses a full QA file with all five status values", () => {
    const result = parseQa(qaFull, "/test/QA.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.items).toHaveLength(5);

    const statuses = result.data.items.map((item) => item.status);
    expect(statuses).toEqual([
      "pending",
      "passed",
      "failed",
      "needs-decision",
      "skipped",
    ]);
  });

  it("attaches a single-line blockquote as the item note", () => {
    const result = parseQa(qaFull, "/test/QA.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    const failed = result.data.items.find((item) => item.status === "failed");
    expect(failed).toBeDefined();
    expect(failed!.roadmapRef).toBe("r_xyz12");
    expect(failed!.note).toContain("Date shows 2026-04-17");
  });

  it("attaches a multi-line blockquote (with empty quote line) as a single note", () => {
    const result = parseQa(qaFull, "/test/QA.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    const decision = result.data.items.find(
      (item) => item.status === "needs-decision",
    );
    expect(decision).toBeDefined();
    expect(decision!.note).toContain("Needs design conversation");
    expect(decision!.note).toContain("Reference the v3.2 design inspiration");
  });

  it("preserves the Setup section as raw multi-line text", () => {
    const result = parseQa(qaFull, "/test/QA.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.setup).toContain("test-skills.sh");
    expect(result.data.setup).toContain("trigger the GitHub Actions workflow");
  });

  it("captures preamble (h1 heading) for round-trip", () => {
    const result = parseQa(qaFull, "/test/QA.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.preserved.preamble).toContain("# Manual QA — project-beta");
  });

  it("preserves unrecognized sections (Notes, History) as unknown sections", () => {
    const result = parseQa(qaExtraSections, "/test/QA.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.preserved.unknownSections).toHaveLength(2);
    const headings = result.preserved.unknownSections.map((s) => s.heading);
    expect(headings).toEqual(["Notes", "History"]);

    const notes = result.preserved.unknownSections.find(
      (s) => s.heading === "Notes",
    );
    expect(notes!.raw).toContain("These are extra notes");
    expect(notes!.raw).toContain("project-specific");
  });

  it("returns failure for missing required frontmatter", () => {
    const bad = `---\nschema: cc-dash/qa@1\n---\n\n## Setup\n`;
    const result = parseQa(bad, "/test/QA.md");
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns failure for the wrong schema literal", () => {
    const bad = `---\nschema: cc-dash/qa@2\nproject: x\nlast_updated: 2026-05-04T10:00:00-06:00\n---\n\n## Setup\n\n## Checklist\n`;
    const result = parseQa(bad, "/test/QA.md");
    expect(result.success).toBe(false);
  });

  it("normalizes CRLF line endings before parsing", () => {
    const crlf = qaBasic.replace(/\n/g, "\r\n");
    const result = parseQa(crlf, "/test/QA.md");
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.items).toHaveLength(2);
  });

  it("yields an empty checklist when no items are present", () => {
    const empty = `---\nschema: cc-dash/qa@1\nproject: x\nlast_updated: 2026-05-04T10:00:00-06:00\n---\n\n## Setup\n\n## Checklist\n`;
    const result = parseQa(empty, "/test/QA.md");
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.items).toHaveLength(0);
  });

  it("ignores lines that do not match the QA item format", () => {
    const garbage = `---\nschema: cc-dash/qa@1\nproject: x\nlast_updated: 2026-05-04T10:00:00-06:00\n---\n\n## Setup\n\n## Checklist\n\nThis is a stray paragraph.\n- A bullet without HTML metadata.\n- <!-- id:q_aaaaa status:pending --> A real item.\n`;
    const result = parseQa(garbage, "/test/QA.md");
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.items).toHaveLength(1);
    expect(result.data.items[0].id).toBe("q_aaaaa");
  });
});
