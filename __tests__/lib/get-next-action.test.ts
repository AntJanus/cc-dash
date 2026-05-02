import { describe, it, expect } from "vitest";
import { getNextAction } from "@/lib/projects/get-next-action";
import type { RoadmapFile, RoadmapItem } from "@/lib/schemas/roadmap";
import type { SessionFile, SessionTask } from "@/lib/schemas/session";

function makeRoadmap(items: RoadmapItem[]): RoadmapFile {
  return {
    schema: "cc-dash/roadmap@1",
    project: "test",
    description: "Test project",
    last_updated: "2026-04-10T12:00:00+00:00",
    filePath: "/tmp/test/ROADMAP.md",
    categories: [{ title: "Core", slug: "core", items }],
  };
}

function makeItem(overrides: Partial<RoadmapItem>): RoadmapItem {
  return {
    id: "r_aaaaa",
    status: "planned",
    name: "Item",
    description: "",
    ...overrides,
  };
}

function makeSession(tasks: SessionTask[]): SessionFile {
  return {
    schema: "cc-dash/session@1",
    project: "test",
    session_id: "s_2026-04-10_test",
    started: "2026-04-10T10:00:00+00:00",
    last_updated: "2026-04-10T12:00:00+00:00",
    status: "in-progress",
    filePath: "/tmp/test/SESSION_PROGRESS.md",
    tasks,
    currentStatus: "",
    decisions: [],
    failedAttempts: [],
    completedWork: [],
  };
}

function makeTask(overrides: Partial<SessionTask>): SessionTask {
  return {
    id: "t_aaaaa",
    checked: false,
    dependency: "none",
    description: "Task",
    ...overrides,
  };
}

describe("getNextAction", () => {
  it("returns null when roadmap and session are both null", () => {
    expect(getNextAction(null, null)).toBeNull();
  });

  it("returns null when roadmap has only done items and no session", () => {
    const roadmap = makeRoadmap([
      makeItem({ id: "r_aaaaa", status: "done" }),
      makeItem({ id: "r_bbbbb", status: "done" }),
    ]);
    expect(getNextAction(roadmap, null)).toBeNull();
  });

  it("prefers in-progress roadmap items over planned ones", () => {
    const roadmap = makeRoadmap([
      makeItem({ id: "r_aaaaa", status: "planned", name: "Plan A" }),
      makeItem({ id: "r_bbbbb", status: "in-progress", name: "Build B" }),
      makeItem({ id: "r_ccccc", status: "planned", name: "Plan C" }),
    ]);
    const action = getNextAction(roadmap, null);
    expect(action).toEqual({
      id: "r_bbbbb",
      name: "Build B",
      source: "roadmap-in-progress",
    });
  });

  it("returns first planned item when no in-progress exists", () => {
    const roadmap = makeRoadmap([
      makeItem({ id: "r_aaaaa", status: "done" }),
      makeItem({ id: "r_bbbbb", status: "planned", name: "Next thing" }),
      makeItem({ id: "r_ccccc", status: "planned", name: "Later" }),
    ]);
    const action = getNextAction(roadmap, null);
    expect(action).toEqual({
      id: "r_bbbbb",
      name: "Next thing",
      source: "roadmap-planned",
    });
  });

  it("walks across categories to find first in-progress item", () => {
    const roadmap: RoadmapFile = {
      schema: "cc-dash/roadmap@1",
      project: "test",
      description: "",
      last_updated: "2026-04-10T12:00:00+00:00",
      filePath: "/tmp/test/ROADMAP.md",
      categories: [
        {
          title: "Cat A",
          slug: "a",
          items: [makeItem({ id: "r_aaaaa", status: "done" })],
        },
        {
          title: "Cat B",
          slug: "b",
          items: [
            makeItem({
              id: "r_bbbbb",
              status: "in-progress",
              name: "Cross-cat hit",
            }),
          ],
        },
      ],
    };
    const action = getNextAction(roadmap, null);
    expect(action?.id).toBe("r_bbbbb");
    expect(action?.source).toBe("roadmap-in-progress");
  });

  it("falls back to first unchecked session task when roadmap is exhausted", () => {
    const roadmap = makeRoadmap([makeItem({ id: "r_aaaaa", status: "done" })]);
    const session = makeSession([
      makeTask({ id: "t_aaaaa", checked: true }),
      makeTask({ id: "t_bbbbb", checked: false, description: "Do this next" }),
      makeTask({ id: "t_ccccc", checked: false }),
    ]);
    const action = getNextAction(roadmap, session);
    expect(action).toEqual({
      id: "t_bbbbb",
      name: "Do this next",
      source: "session-task",
    });
  });

  it("falls back to session task when roadmap is null", () => {
    const session = makeSession([
      makeTask({ id: "t_aaaaa", checked: false, description: "Only path" }),
    ]);
    const action = getNextAction(null, session);
    expect(action?.source).toBe("session-task");
    expect(action?.name).toBe("Only path");
  });

  it("returns null when all session tasks are checked and roadmap has nothing", () => {
    const session = makeSession([
      makeTask({ id: "t_aaaaa", checked: true }),
      makeTask({ id: "t_bbbbb", checked: true }),
    ]);
    expect(getNextAction(null, session)).toBeNull();
  });

  it("ignores session when roadmap has actionable items", () => {
    const roadmap = makeRoadmap([
      makeItem({ id: "r_aaaaa", status: "planned", name: "Roadmap wins" }),
    ]);
    const session = makeSession([
      makeTask({
        id: "t_aaaaa",
        checked: false,
        description: "Should not pick",
      }),
    ]);
    const action = getNextAction(roadmap, session);
    expect(action?.source).toBe("roadmap-planned");
    expect(action?.name).toBe("Roadmap wins");
  });

  it("treats idea-status items as not actionable (skips to planned)", () => {
    const roadmap = makeRoadmap([
      makeItem({ id: "r_aaaaa", status: "idea", name: "Idea, not action" }),
      makeItem({ id: "r_bbbbb", status: "planned", name: "Planned action" }),
    ]);
    const action = getNextAction(roadmap, null);
    expect(action?.id).toBe("r_bbbbb");
  });
});
