import { describe, it } from "vitest";

// Test stubs for src/components/projects/project-card.tsx (Wave 0 RED state)
// These tests define the expected rendering behavior. The component does not
// exist yet -- all tests are it.todo() and will be implemented in Plan 02.

describe("ProjectCard", () => {
  it.todo("renders the project name");
  it.todo("renders the project description");
  it.todo("renders a progress bar reflecting done/total ratio");
  it.todo("renders item count as 'X / Y items'");
  it.todo("shows a green dot indicator when project is active");
  it.todo("does not show green dot when project is inactive");
  it.todo("displays session status text when available");
  it.todo("does not display session status text when null");
  it.todo("shows relative timestamp for lastUpdated");
  it.todo("shows stale badge when project isStale is true");
  it.todo("does not show stale badge when project isStale is false");
  it.todo("renders status badge with correct status text");
  it.todo("handles zero totalCount without dividing by zero");
});
