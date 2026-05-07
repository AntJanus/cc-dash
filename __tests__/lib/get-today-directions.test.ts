import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockReadFile } = vi.hoisted(() => ({ mockReadFile: vi.fn() }));
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    default: { ...actual, readFile: mockReadFile },
    readFile: mockReadFile,
  };
});

import {
  getTodayDirections,
  extractQaRefs,
} from "@/lib/projects/get-today-directions";

const VALID_FILE = `---
schema: cc-dash/today-directions@1
generated: 2026-05-07T08:30:00-06:00
for_date: 2026-05-07
---

# Today's Directions

## Active sessions to advance
- **prd-board** — finishing today-directions panel

## QA items to run today
- [ ] <!-- ref:q_aaaaa slug:project-beta --> Validate skill loads in Claude Code
- [x] <!-- ref:q_bbbbb slug:project-gamma --> Compile a sample agent
- [ ] <!-- ref:q_ccccc slug:theta-blog --> Spot-check homepage rendering

## Concurrent dispatch plan
\`\`\`bash
cd ~/projects/project-beta && claude -p "..."
\`\`\`
`;

describe("getTodayDirections", () => {
  beforeEach(() => {
    mockReadFile.mockReset();
  });

  it("returns null when the file does not exist", async () => {
    const enoent = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    mockReadFile.mockRejectedValue(enoent);

    const result = await getTodayDirections({ pathOverride: "/missing.md" });

    expect(result).toBeNull();
  });

  it("returns null when frontmatter is invalid", async () => {
    mockReadFile.mockResolvedValue(`---
schema: not-the-right-schema
---

body`);

    const result = await getTodayDirections({ pathOverride: "/bad.md" });

    expect(result).toBeNull();
  });

  it("parses a valid file and exposes frontmatter, body, and QA refs", async () => {
    mockReadFile.mockResolvedValue(VALID_FILE);

    const result = await getTodayDirections({ pathOverride: "/x/foo.md" });

    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.frontmatter.schema).toBe("cc-dash/today-directions@1");
    expect(result.frontmatter.for_date).toBe("2026-05-07");
    expect(result.filePath).toBe("/x/foo.md");
    expect(result.body).toContain("# Today's Directions");
    expect(result.qaRefs).toHaveLength(3);
    expect(result.qaRefs[0]).toEqual({
      qaId: "q_aaaaa",
      slug: "project-beta",
      checked: false,
      description: "Validate skill loads in Claude Code",
    });
    expect(result.qaRefs[1]).toEqual({
      qaId: "q_bbbbb",
      slug: "project-gamma",
      checked: true,
      description: "Compile a sample agent",
    });
    expect(result.qaRefs[2]).toEqual({
      qaId: "q_ccccc",
      slug: "theta-blog",
      checked: false,
      description: "Spot-check homepage rendering",
    });
  });
});

describe("extractQaRefs", () => {
  it("returns an empty array when no checkbox refs are present", () => {
    expect(extractQaRefs("just a body without checkboxes")).toEqual([]);
  });

  it("extracts unchecked and checked items, preserving order", () => {
    const body = `
- [ ] <!-- ref:q_11111 slug:foo --> One
- [x] <!-- ref:q_22222 slug:bar --> Two
- [ ] <!-- ref:q_33333 slug:baz --> Three
`;
    const refs = extractQaRefs(body);
    expect(refs).toEqual([
      { qaId: "q_11111", slug: "foo", checked: false, description: "One" },
      { qaId: "q_22222", slug: "bar", checked: true, description: "Two" },
      { qaId: "q_33333", slug: "baz", checked: false, description: "Three" },
    ]);
  });

  it("ignores checkbox lines without ref markers", () => {
    const body = `
- [ ] just a regular task
- [ ] <!-- ref:q_aaaaa slug:proj --> Real one
`;
    const refs = extractQaRefs(body);
    expect(refs).toEqual([
      {
        qaId: "q_aaaaa",
        slug: "proj",
        checked: false,
        description: "Real one",
      },
    ]);
  });

  it("accepts uppercase X for checked", () => {
    const refs = extractQaRefs("- [X] <!-- ref:q_xxxxx slug:p --> X");
    expect(refs).toEqual([
      { qaId: "q_xxxxx", slug: "p", checked: true, description: "X" },
    ]);
  });

  it("ignores malformed ref ids", () => {
    const body = `
- [ ] <!-- ref:q_abcd slug:proj --> bad id (only 4 chars after q_)
- [ ] <!-- ref:q_aaaaa slug:proj --> ok
- [ ] <!-- ref:q_AAAAA slug:proj --> uppercase id rejected
`;
    const refs = extractQaRefs(body);
    expect(refs).toEqual([
      {
        qaId: "q_aaaaa",
        slug: "proj",
        checked: false,
        description: "ok",
      },
    ]);
  });
});
