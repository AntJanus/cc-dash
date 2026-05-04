import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseQa } from "@/lib/fs/parser";
import { serializeQa } from "@/lib/fs/serializer";
import type { QaFile } from "@/lib/schemas/qa";

const fixturesDir = path.resolve(__dirname, "../fixtures");
const qaBasic = fs.readFileSync(path.join(fixturesDir, "qa-basic.md"), "utf-8");
const qaFull = fs.readFileSync(path.join(fixturesDir, "qa-full.md"), "utf-8");

function buildMinimalFile(overrides: Partial<QaFile> = {}): QaFile {
  return {
    schema: "cc-dash/qa@1",
    project: "test-project",
    last_updated: "2026-05-04T10:00:00-06:00",
    setup: "",
    items: [],
    filePath: "/test/QA.md",
    ...overrides,
  };
}

describe("serializeQa", () => {
  it("emits valid YAML frontmatter with required fields", () => {
    const out = serializeQa(buildMinimalFile());
    expect(out).toContain("schema: cc-dash/qa@1");
    expect(out).toContain("project: test-project");
    expect(out).toContain("last_updated: ");
  });

  it("emits ## Setup and ## Checklist sections in canonical order", () => {
    const out = serializeQa(buildMinimalFile({ setup: "Run: `make test`" }));
    const setupIdx = out.indexOf("## Setup");
    const checklistIdx = out.indexOf("## Checklist");
    expect(setupIdx).toBeGreaterThan(0);
    expect(checklistIdx).toBeGreaterThan(setupIdx);
    expect(out).toContain("Run: `make test`");
  });

  it("serializes a pending item without `at` or `ref`", () => {
    const out = serializeQa(
      buildMinimalFile({
        items: [
          {
            id: "q_aaaaa",
            status: "pending",
            description: "First check",
          },
        ],
      }),
    );
    expect(out).toContain("- <!-- id:q_aaaaa status:pending --> First check\n");
    expect(out).not.toContain("at:");
  });

  it("serializes a passed item with `at`", () => {
    const out = serializeQa(
      buildMinimalFile({
        items: [
          {
            id: "q_bbbbb",
            status: "passed",
            description: "Second check",
            at: "2026-05-04T10:15:00-06:00",
          },
        ],
      }),
    );
    expect(out).toContain(
      "- <!-- id:q_bbbbb status:passed at:2026-05-04T10:15:00-06:00 --> Second check\n",
    );
  });

  it("serializes a failed item with both `at` and `ref`", () => {
    const out = serializeQa(
      buildMinimalFile({
        items: [
          {
            id: "q_ccccc",
            status: "failed",
            description: "Third check",
            at: "2026-05-04T10:20:00-06:00",
            roadmapRef: "r_xyz12",
          },
        ],
      }),
    );
    expect(out).toContain(
      "- <!-- id:q_ccccc status:failed at:2026-05-04T10:20:00-06:00 ref:r_xyz12 --> Third check\n",
    );
  });

  it("renders a single-line note as one indented blockquote", () => {
    const out = serializeQa(
      buildMinimalFile({
        items: [
          {
            id: "q_ddddd",
            status: "failed",
            description: "Fourth",
            at: "2026-05-04T10:00:00-06:00",
            note: "Saw error X.",
          },
        ],
      }),
    );
    expect(out).toContain("  > Saw error X.\n");
  });

  it("renders a multi-line note with empty quote separators", () => {
    const out = serializeQa(
      buildMinimalFile({
        items: [
          {
            id: "q_eeeee",
            status: "needs-decision",
            description: "Fifth",
            at: "2026-05-04T10:00:00-06:00",
            note: "First paragraph.\n\nSecond paragraph.",
          },
        ],
      }),
    );
    expect(out).toContain("  > First paragraph.\n");
    expect(out).toContain("  >\n");
    expect(out).toContain("  > Second paragraph.\n");
  });

  it("appends unknown sections so they survive round-trip", () => {
    const out = serializeQa({
      ...buildMinimalFile(),
      unknownSections: [{ heading: "Notes", raw: "\nSome free-form notes.\n" }],
    });
    expect(out).toContain("## Notes");
    expect(out).toContain("Some free-form notes.");
  });

  it("falls back to a default preamble when none was preserved", () => {
    const out = serializeQa(buildMinimalFile({ project: "fallback" }));
    expect(out).toContain("# Manual QA — fallback");
  });

  it("uses the preserved preamble verbatim when one was supplied", () => {
    const out = serializeQa({
      ...buildMinimalFile(),
      preamble: "\n# Custom Preamble\n\nWith extra context.\n",
    });
    expect(out).toContain("# Custom Preamble");
    expect(out).toContain("With extra context.");
    expect(out).not.toContain("# Manual QA — test-project");
  });
});

describe("QA round-trip invariant", () => {
  function extractData(data: QaFile): Omit<QaFile, "filePath"> {
    return {
      schema: data.schema,
      project: data.project,
      last_updated: data.last_updated,
      setup: data.setup,
      items: data.items,
    };
  }

  it("qa-basic.md round-trips identically", () => {
    const parse1 = parseQa(qaBasic, "/test/QA.md");
    expect(parse1.success).toBe(true);
    if (!parse1.success) return;

    const serialized = serializeQa({ ...parse1.data, ...parse1.preserved });
    const parse2 = parseQa(serialized, "/test/QA.md");
    expect(parse2.success).toBe(true);
    if (!parse2.success) return;

    expect(extractData(parse2.data)).toEqual(extractData(parse1.data));
  });

  it("qa-full.md round-trips identically (notes, all status values, ref)", () => {
    const parse1 = parseQa(qaFull, "/test/QA.md");
    expect(parse1.success).toBe(true);
    if (!parse1.success) return;

    const serialized = serializeQa({ ...parse1.data, ...parse1.preserved });
    const parse2 = parseQa(serialized, "/test/QA.md");
    expect(parse2.success).toBe(true);
    if (!parse2.success) return;

    expect(extractData(parse2.data)).toEqual(extractData(parse1.data));

    // Spot-check that the failed item's roadmap ref + note survived
    const failed = parse2.data.items.find((item) => item.status === "failed");
    expect(failed?.roadmapRef).toBe("r_xyz12");
    expect(failed?.note).toContain("Date shows 2026-04-17");

    // Spot-check the multi-paragraph note survived as well
    const decision = parse2.data.items.find(
      (item) => item.status === "needs-decision",
    );
    expect(decision?.note).toContain("Needs design conversation");
    expect(decision?.note).toContain("Reference the v3.2 design inspiration");
  });

  it("qa-extra-sections.md preserves Notes + History through round-trip", () => {
    const fixturePath = path.join(fixturesDir, "qa-extra-sections.md");
    const raw = fs.readFileSync(fixturePath, "utf-8");

    const parse1 = parseQa(raw, "/test/QA.md");
    expect(parse1.success).toBe(true);
    if (!parse1.success) return;

    const serialized = serializeQa({ ...parse1.data, ...parse1.preserved });
    const parse2 = parseQa(serialized, "/test/QA.md");
    expect(parse2.success).toBe(true);
    if (!parse2.success) return;

    expect(parse2.preserved.unknownSections.map((s) => s.heading)).toEqual([
      "Notes",
      "History",
    ]);
    expect(extractData(parse2.data)).toEqual(extractData(parse1.data));
  });

  it("round-trip is stable across multiple iterations", () => {
    const parse1 = parseQa(qaFull, "/test/QA.md");
    expect(parse1.success).toBe(true);
    if (!parse1.success) return;

    const serialized1 = serializeQa({ ...parse1.data, ...parse1.preserved });
    const parse2 = parseQa(serialized1, "/test/QA.md");
    expect(parse2.success).toBe(true);
    if (!parse2.success) return;

    const serialized2 = serializeQa({ ...parse2.data, ...parse2.preserved });
    const parse3 = parseQa(serialized2, "/test/QA.md");
    expect(parse3.success).toBe(true);
    if (!parse3.success) return;

    const data1 = extractData(parse1.data);
    const data2 = extractData(parse2.data);
    const data3 = extractData(parse3.data);
    expect(data2).toEqual(data1);
    expect(data3).toEqual(data1);
  });
});
