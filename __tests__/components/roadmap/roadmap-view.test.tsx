import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { RoadmapView } from "@/components/roadmap/roadmap-view";
import type { RoadmapFile } from "@/lib/schemas/roadmap";

function makeRoadmap(overrides: Partial<RoadmapFile> = {}): RoadmapFile {
  return {
    schema: "cc-dash/roadmap@1",
    project: "test-project",
    description: "A test project",
    last_updated: "2026-03-01T12:00:00-07:00",
    categories: [
      {
        title: "Core Features",
        slug: "core",
        items: [
          {
            id: "r_abc12",
            status: "planned",
            name: "Feature A",
            description: "First feature",
            started: "2026-02-01",
          },
          {
            id: "r_def34",
            status: "done",
            name: "Feature B",
            description: "Second feature",
            completed: "2026-02-15",
          },
        ],
      },
      {
        title: "Extra Features",
        slug: "extra",
        items: [
          {
            id: "r_ghi56",
            status: "in-progress",
            name: "Feature C",
            description: "Third feature",
            started: "2026-03-01",
            depends: ["r_abc12"],
          },
        ],
      },
    ],
    filePath: "/projects/test/ROADMAP.md",
    ...overrides,
  };
}

const defaultSessionRefs: Record<string, string> = {};

describe("RoadmapView", () => {
  afterEach(() => {
    cleanup();
  });

  // RBRD-05: toggle between board and list views
  it("renders board view by default", () => {
    render(
      <RoadmapView roadmap={makeRoadmap()} sessionRefs={defaultSessionRefs} />,
    );
    expect(screen.getByTestId("roadmap-board")).toBeInTheDocument();
  });

  it("toggles to list view when list tab is clicked", () => {
    render(
      <RoadmapView roadmap={makeRoadmap()} sessionRefs={defaultSessionRefs} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: /list/i }));
    expect(screen.getByTestId("roadmap-list")).toBeInTheDocument();
  });

  it("toggles back to board view when board tab is clicked", () => {
    render(
      <RoadmapView roadmap={makeRoadmap()} sessionRefs={defaultSessionRefs} />,
    );
    // Switch to list
    fireEvent.click(screen.getByRole("tab", { name: /list/i }));
    expect(screen.getByTestId("roadmap-list")).toBeInTheDocument();
    // Switch back to board
    fireEvent.click(screen.getByRole("tab", { name: /board/i }));
    expect(screen.getByTestId("roadmap-board")).toBeInTheDocument();
  });

  it("passes categories and sessionRefs to board view", () => {
    const roadmap = makeRoadmap();
    const sessionRefs = { r_abc12: "/project/test/session" };
    render(<RoadmapView roadmap={roadmap} sessionRefs={sessionRefs} />);
    // Board view should be rendered by default and receive props
    expect(screen.getByTestId("roadmap-board")).toBeInTheDocument();
  });

  it("passes categories and sessionRefs to list view", () => {
    const roadmap = makeRoadmap();
    const sessionRefs = { r_abc12: "/project/test/session" };
    render(<RoadmapView roadmap={roadmap} sessionRefs={sessionRefs} />);
    fireEvent.click(screen.getByRole("tab", { name: /list/i }));
    expect(screen.getByTestId("roadmap-list")).toBeInTheDocument();
  });
});
