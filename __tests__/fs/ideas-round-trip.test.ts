import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseIdeas } from "@/lib/fs/parser";
import { serializeIdeas } from "@/lib/fs/serializer";
import type { IdeasFile } from "@/lib/schemas/ideas";

// Read fixture files
const fixturesDir = path.resolve(__dirname, "../fixtures");
const ideasBasic = fs.readFileSync(
  path.join(fixturesDir, "ideas-basic.md"),
  "utf-8",
);
const ideasFull = fs.readFileSync(
  path.join(fixturesDir, "ideas-full.md"),
  "utf-8",
);

/**
 * Extract IdeasFile-shaped fields from a parse result,
 * stripping preserved content for structural comparison.
 */
function extractIdeasData(data: IdeasFile): Omit<IdeasFile, "filePath"> {
  return {
    schema: data.schema,
    last_updated: data.last_updated,
    ideas: data.ideas,
  };
}

describe("ideas round-trip invariant", () => {
  it("ideas-basic.md round-trips identically", () => {
    const parse1 = parseIdeas(ideasBasic, "/test/PROJECT_IDEAS.md");
    expect(parse1.success).toBe(true);
    if (!parse1.success) return;

    const serialized = serializeIdeas({
      ...parse1.data,
      ...parse1.preserved,
    });
    const parse2 = parseIdeas(serialized, "/test/PROJECT_IDEAS.md");
    expect(parse2.success).toBe(true);
    if (!parse2.success) return;

    expect(extractIdeasData(parse2.data)).toEqual(
      extractIdeasData(parse1.data),
    );
  });

  it("ideas-full.md round-trips identically", () => {
    const parse1 = parseIdeas(ideasFull, "/test/PROJECT_IDEAS.md");
    expect(parse1.success).toBe(true);
    if (!parse1.success) return;

    const serialized = serializeIdeas({
      ...parse1.data,
      ...parse1.preserved,
    });
    const parse2 = parseIdeas(serialized, "/test/PROJECT_IDEAS.md");
    expect(parse2.success).toBe(true);
    if (!parse2.success) return;

    expect(extractIdeasData(parse2.data)).toEqual(
      extractIdeasData(parse1.data),
    );
  });

  it("round-trip is stable across multiple iterations", () => {
    const parse1 = parseIdeas(ideasFull, "/test/PROJECT_IDEAS.md");
    expect(parse1.success).toBe(true);
    if (!parse1.success) return;

    const serialized1 = serializeIdeas({
      ...parse1.data,
      ...parse1.preserved,
    });
    const parse2 = parseIdeas(serialized1, "/test/PROJECT_IDEAS.md");
    expect(parse2.success).toBe(true);
    if (!parse2.success) return;

    const serialized2 = serializeIdeas({
      ...parse2.data,
      ...parse2.preserved,
    });
    const parse3 = parseIdeas(serialized2, "/test/PROJECT_IDEAS.md");
    expect(parse3.success).toBe(true);
    if (!parse3.success) return;

    const data1 = extractIdeasData(parse1.data);
    const data2 = extractIdeasData(parse2.data);
    const data3 = extractIdeasData(parse3.data);
    expect(data2).toEqual(data1);
    expect(data3).toEqual(data1);
  });
});
