import { describe, it, expect } from "vitest";
import type { RoadmapFile, RoadmapCategory } from "@/lib/schemas/roadmap";
import type { SessionFile } from "@/lib/schemas/session";
import type { RoadmapParseResult, SessionParseResult } from "@/lib/fs/types";
import { serializeRoadmap, serializeSession } from "@/lib/fs/serializer";

// --- Helper factories ---

function makeRoadmapFile(
  overrides: Partial<RoadmapFile> = {},
): RoadmapFile & Partial<RoadmapParseResult> {
  return {
    schema: "cc-dash/roadmap@1" as const,
    project: "test-project",
    description: "A test project description",
    last_updated: "2026-03-09T14:30:00-07:00",
    categories: [],
    filePath: "/test/ROADMAP.md",
    ...overrides,
  };
}

function makeCategory(
  overrides: Partial<RoadmapCategory> = {},
): RoadmapCategory {
  return {
    title: "Core Features",
    slug: "core",
    items: [],
    ...overrides,
  };
}

function makeSessionFile(
  overrides: Partial<SessionFile> = {},
): SessionFile & Partial<SessionParseResult> {
  return {
    schema: "cc-dash/session@1" as const,
    project: "test-project",
    session_id: "s_2026-03-09_auth",
    started: "2026-03-09T10:30:00-07:00",
    last_updated: "2026-03-09T14:15:00-07:00",
    status: "in-progress" as const,
    tasks: [],
    currentStatus: "",
    decisions: [],
    failedAttempts: [],
    completedWork: [],
    filePath: "/test/SESSION.md",
    ...overrides,
  };
}

describe("serializeRoadmap", () => {
  it("produces valid frontmatter with all fields", () => {
    const data = makeRoadmapFile();
    const result = serializeRoadmap(data);

    expect(result).toContain("---");
    expect(result).toContain("schema: cc-dash/roadmap@1");
    expect(result).toContain("project: test-project");
    expect(result).toContain("description: A test project description");
    expect(result).toContain("last_updated: '2026-03-09T14:30:00-07:00'");
    // Should NOT contain filePath or categories in frontmatter
    expect(result).not.toMatch(/^filePath:/m);
    expect(result).not.toMatch(/^categories:/m);
  });

  it("produces category headings with category comments", () => {
    const data = makeRoadmapFile({
      categories: [makeCategory({ title: "Core Features", slug: "core" })],
    });
    const result = serializeRoadmap(data);

    expect(result).toContain("## Core Features");
    expect(result).toContain("<!-- category:core -->");
  });

  it("produces item lines with HTML comment metadata", () => {
    const data = makeRoadmapFile({
      categories: [
        makeCategory({
          items: [
            {
              id: "r_k8x2m",
              status: "planned",
              name: "Feature One",
              description: "The first planned feature.",
            },
          ],
        }),
      ],
    });
    const result = serializeRoadmap(data);

    expect(result).toContain(
      "- <!-- id:r_k8x2m status:planned --> **Feature One** - The first planned feature.",
    );
  });

  it("applies strikethrough for done items", () => {
    const data = makeRoadmapFile({
      categories: [
        makeCategory({
          items: [
            {
              id: "r_x9w1n",
              status: "done",
              name: "Feature Two",
              description: "A completed feature.",
              completed: "2026-03-01",
            },
          ],
        }),
      ],
    });
    const result = serializeRoadmap(data);

    expect(result).toContain("~~**Feature Two**~~");
  });

  it("includes *(Completed: date)* suffix for done items", () => {
    const data = makeRoadmapFile({
      categories: [
        makeCategory({
          items: [
            {
              id: "r_x9w1n",
              status: "done",
              name: "Feature Two",
              description: "A completed feature.",
              completed: "2026-03-01",
            },
          ],
        }),
      ],
    });
    const result = serializeRoadmap(data);

    expect(result).toContain("*(Completed: 2026-03-01)*");
  });

  it("serializes depends array as comma-separated string", () => {
    const data = makeRoadmapFile({
      categories: [
        makeCategory({
          items: [
            {
              id: "r_n7y3z",
              status: "in-progress",
              name: "Monitoring",
              description: "Application health monitoring.",
              started: "2026-03-05",
              depends: ["r_k8x2m", "r_m3p7q"],
            },
          ],
        }),
      ],
    });
    const result = serializeRoadmap(data);

    expect(result).toContain("depends:r_k8x2m,r_m3p7q");
  });

  it("omits optional fields when not present", () => {
    const data = makeRoadmapFile({
      categories: [
        makeCategory({
          items: [
            {
              id: "r_k8x2m",
              status: "planned",
              name: "Feature One",
              description: "The first planned feature.",
            },
          ],
        }),
      ],
    });
    const result = serializeRoadmap(data);

    // The metadata comment should only have id and status
    expect(result).toContain("<!-- id:r_k8x2m status:planned -->");
    expect(result).not.toContain("started:");
    expect(result).not.toContain("completed:");
    expect(result).not.toContain("depends:");
  });

  it("uses provided preamble instead of default", () => {
    const data = makeRoadmapFile({
      preamble: "\n# My Custom Roadmap\n\n> Custom description\n",
    } as RoadmapFile & Partial<RoadmapParseResult>);
    const result = serializeRoadmap(data);

    expect(result).toContain("# My Custom Roadmap");
    expect(result).toContain("> Custom description");
  });

  it("appends unknown sections in original position", () => {
    const data = makeRoadmapFile({
      categories: [makeCategory()],
      unknownSections: [
        {
          heading: "Notes",
          raw: "\nThese are some notes.\n",
        },
      ],
    } as RoadmapFile & Partial<RoadmapParseResult>);
    const result = serializeRoadmap(data);

    expect(result).toContain("## Notes");
    expect(result).toContain("These are some notes.");
  });

  it("handles empty categories (heading + comment, no items)", () => {
    const data = makeRoadmapFile({
      categories: [makeCategory({ title: "Empty Section", slug: "empty" })],
    });
    const result = serializeRoadmap(data);

    expect(result).toContain("## Empty Section");
    expect(result).toContain("<!-- category:empty -->");
  });
});

describe("serializeSession", () => {
  it("produces valid frontmatter with all fields", () => {
    const data = makeSessionFile({
      roadmap_ref: "r_k8x2m",
    });
    const result = serializeSession(data);

    expect(result).toContain("---");
    expect(result).toContain("schema: cc-dash/session@1");
    expect(result).toContain("project: test-project");
    expect(result).toContain("session_id: s_2026-03-09_auth");
    expect(result).toContain("roadmap_ref: r_k8x2m");
    expect(result).toContain("started: '2026-03-09T10:30:00-07:00'");
    expect(result).toContain("last_updated: '2026-03-09T14:15:00-07:00'");
    expect(result).toContain("status: in-progress");
    // Should NOT contain filePath or task data in frontmatter
    expect(result).not.toMatch(/^filePath:/m);
  });

  it("produces Plan section with checkbox task lines", () => {
    const data = makeSessionFile({
      tasks: [
        {
          id: "t_a1b2c",
          checked: true,
          dependency: "none",
          description: "Phase 1: Research authentication libraries",
        },
        {
          id: "t_d3e4f",
          checked: false,
          dependency: "t_a1b2c",
          description: "Phase 2: Set up OAuth flow",
        },
      ],
    });
    const result = serializeSession(data);

    expect(result).toContain("## Plan");
    expect(result).toContain(
      "- [x] <!-- id:t_a1b2c dep:none --> Phase 1: Research authentication libraries",
    );
    expect(result).toContain(
      "- [ ] <!-- id:t_d3e4f dep:t_a1b2c --> Phase 2: Set up OAuth flow",
    );
  });

  it("produces Current Status section from raw string", () => {
    const data = makeSessionFile({
      currentStatus:
        "Last updated: 2026-03-09T14:15:00-07:00\nWorking on: Phase 2\nNext: Configure providers",
    });
    const result = serializeSession(data);

    expect(result).toContain("## Current Status");
    expect(result).toContain("Working on: Phase 2");
    expect(result).toContain("Next: Configure providers");
  });

  it("produces Decisions section with plain bullet items", () => {
    const data = makeSessionFile({
      decisions: [
        "Phase 1: Chose Passport.js over Auth0 for flexibility",
        "Phase 3: Using Redis over in-memory sessions for persistence",
      ],
    });
    const result = serializeSession(data);

    expect(result).toContain("## Decisions");
    expect(result).toContain(
      "- Phase 1: Chose Passport.js over Auth0 for flexibility",
    );
    expect(result).toContain(
      "- Phase 3: Using Redis over in-memory sessions for persistence",
    );
  });

  it("produces Failed Attempts section with HTML comment metadata", () => {
    const data = makeSessionFile({
      failedAttempts: [
        {
          id: "f_m1n2o",
          taskRef: "t_g5h6i",
          description: "Tried in-memory sessions: Failed",
        },
      ],
    });
    const result = serializeSession(data);

    expect(result).toContain("## Failed Attempts");
    expect(result).toContain(
      "- <!-- id:f_m1n2o task:t_g5h6i --> Tried in-memory sessions: Failed",
    );
  });

  it("produces Completed Work section with HTML comment metadata", () => {
    const data = makeSessionFile({
      completedWork: [
        {
          taskRef: "t_a1b2c",
          timestamp: "2026-03-09T11:00:00-07:00",
          description: "Phase 1: Evaluated OAuth.js, Passport.js, Auth0.",
        },
      ],
    });
    const result = serializeSession(data);

    expect(result).toContain("## Completed Work");
    expect(result).toContain(
      "- <!-- ref:t_a1b2c at:2026-03-09T11:00:00-07:00 --> Phase 1: Evaluated OAuth.js, Passport.js, Auth0.",
    );
  });

  it("appends unknown sections", () => {
    const data = makeSessionFile({
      unknownSections: [
        {
          heading: "Custom Notes",
          raw: "\nThese are custom notes.\n",
        },
      ],
    } as SessionFile & Partial<SessionParseResult>);
    const result = serializeSession(data);

    expect(result).toContain("## Custom Notes");
    expect(result).toContain("These are custom notes.");
  });

  it("handles empty sections gracefully", () => {
    const data = makeSessionFile({
      tasks: [],
      currentStatus: "",
      decisions: [],
      failedAttempts: [],
      completedWork: [],
    });
    const result = serializeSession(data);

    // All section headings should still be present
    expect(result).toContain("## Plan");
    expect(result).toContain("## Current Status");
    expect(result).toContain("## Decisions");
    expect(result).toContain("## Failed Attempts");
    expect(result).toContain("## Completed Work");
  });
});
