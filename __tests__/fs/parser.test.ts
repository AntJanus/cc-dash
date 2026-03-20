import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseRoadmap, parseSession } from "@/lib/fs/parser";

// Read fixture files
const fixturesDir = path.resolve(__dirname, "../fixtures");
const roadmapBasic = fs.readFileSync(
  path.join(fixturesDir, "roadmap-basic.md"),
  "utf-8",
);
const roadmapFull = fs.readFileSync(
  path.join(fixturesDir, "roadmap-full.md"),
  "utf-8",
);
const roadmapExtraSections = fs.readFileSync(
  path.join(fixturesDir, "roadmap-extra-sections.md"),
  "utf-8",
);
const sessionBasic = fs.readFileSync(
  path.join(fixturesDir, "session-basic.md"),
  "utf-8",
);
const sessionFull = fs.readFileSync(
  path.join(fixturesDir, "session-full.md"),
  "utf-8",
);
describe("parseRoadmap", () => {
  it("parses basic roadmap into structured data", () => {
    const result = parseRoadmap(roadmapBasic, "/test/ROADMAP.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.schema).toBe("cc-dash/roadmap@1");
    expect(result.data.project).toBe("my-project");
    expect(result.data.description).toBe("A basic test project");
    expect(result.data.filePath).toBe("/test/ROADMAP.md");
    expect(result.data.categories).toHaveLength(1);
    expect(result.data.categories[0].title).toBe("Core Features");
    expect(result.data.categories[0].slug).toBe("core");
    expect(result.data.categories[0].items).toHaveLength(2);
  });

  it("parses full-featured roadmap with all metadata fields", () => {
    const result = parseRoadmap(roadmapFull, "/test/ROADMAP.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.categories).toHaveLength(4);

    // Check in-progress item with started date
    const core = result.data.categories[0];
    const apiItem = core.items.find((i) => i.id === "r_m3p7q");
    expect(apiItem).toBeDefined();
    expect(apiItem!.status).toBe("in-progress");
    expect(apiItem!.started).toBe("2026-02-15");

    // Check done item with both dates
    const doneItem = core.items.find((i) => i.id === "r_x9w1n");
    expect(doneItem).toBeDefined();
    expect(doneItem!.status).toBe("done");
    expect(doneItem!.started).toBe("2026-01-10");
    expect(doneItem!.completed).toBe("2026-03-01");

    // Check idea item
    const future = result.data.categories[3];
    expect(future.slug).toBe("future");
    const ideaItem = future.items[0];
    expect(ideaItem.status).toBe("idea");
  });

  it("extracts category slugs from HTML comments", () => {
    const result = parseRoadmap(roadmapFull, "/test/ROADMAP.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    const slugs = result.data.categories.map((c) => c.slug);
    expect(slugs).toEqual(["core", "ux", "infra", "future"]);
  });

  it("handles done items with strikethrough and completed dates", () => {
    const result = parseRoadmap(roadmapBasic, "/test/ROADMAP.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    const doneItem = result.data.categories[0].items[1];
    expect(doneItem.id).toBe("r_x9w1n");
    expect(doneItem.status).toBe("done");
    expect(doneItem.name).toBe("Feature Two");
    expect(doneItem.completed).toBe("2026-03-01");
    // Description should NOT include the *(Completed: ...)* suffix
    expect(doneItem.description).not.toContain("Completed:");
    expect(doneItem.description).toBe("A completed feature.");
  });

  it("splits depends string into array", () => {
    const result = parseRoadmap(roadmapFull, "/test/ROADMAP.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    // Single dependency
    const infra = result.data.categories[2];
    const ciItem = infra.items.find((i) => i.id === "r_b2c6d");
    expect(ciItem!.depends).toEqual(["r_k8x2m"]);

    // Multiple dependencies
    const monitorItem = infra.items.find((i) => i.id === "r_n7y3z");
    expect(monitorItem!.depends).toEqual(["r_k8x2m", "r_m3p7q"]);
  });

  it("preserves preamble content", () => {
    const result = parseRoadmap(roadmapBasic, "/test/ROADMAP.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.preserved).toBeDefined();
    expect(result.preserved!.preamble).toContain("# Roadmap");
    expect(result.preserved!.preamble).toContain("> A basic test project");
  });

  it("preserves unknown sections", () => {
    const result = parseRoadmap(roadmapExtraSections, "/test/ROADMAP.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.preserved).toBeDefined();
    expect(result.preserved!.unknownSections).toHaveLength(1);
    expect(result.preserved!.unknownSections[0].heading).toBe("Notes");
    expect(result.preserved!.unknownSections[0].raw).toContain(
      "These are some notes",
    );
  });

  it("returns failure for invalid frontmatter schema", () => {
    const invalidRaw = `---
schema: cc-dash/roadmap@999
project: test
description: test
last_updated: 2026-03-09T14:30:00-07:00
---

# Roadmap
`;
    const result = parseRoadmap(invalidRaw, "/test/ROADMAP.md");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns failure for invalid item IDs", () => {
    const invalidRaw = `---
schema: cc-dash/roadmap@1
project: test
description: test
last_updated: 2026-03-09T14:30:00-07:00
---

# Roadmap

## Core
<!-- category:core -->

- <!-- id:INVALID status:planned --> **Bad Item** - Invalid ID format.
`;
    const result = parseRoadmap(invalidRaw, "/test/ROADMAP.md");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("parseSession", () => {
  it("parses basic session into structured data", () => {
    const result = parseSession(sessionBasic, "/test/SESSION.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.schema).toBe("cc-dash/session@1");
    expect(result.data.project).toBe("my-project");
    expect(result.data.session_id).toBe("s_2026-03-09_auth");
    expect(result.data.status).toBe("in-progress");
    expect(result.data.filePath).toBe("/test/SESSION.md");
    expect(result.data.tasks).toHaveLength(2);
    expect(result.data.decisions).toHaveLength(1);
    expect(result.data.failedAttempts).toHaveLength(0);
    expect(result.data.completedWork).toHaveLength(0);
  });

  it("parses full-featured session with all sections", () => {
    const result = parseSession(sessionFull, "/test/SESSION.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.tasks).toHaveLength(4);
    expect(result.data.decisions).toHaveLength(2);
    expect(result.data.failedAttempts).toHaveLength(2);
    expect(result.data.completedWork).toHaveLength(2);
  });

  it("extracts task checkbox state", () => {
    const result = parseSession(sessionFull, "/test/SESSION.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.tasks[0].checked).toBe(false); // [ ]
    expect(result.data.tasks[1].checked).toBe(true); // [x]
    expect(result.data.tasks[2].checked).toBe(false); // [ ]
    expect(result.data.tasks[3].checked).toBe(true); // [x]
  });

  it("extracts task dependencies", () => {
    const result = parseSession(sessionFull, "/test/SESSION.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.tasks[0].dependency).toBe("none");
    expect(result.data.tasks[1].dependency).toBe("t_a1b2c");
    expect(result.data.tasks[2].dependency).toBe("t_d3e4f");
    expect(result.data.tasks[3].dependency).toBe("t_g5h6i");
  });

  it("extracts failed attempts with task refs", () => {
    const result = parseSession(sessionFull, "/test/SESSION.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.failedAttempts[0].id).toBe("f_m1n2o");
    expect(result.data.failedAttempts[0].taskRef).toBe("t_g5h6i");
    expect(result.data.failedAttempts[0].description).toContain(
      "Tried in-memory sessions",
    );
    expect(result.data.failedAttempts[1].id).toBe("f_p3q4r");
    expect(result.data.failedAttempts[1].taskRef).toBe("t_g5h6i");
  });

  it("extracts completed work with timestamps", () => {
    const result = parseSession(sessionFull, "/test/SESSION.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.completedWork[0].taskRef).toBe("t_a1b2c");
    expect(result.data.completedWork[0].timestamp).toBe(
      "2026-03-09T11:00:00-07:00",
    );
    expect(result.data.completedWork[0].description).toContain("Phase 1");
    expect(result.data.completedWork[1].taskRef).toBe("t_d3e4f");
    expect(result.data.completedWork[1].timestamp).toBe(
      "2026-03-09T13:00:00-07:00",
    );
  });

  it("extracts decisions as string array", () => {
    const result = parseSession(sessionFull, "/test/SESSION.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.decisions).toEqual([
      "Phase 1: Chose Passport.js over Auth0 for flexibility",
      "Phase 3: Using Redis over in-memory sessions for persistence",
    ]);
  });

  it("stores currentStatus as raw string", () => {
    const result = parseSession(sessionFull, "/test/SESSION.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.currentStatus).toContain("Working on:");
    expect(result.data.currentStatus).toContain("Next:");
    expect(typeof result.data.currentStatus).toBe("string");
  });

  it("preserves Verification Results as unknown section", () => {
    const result = parseSession(sessionFull, "/test/SESSION.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.preserved).toBeDefined();
    const verificationSection = result.preserved!.unknownSections.find(
      (s) => s.heading === "Verification Results",
    );
    expect(verificationSection).toBeDefined();
    expect(verificationSection!.raw).toContain("Successfully Verified");
    expect(verificationSection!.raw).toContain("Minor Issues Found");
    expect(verificationSection!.raw).toContain("Blocking Issues");
  });

  it("returns failure for invalid frontmatter", () => {
    const invalidRaw = `---
schema: cc-dash/session@999
project: test
session_id: s_2026-03-09_auth
started: 2026-03-09T10:30:00-07:00
last_updated: 2026-03-09T14:15:00-07:00
status: in-progress
---

# Session Progress
`;
    const result = parseSession(invalidRaw, "/test/SESSION.md");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("frontmatter extraction", () => {
  it("extracts YAML frontmatter via gray-matter", () => {
    const result = parseRoadmap(roadmapBasic, "/test/ROADMAP.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    // Frontmatter fields should be present and correctly typed
    expect(result.data.schema).toBe("cc-dash/roadmap@1");
    expect(result.data.project).toBe("my-project");
    expect(typeof result.data.last_updated).toBe("string");
  });

  it("post-processes Date objects to ISO strings", () => {
    // gray-matter / js-yaml may coerce ISO date strings to Date objects.
    // The parser must convert them back to strings for Zod validation.
    const result = parseRoadmap(roadmapBasic, "/test/ROADMAP.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    // last_updated should be a string, not a Date object
    expect(typeof result.data.last_updated).toBe("string");
    expect(result.data.last_updated).toContain("2026");
  });
});

describe("schema validation", () => {
  it("validates parsed roadmap data against RoadmapFileSchema", () => {
    const result = parseRoadmap(roadmapFull, "/test/ROADMAP.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    // All categories should have valid structure
    for (const category of result.data.categories) {
      expect(category.title).toBeTruthy();
      expect(category.slug).toBeTruthy();
      expect(Array.isArray(category.items)).toBe(true);
      for (const item of category.items) {
        expect(item.id).toMatch(/^r_[a-z0-9]{5}$/);
        expect(["planned", "in-progress", "done", "idea"]).toContain(
          item.status,
        );
        expect(item.name).toBeTruthy();
        expect(typeof item.description).toBe("string");
      }
    }
  });

  it("validates parsed session data against SessionFileSchema", () => {
    const result = parseSession(sessionFull, "/test/SESSION.md");
    expect(result.success).toBe(true);
    if (!result.success) return;

    // All tasks should have valid structure
    for (const task of result.data.tasks) {
      expect(task.id).toMatch(/^t_[a-z0-9]{5}$/);
      expect(typeof task.checked).toBe("boolean");
      expect(typeof task.dependency).toBe("string");
      expect(typeof task.description).toBe("string");
    }

    // All failed attempts should have valid structure
    for (const attempt of result.data.failedAttempts) {
      expect(attempt.id).toMatch(/^f_[a-z0-9]{5}$/);
      expect(attempt.taskRef).toMatch(/^t_[a-z0-9]{5}$/);
    }

    // All completion entries should have valid structure
    for (const entry of result.data.completedWork) {
      expect(entry.taskRef).toMatch(/^t_[a-z0-9]{5}$/);
      expect(typeof entry.timestamp).toBe("string");
    }
  });
});
