import { describe, it, expect } from "vitest";
import { parseDirectionsBody } from "@/lib/projects/parse-directions-body";

describe("parseDirectionsBody", () => {
  it("returns an empty array on an empty body", () => {
    expect(parseDirectionsBody("")).toEqual([]);
  });

  it("parses headings at multiple levels", () => {
    const blocks = parseDirectionsBody(`# Title
## Section
### Sub`);
    expect(blocks).toEqual([
      { kind: "heading", level: 1, text: "Title" },
      { kind: "heading", level: 2, text: "Section" },
      { kind: "heading", level: 3, text: "Sub" },
    ]);
  });

  it("groups consecutive bullet lines into a single list block", () => {
    const blocks = parseDirectionsBody(`- one
- two
- three

- separated`);
    expect(blocks).toEqual([
      { kind: "list", items: ["one", "two", "three"] },
      { kind: "list", items: ["separated"] },
    ]);
  });

  it("captures fenced code blocks with language label and inner lines", () => {
    const blocks = parseDirectionsBody(`\`\`\`bash
cd ~/projects/foo
echo done
\`\`\``);
    expect(blocks).toEqual([
      {
        kind: "code",
        lang: "bash",
        lines: ["cd ~/projects/foo", "echo done"],
      },
    ]);
  });

  it("skips QA checkbox ref lines (rendered separately as the interactive card)", () => {
    const blocks = parseDirectionsBody(`## QA items
- [ ] <!-- ref:q_aaaaa slug:foo --> First
- [x] <!-- ref:q_bbbbb slug:bar --> Second
- normal bullet`);
    expect(blocks).toEqual([
      { kind: "heading", level: 2, text: "QA items" },
      { kind: "list", items: ["normal bullet"] },
    ]);
  });

  it("collects loose paragraph text between blocks", () => {
    const blocks = parseDirectionsBody(`# Title
Some intro text.
And a continuation line.

- bullet`);
    expect(blocks).toEqual([
      { kind: "heading", level: 1, text: "Title" },
      { kind: "para", text: "Some intro text. And a continuation line." },
      { kind: "list", items: ["bullet"] },
    ]);
  });

  it("treats a code block opening without a language as a generic code block", () => {
    const blocks = parseDirectionsBody(`\`\`\`
some literal output
\`\`\``);
    expect(blocks).toEqual([
      { kind: "code", lang: "", lines: ["some literal output"] },
    ]);
  });

  it("preserves order across mixed block types", () => {
    const blocks = parseDirectionsBody(`# Today
Intro line.

## Plan
- step one
- step two

\`\`\`bash
run-it
\`\`\`

## Notes
Final paragraph.`);
    expect(blocks.map((block) => block.kind)).toEqual([
      "heading",
      "para",
      "heading",
      "list",
      "code",
      "heading",
      "para",
    ]);
  });
});
