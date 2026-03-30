import { describe, it, expect } from "vitest";
import {
  generateReadme,
  generateClaudeMd,
  generateClaudeSettings,
} from "@/lib/templates/scaffold-files";

describe("generateReadme", () => {
  it("includes project name as heading", () => {
    const result = generateReadme("My Project", "A cool project");
    expect(result).toContain("# My Project");
  });

  it("includes description", () => {
    const result = generateReadme("My Project", "A cool project");
    expect(result).toContain("A cool project");
  });

  it("ends with newline", () => {
    const result = generateReadme("Test", "Desc");
    expect(result.endsWith("\n")).toBe(true);
  });
});

describe("generateClaudeMd", () => {
  it("includes project name in heading", () => {
    const result = generateClaudeMd("My Project", "A cool project", ["Go"]);
    expect(result).toContain("# CLAUDE.md — My Project");
  });

  it("includes description in Project Overview", () => {
    const result = generateClaudeMd("My Project", "A cool project", []);
    expect(result).toContain("A cool project");
  });

  it("includes stack when provided", () => {
    const result = generateClaudeMd("P", "D", ["TypeScript", "React"]);
    expect(result).toContain("**Stack**: TypeScript, React");
  });

  it("omits stack line when empty", () => {
    const result = generateClaudeMd("P", "D", []);
    expect(result).not.toContain("**Stack**");
  });

  it("includes all expected sections", () => {
    const result = generateClaudeMd("P", "D", []);
    expect(result).toContain("## Project Overview");
    expect(result).toContain("## Development Commands");
    expect(result).toContain("## Architecture");
    expect(result).toContain("## Conventions");
    expect(result).toContain("## Do Not");
  });
});

describe("generateClaudeSettings", () => {
  it("produces valid JSON", () => {
    const result = generateClaudeSettings();
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("produces empty object", () => {
    const result = generateClaudeSettings();
    expect(JSON.parse(result)).toEqual({});
  });

  it("ends with newline", () => {
    const result = generateClaudeSettings();
    expect(result.endsWith("\n")).toBe(true);
  });
});
