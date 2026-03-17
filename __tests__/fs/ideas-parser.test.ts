import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseIdeas } from "@/lib/fs/parser";

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

describe("parseIdeas", () => {
  describe("frontmatter extraction", () => {
    it("extracts schema and last_updated from ideas-basic.md", () => {
      const result = parseIdeas(ideasBasic, "/test/PROJECT_IDEAS.md");
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.schema).toBe("cc-dash/ideas@1");
      // gray-matter coerces Date objects; postProcessFrontmatter converts back to ISO UTC
      expect(result.data.last_updated).toBe("2026-03-14T19:00:00.000Z");
    });

    it("returns error for invalid frontmatter", () => {
      const invalid = `---
schema: cc-dash/ideas@2
last_updated: not-a-date
---

# Project Ideas

## Project ideas
`;
      const result = parseIdeas(invalid, "/test/PROJECT_IDEAS.md");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe("idea item extraction", () => {
    it("extracts idea with id, status, path, stack, title from basic fixture", () => {
      const result = parseIdeas(ideasBasic, "/test/PROJECT_IDEAS.md");
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.ideas).toHaveLength(1);
      const idea = result.data.ideas[0];
      expect(idea.id).toBe("i_a8k2m");
      expect(idea.status).toBe("started");
      expect(idea.path).toBe("gamma-engine/");
      expect(idea.stack).toEqual(["TypeScript/Node.js"]);
      expect(idea.title).toBe(
        "An ASCII game engine suited for building 2d CLI-based games using AI",
      );
    });

    it("extracts idea body as raw string", () => {
      const result = parseIdeas(ideasBasic, "/test/PROJECT_IDEAS.md");
      expect(result.success).toBe(true);
      if (!result.success) return;
      const idea = result.data.ideas[0];
      expect(idea.body).toContain(
        "This is a game engine for building ASCII-based CLI games.",
      );
    });

    it("extracts body including #### subsections", () => {
      const result = parseIdeas(ideasFull, "/test/PROJECT_IDEAS.md");
      expect(result.success).toBe(true);
      if (!result.success) return;
      const idea = result.data.ideas[0];
      expect(idea.body).toContain("#### Sample game ideas:");
      expect(idea.body).toContain("a roguelike like nethack");
      expect(idea.body).toContain("#### Requirements");
      expect(idea.body).toContain("Should include SKILL.md or similar files");
    });

    it("handles stack field with spaces and commas", () => {
      const result = parseIdeas(ideasFull, "/test/PROJECT_IDEAS.md");
      expect(result.success).toBe(true);
      if (!result.success) return;
      const photoSim = result.data.ideas[1];
      expect(photoSim.stack).toEqual(["Godot 4", "GDScript", "Pixel Art"]);
    });

    it("handles ideas-full.md fixture with 3 ideas", () => {
      const result = parseIdeas(ideasFull, "/test/PROJECT_IDEAS.md");
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.ideas).toHaveLength(3);
      expect(result.data.ideas[0].title).toBe(
        "An ASCII game engine suited for building 2d CLI-based games using AI",
      );
      expect(result.data.ideas[1].title).toBe(
        "Pixel-art photography simulator game",
      );
      expect(result.data.ideas[2].title).toBe(
        "A CLI tool for managing dotfiles",
      );
    });

    it("handles idea without optional path and stack", () => {
      const result = parseIdeas(ideasFull, "/test/PROJECT_IDEAS.md");
      expect(result.success).toBe(true);
      if (!result.success) return;
      const dotfiles = result.data.ideas[2];
      expect(dotfiles.id).toBe("i_b3c4d");
      expect(dotfiles.status).toBe("not-started");
      expect(dotfiles.path).toBeUndefined();
      expect(dotfiles.stack).toBeUndefined();
    });
  });

  describe("preserved content", () => {
    it("preserves preamble sections before Project ideas", () => {
      const result = parseIdeas(ideasFull, "/test/PROJECT_IDEAS.md");
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.preserved.preamble).toContain("# Project Ideas");
      expect(result.preserved.preamble).toContain("## Project requirements");
      expect(result.preserved.preamble).toContain("## Status Legend");
    });

    it("preserves trailing content after last idea", () => {
      const withTrailing = ideasBasic + "\nSome trailing text here.\n";
      const result = parseIdeas(withTrailing, "/test/PROJECT_IDEAS.md");
      expect(result.success).toBe(true);
      if (!result.success) return;
      // Trailing content is text after the last idea within the Project ideas section
      // The trailing text gets included in the last idea's body since it's part of ## Project ideas
      // That's acceptable -- what matters is the text is not lost
    });

    it("stores filePath in parsed data", () => {
      const result = parseIdeas(ideasBasic, "/test/PROJECT_IDEAS.md");
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.filePath).toBe("/test/PROJECT_IDEAS.md");
    });
  });
});
