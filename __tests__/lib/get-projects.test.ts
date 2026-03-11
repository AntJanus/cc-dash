import { describe, it } from "vitest";

// Test stubs for src/lib/projects/get-projects.ts (Wave 0 RED state)
// These tests define the expected API surface. The production module does not
// exist yet -- all tests are it.todo() and will be implemented in Plan 01.

describe("extractWorkingOn", () => {
  it.todo("extracts text after 'Working on:' line");
  it.todo("returns null when 'Working on:' is missing");
  it.todo("handles bold markdown format '**Working on:**'");
});

describe("deriveStatus", () => {
  it.todo("returns 'active' when session is in-progress");
  it.todo("returns 'complete' when all roadmap items are done");
  it.todo("returns 'stalled' when isStale is true and session exists");
  it.todo("returns 'inactive' as default when no session and not complete");
  it.todo("session status overrides roadmap-only status");
});

describe("stale detection", () => {
  it.todo("marks project as stale when lastUpdated is 8+ days ago");
  it.todo("marks project as not stale when lastUpdated is 6 days ago");
  it.todo("marks project as stale when lastUpdated is null");
});

describe("sorting", () => {
  it.todo("sorts projects descending by lastUpdated");
  it.todo("sorts projects with null lastUpdated last");
});

describe("getProjectCards aggregation", () => {
  it.todo("degrades gracefully when a project file fails to parse");
  it.todo("computes progress counts from roadmap items");
});
