import { describe, it } from "vitest";

describe("getRoadmapBySlug", () => {
  it.todo("returns roadmap data for a valid project slug");
  it.todo("returns null when slug does not match any project");
  it.todo("returns null when project has no roadmap file");
  it.todo("includes session ref when session references a roadmap item");
  it.todo("returns empty sessionRefs when project has no session");
  it.todo("derives slug from directory basename, not frontmatter");
});
