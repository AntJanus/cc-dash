import { describe, it, expect } from "vitest";
import {
  assembleProjectPrompt,
  pickBestProject,
  detectWorkflowSuggestion,
} from "@/lib/prompt/generate-prompt";
import type { RoadmapFile } from "@/lib/schemas/roadmap";
import type { SessionFile } from "@/lib/schemas/session";

// --- Helpers ---

function makeRoadmap(overrides: Partial<RoadmapFile> = {}): RoadmapFile {
  return {
    schema: "cc-dash/roadmap@1",
    project: "test-project",
    description: "A test roadmap",
    last_updated: "2026-03-01T10:00:00-07:00",
    categories: [
      {
        title: "Core Features",
        slug: "core-features",
        items: [
          {
            id: "r_abc12",
            status: "done",
            name: "Feature A",
            description: "First feature",
            completed: "2026-02-28",
          },
          {
            id: "r_def34",
            status: "done",
            name: "Feature B",
            description: "Second feature",
            completed: "2026-03-01",
          },
          {
            id: "r_ghi56",
            status: "done",
            name: "Feature C",
            description: "Third feature",
            completed: "2026-03-02",
          },
          {
            id: "r_jkl78",
            status: "planned",
            name: "Feature D",
            description: "Fourth feature",
          },
          {
            id: "r_mno90",
            status: "in-progress",
            name: "Feature E",
            description: "Fifth feature",
            started: "2026-03-05",
          },
        ],
      },
      {
        title: "Nice to Have",
        slug: "nice-to-have",
        items: [
          {
            id: "r_pqr12",
            status: "planned",
            name: "Feature F",
            description: "Sixth feature",
          },
          {
            id: "r_stu34",
            status: "idea",
            name: "Feature G",
            description: "Seventh feature",
          },
          {
            id: "r_vwx56",
            status: "planned",
            name: "Feature H",
            description: "Eighth feature",
          },
          {
            id: "r_yza78",
            status: "done",
            name: "Feature I",
            description: "Ninth feature",
            completed: "2026-03-03",
          },
          {
            id: "r_bcd90",
            status: "planned",
            name: "Feature J",
            description: "Tenth feature",
          },
        ],
      },
    ],
    filePath: "/projects/test-project/ROADMAP.md",
    ...overrides,
  };
}

function makeSession(overrides: Partial<SessionFile> = {}): SessionFile {
  return {
    schema: "cc-dash/session@1",
    project: "test-project",
    session_id: "s_2026-03-05_feature-work",
    started: "2026-03-05T09:00:00-07:00",
    last_updated: "2026-03-05T12:00:00-07:00",
    status: "in-progress",
    tasks: [],
    currentStatus: "Working on: implementing prompt generation",
    decisions: [],
    failedAttempts: [],
    completedWork: [],
    filePath: "/projects/test-project/SESSION_PROGRESS.md",
    ...overrides,
  };
}

// --- assembleProjectPrompt tests ---

describe("assembleProjectPrompt", () => {
  it("starts with cd /path/to/project", () => {
    const prompt = assembleProjectPrompt(
      "/path/to/project",
      "MyProject",
      null,
      null,
    );
    expect(prompt.startsWith("cd /path/to/project")).toBe(true);
  });

  it("includes project name", () => {
    const prompt = assembleProjectPrompt(
      "/path/to/project",
      "MyProject",
      null,
      null,
    );
    expect(prompt).toContain("Project: MyProject");
  });

  it("includes roadmap progress summary X/Y done", () => {
    const roadmap = makeRoadmap();
    const prompt = assembleProjectPrompt(
      "/path/to/project",
      "MyProject",
      roadmap,
      null,
    );
    // 4 done out of 10 total items
    expect(prompt).toContain("Roadmap: 4/10 items done");
  });

  it("includes next in-progress or planned item", () => {
    const roadmap = makeRoadmap();
    const prompt = assembleProjectPrompt(
      "/path/to/project",
      "MyProject",
      roadmap,
      null,
    );
    // First non-done item should be Feature D (planned) or Feature E (in-progress)
    // in-progress should be prioritized
    expect(prompt).toMatch(/Next item: Feature [DE] \((planned|in-progress)\)/);
  });

  it("includes session status and currentStatus when session exists", () => {
    const session = makeSession();
    const prompt = assembleProjectPrompt(
      "/path/to/project",
      "MyProject",
      null,
      session,
    );
    expect(prompt).toContain(
      "Session: s_2026-03-05_feature-work (in-progress)",
    );
    expect(prompt).toContain("Working on: implementing prompt generation");
  });

  it("includes reminder to read SESSION_PROGRESS.md when session exists", () => {
    const session = makeSession();
    const prompt = assembleProjectPrompt(
      "/path/to/project",
      "MyProject",
      null,
      session,
    );
    expect(prompt).toContain("Read SESSION_PROGRESS.md");
  });

  it("omits session section when no session", () => {
    const roadmap = makeRoadmap();
    const prompt = assembleProjectPrompt(
      "/path/to/project",
      "MyProject",
      roadmap,
      null,
    );
    expect(prompt).not.toContain("Session:");
    expect(prompt).not.toContain("SESSION_PROGRESS.md");
  });

  it("omits roadmap section when no roadmap", () => {
    const session = makeSession();
    const prompt = assembleProjectPrompt(
      "/path/to/project",
      "MyProject",
      null,
      session,
    );
    expect(prompt).not.toContain("Roadmap:");
    expect(prompt).not.toContain("Next item:");
  });

  it("suggests resume when session is in-progress", () => {
    const session = makeSession({ status: "in-progress" });
    const prompt = assembleProjectPrompt(
      "/path/to/project",
      "MyProject",
      null,
      session,
    );
    expect(prompt).toContain("Suggested: Resume");
  });

  it("suggests execute when roadmap has planned items", () => {
    const roadmap = makeRoadmap();
    const prompt = assembleProjectPrompt(
      "/path/to/project",
      "MyProject",
      roadmap,
      null,
    );
    expect(prompt).toContain("Suggested: Execute");
  });

  it("suggests plan when no planned items and no active session", () => {
    const roadmap = makeRoadmap({
      categories: [
        {
          title: "Done",
          slug: "done",
          items: [
            {
              id: "r_abc12",
              status: "done",
              name: "Feature A",
              description: "Done",
              completed: "2026-03-01",
            },
          ],
        },
      ],
    });
    const session = makeSession({ status: "completed" });
    const prompt = assembleProjectPrompt(
      "/path/to/project",
      "MyProject",
      roadmap,
      session,
    );
    expect(prompt).toContain("Suggested: Plan");
  });

  it("produces plain text with no markdown formatting", () => {
    const roadmap = makeRoadmap();
    const session = makeSession();
    const prompt = assembleProjectPrompt(
      "/path/to/project",
      "MyProject",
      roadmap,
      session,
    );
    // No markdown backticks, no bold markers, no heading markers
    expect(prompt).not.toMatch(/```/);
    expect(prompt).not.toMatch(/\*\*/);
    expect(prompt).not.toMatch(/^#+\s/m);
  });
});

// --- detectWorkflowSuggestion tests ---

describe("detectWorkflowSuggestion", () => {
  it("returns Resume suggestion when session is in-progress", () => {
    const session = makeSession({ status: "in-progress" });
    const result = detectWorkflowSuggestion(session, null);
    expect(result).toContain("Resume");
    expect(result).toContain("SESSION_PROGRESS.md");
  });

  it("returns Execute suggestion when roadmap has planned items", () => {
    const roadmap = makeRoadmap();
    const result = detectWorkflowSuggestion(null, roadmap);
    expect(result).toContain("Execute");
  });

  it("returns Plan suggestion as fallback", () => {
    const result = detectWorkflowSuggestion(null, null);
    expect(result).toContain("Plan");
  });
});

// --- pickBestProject tests ---

describe("pickBestProject", () => {
  it("returns null when no candidates", () => {
    const result = pickBestProject([]);
    expect(result).toBeNull();
  });

  it("returns null when all projects are complete", () => {
    const result = pickBestProject([
      {
        slug: "project-a",
        path: "/projects/a",
        name: "Project A",
        hasActiveSession: false,
        lastUpdated: "2026-03-01T10:00:00Z",
        isStale: false,
        status: "complete" as const,
      },
    ]);
    expect(result).toBeNull();
  });

  it("picks project with active session over recently active", () => {
    const result = pickBestProject([
      {
        slug: "recent",
        path: "/projects/recent",
        name: "Recent",
        hasActiveSession: false,
        lastUpdated: "2026-03-10T10:00:00Z",
        isStale: false,
        status: "inactive" as const,
      },
      {
        slug: "active",
        path: "/projects/active",
        name: "Active",
        hasActiveSession: true,
        lastUpdated: "2026-03-05T10:00:00Z",
        isStale: false,
        status: "active" as const,
      },
    ]);
    expect(result?.slug).toBe("active");
  });

  it("picks most recently updated active session when multiple", () => {
    const result = pickBestProject([
      {
        slug: "active-old",
        path: "/projects/active-old",
        name: "Active Old",
        hasActiveSession: true,
        lastUpdated: "2026-03-01T10:00:00Z",
        isStale: false,
        status: "active" as const,
      },
      {
        slug: "active-new",
        path: "/projects/active-new",
        name: "Active New",
        hasActiveSession: true,
        lastUpdated: "2026-03-10T10:00:00Z",
        isStale: false,
        status: "active" as const,
      },
    ]);
    expect(result?.slug).toBe("active-new");
  });

  it("picks recently active over stalled when no active sessions", () => {
    const result = pickBestProject([
      {
        slug: "stalled",
        path: "/projects/stalled",
        name: "Stalled",
        hasActiveSession: false,
        lastUpdated: "2026-01-01T10:00:00Z",
        isStale: true,
        status: "stalled" as const,
      },
      {
        slug: "recent",
        path: "/projects/recent",
        name: "Recent",
        hasActiveSession: false,
        lastUpdated: "2026-03-10T10:00:00Z",
        isStale: false,
        status: "inactive" as const,
      },
    ]);
    expect(result?.slug).toBe("recent");
  });

  it("picks stalled project when no active or recent", () => {
    const result = pickBestProject([
      {
        slug: "stalled",
        path: "/projects/stalled",
        name: "Stalled",
        hasActiveSession: false,
        lastUpdated: "2026-01-01T10:00:00Z",
        isStale: true,
        status: "stalled" as const,
      },
    ]);
    expect(result?.slug).toBe("stalled");
  });

  it("sorts stalled by lastUpdated descending", () => {
    const result = pickBestProject([
      {
        slug: "stalled-old",
        path: "/projects/stalled-old",
        name: "Stalled Old",
        hasActiveSession: false,
        lastUpdated: "2025-12-01T10:00:00Z",
        isStale: true,
        status: "stalled" as const,
      },
      {
        slug: "stalled-new",
        path: "/projects/stalled-new",
        name: "Stalled New",
        hasActiveSession: false,
        lastUpdated: "2026-02-01T10:00:00Z",
        isStale: true,
        status: "stalled" as const,
      },
    ]);
    expect(result?.slug).toBe("stalled-new");
  });
});
