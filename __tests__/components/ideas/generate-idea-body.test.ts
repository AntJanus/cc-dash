import { describe, it, expect } from "vitest";
import type { WizardData } from "@/components/ideas/wizard-types";
import { INITIAL_WIZARD_DATA } from "@/components/ideas/wizard-types";
import { generateIdeaBody } from "@/components/ideas/generate-idea-body";

describe("generateIdeaBody", () => {
  it("produces pitch + all sections when all fields populated (game type)", () => {
    const data: WizardData = {
      ...INITIAL_WIZARD_DATA,
      pitch: "A fast-paced dungeon crawler with rogue-like elements.",
      projectType: "game",
      coreLoop: "Explore dungeons, fight monsters, collect loot, upgrade gear.",
      requirements: [
        "Must support terminal rendering",
        "Should include SKILL.md",
      ],
      inspirations: ["NetHack", "Dungeon Crawl Stone Soup"],
      openQuestions: ["Should it be multiplayer?", "What art style?"],
    };

    const result = generateIdeaBody(data);

    expect(result).toContain(
      "A fast-paced dungeon crawler with rogue-like elements.",
    );
    expect(result).toContain("#### Core Loop");
    expect(result).toContain(
      "Explore dungeons, fight monsters, collect loot, upgrade gear.",
    );
    expect(result).toContain("#### Requirements");
    expect(result).toContain("- Must support terminal rendering");
    expect(result).toContain("- Should include SKILL.md");
    expect(result).toContain("#### Inspirations");
    expect(result).toContain("- NetHack");
    expect(result).toContain("- Dungeon Crawl Stone Soup");
    expect(result).toContain("#### Open Questions");
    expect(result).toContain("- Should it be multiplayer?");
    expect(result).toContain("- What art style?");
  });

  it("sections are separated by double newlines", () => {
    const data: WizardData = {
      ...INITIAL_WIZARD_DATA,
      pitch: "A pitch.",
      projectType: "game",
      coreLoop: "Loop description.",
      requirements: ["Req 1"],
    };

    const result = generateIdeaBody(data);

    // Pitch, Core Loop, Requirements should be separated by \n\n
    expect(result).toBe(
      "A pitch.\n\n#### Core Loop\n\nLoop description.\n\n#### Requirements\n\n- Req 1",
    );
  });

  it("includes Core Loop section when projectType is game and coreLoop non-empty", () => {
    const data: WizardData = {
      ...INITIAL_WIZARD_DATA,
      projectType: "game",
      coreLoop: "Run, jump, collect coins.",
    };

    const result = generateIdeaBody(data);

    expect(result).toContain("#### Core Loop");
    expect(result).toContain("Run, jump, collect coins.");
  });

  it("omits Core Loop section when projectType is tool even if coreLoop has content", () => {
    const data: WizardData = {
      ...INITIAL_WIZARD_DATA,
      projectType: "tool",
      coreLoop: "This should not appear.",
    };

    const result = generateIdeaBody(data);

    expect(result).not.toContain("#### Core Loop");
    expect(result).not.toContain("This should not appear.");
  });

  it("omits sections with empty arrays (no empty #### headings)", () => {
    const data: WizardData = {
      ...INITIAL_WIZARD_DATA,
      pitch: "Just a pitch.",
      requirements: [],
      inspirations: [],
      openQuestions: [],
    };

    const result = generateIdeaBody(data);

    expect(result).toBe("Just a pitch.");
    expect(result).not.toContain("####");
  });

  it("produces just the pitch paragraph when only pitch is provided", () => {
    const data: WizardData = {
      ...INITIAL_WIZARD_DATA,
      pitch: "A standalone pitch with no other sections.",
    };

    const result = generateIdeaBody(data);

    expect(result).toBe("A standalone pitch with no other sections.");
  });

  it("produces empty string when pitch is empty and no sections have content", () => {
    const data: WizardData = { ...INITIAL_WIZARD_DATA };

    const result = generateIdeaBody(data);

    expect(result).toBe("");
  });

  it("output matches format of ideas-full.md fixture (#### heading + bullet list)", () => {
    const data: WizardData = {
      ...INITIAL_WIZARD_DATA,
      requirements: [
        "Should include SKILL.md or similar files",
        "Must support terminal rendering",
      ],
    };

    const result = generateIdeaBody(data);

    // Must match the exact format: #### heading, blank line, then "- item" lines
    expect(result).toBe(
      "#### Requirements\n\n- Should include SKILL.md or similar files\n- Must support terminal rendering",
    );
  });

  it("omits Core Loop when projectType is webapp", () => {
    const data: WizardData = {
      ...INITIAL_WIZARD_DATA,
      projectType: "webapp",
      coreLoop: "Ignored for webapps.",
      requirements: ["Need auth"],
    };

    const result = generateIdeaBody(data);

    expect(result).not.toContain("#### Core Loop");
    expect(result).toContain("#### Requirements");
  });

  it("omits Core Loop when coreLoop is whitespace-only even for game type", () => {
    const data: WizardData = {
      ...INITIAL_WIZARD_DATA,
      projectType: "game",
      coreLoop: "   ",
    };

    const result = generateIdeaBody(data);

    expect(result).toBe("");
    expect(result).not.toContain("#### Core Loop");
  });
});
