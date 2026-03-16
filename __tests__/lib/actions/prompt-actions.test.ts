import { describe, it } from "vitest";

describe("generateProjectPrompt", () => {
  it.todo("returns success with prompt for valid slug");
  it.todo("returns error for unknown slug");
  it.todo("re-reads files fresh, not from cache");
});

describe("generateCrossProjectPrompt", () => {
  it.todo("returns success with prompt for best project");
  it.todo("returns empty state message when all projects complete");
  it.todo("returns empty state message when no projects discovered");
});
