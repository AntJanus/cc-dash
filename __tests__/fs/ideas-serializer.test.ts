import { describe, it, expect } from "vitest";
import { serializeIdeas } from "@/lib/fs/serializer";
import type { IdeasFile } from "@/lib/schemas/ideas";
import type { IdeasParseResult } from "@/lib/fs/types";

function makeIdeasData(
  overrides: Partial<IdeasFile & IdeasParseResult> = {},
): IdeasFile & Partial<IdeasParseResult> {
  return {
    schema: "cc-dash/ideas@1" as const,
    last_updated: "2026-03-14T12:00:00-07:00",
    ideas: [
      {
        id: "i_a8k2m",
        status: "started",
        path: "gamma-engine/",
        stack: ["TypeScript/Node.js"],
        title: "An ASCII game engine",
        body: "This is a game engine for building ASCII-based CLI games.",
      },
    ],
    filePath: "/test/PROJECT_IDEAS.md",
    ...overrides,
  };
}

describe("serializeIdeas", () => {
  it("produces valid markdown with frontmatter", () => {
    const data = makeIdeasData();
    const result = serializeIdeas(data);
    expect(result).toContain("schema: cc-dash/ideas@1");
    expect(result).toContain("last_updated:");
  });

  it("produces correct ### heading with HTML comment metadata", () => {
    const data = makeIdeasData();
    const result = serializeIdeas(data);
    expect(result).toContain(
      "### <!-- id:i_a8k2m status:started path:gamma-engine/ stack:TypeScript/Node.js --> An ASCII game engine",
    );
  });

  it("writes body verbatim after heading", () => {
    const data = makeIdeasData();
    const result = serializeIdeas(data);
    expect(result).toContain(
      "This is a game engine for building ASCII-based CLI games.",
    );
  });

  it("preserves preamble sections", () => {
    const data = makeIdeasData({
      preamble:
        "\n# Project Ideas\n\nThese are project ideas.\n\n## Project requirements\n\n- a folder\n\n## Status Legend\n\n- `NOT STARTED`\n",
    });
    const result = serializeIdeas(data);
    expect(result).toContain("# Project Ideas");
    expect(result).toContain("## Project requirements");
    expect(result).toContain("## Status Legend");
  });

  it("stack field is last in metadata, comma-separated", () => {
    const data = makeIdeasData({
      ideas: [
        {
          id: "i_x9w1n",
          status: "started",
          path: "delta-sim/",
          stack: ["Godot 4", "GDScript", "Pixel Art"],
          title: "Photo sim",
          body: "Description.",
        },
      ],
    });
    const result = serializeIdeas(data);
    expect(result).toContain(
      "### <!-- id:i_x9w1n status:started path:delta-sim/ stack:Godot 4,GDScript,Pixel Art --> Photo sim",
    );
  });

  it("omits path and stack when not present", () => {
    const data = makeIdeasData({
      ideas: [
        {
          id: "i_b3c4d",
          status: "not-started",
          title: "Simple idea",
          body: "Just an idea.",
        },
      ],
    });
    const result = serializeIdeas(data);
    expect(result).toContain(
      "### <!-- id:i_b3c4d status:not-started --> Simple idea",
    );
    expect(result).not.toContain("path:");
    expect(result).not.toContain("stack:");
  });

  it("includes ## Project ideas heading", () => {
    const data = makeIdeasData();
    const result = serializeIdeas(data);
    expect(result).toContain("## Project ideas");
  });
});
