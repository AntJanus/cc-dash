import { describe, it } from "vitest";

// Test stubs for src/components/projects/project-grid.tsx and
// src/components/projects/project-filters.tsx (Wave 0 RED state)
// These tests define the expected grid/filter behavior. The components do not
// exist yet -- all tests are it.todo() and will be implemented in Plan 02.

describe("ProjectGrid", () => {
  it.todo("renders all projects when no filter is active");
  it.todo("'All' filter button shows all projects");
  it.todo("'Active' filter shows only active projects");
  it.todo("'Stalled' filter shows only stalled projects");
  it.todo("'Complete' filter shows only complete projects");
  it.todo("'Inactive' filter shows only inactive projects");
  it.todo("search by project name filters results");
  it.todo("search by project description filters results");
  it.todo("search is case-insensitive");
  it.todo("combined filter and search narrows results correctly");
  it.todo("shows empty state message when no projects match filter");
  it.todo("shows empty state message when projects array is empty");
});

describe("ProjectFilters", () => {
  it.todo("renders filter buttons for All, Active, Stalled, Complete");
  it.todo("active filter button has visually distinct styling");
  it.todo("search input has placeholder 'Search projects...'");
});
