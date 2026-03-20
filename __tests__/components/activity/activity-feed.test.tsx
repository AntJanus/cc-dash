import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

import { ActivityFeed } from "@/components/activity/activity-feed";
import type { ActivityEvent } from "@/lib/activity/types";

function makeEvent(overrides: Partial<ActivityEvent> = {}): ActivityEvent {
  return {
    id: "test-event-1",
    type: "roadmap_item_completed",
    timestamp: "2026-03-15T00:00:00Z",
    projectSlug: "test-project",
    projectName: "Test Project",
    title: "Completed: Phase 1",
    link: "/project/test-project/roadmap",
    ...overrides,
  };
}

describe("ActivityFeed", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders 'No recent activity' when events array is empty", () => {
    render(<ActivityFeed events={[]} />);
    expect(screen.getByText("No recent activity")).toBeInTheDocument();
  });

  it("renders event items", () => {
    const events = [
      makeEvent({ id: "e1", title: "Completed: Phase 1" }),
      makeEvent({ id: "e2", title: "Started: Phase 2" }),
    ];
    render(<ActivityFeed events={events} />);

    expect(screen.getByText("Completed: Phase 1")).toBeInTheDocument();
    expect(screen.getByText("Started: Phase 2")).toBeInTheDocument();
  });

  it("renders event items with testid", () => {
    render(<ActivityFeed events={[makeEvent()]} />);

    const items = screen.getAllByTestId("activity-event-item");
    expect(items).toHaveLength(1);
  });

  it("hides filters in compact mode", () => {
    render(<ActivityFeed events={[makeEvent()]} compact />);

    expect(
      screen.queryByLabelText("Filter by project"),
    ).not.toBeInTheDocument();
  });

  it("shows filters in full mode", () => {
    render(<ActivityFeed events={[makeEvent()]} />);

    expect(screen.getByLabelText("Filter by project")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by type")).toBeInTheDocument();
  });

  it("renders project name in event items", () => {
    render(
      <ActivityFeed
        events={[makeEvent({ projectName: "My Cool Project" })]}
        compact
      />,
    );

    expect(screen.getByText("My Cool Project")).toBeInTheDocument();
  });
});
