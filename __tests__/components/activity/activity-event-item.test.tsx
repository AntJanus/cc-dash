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

import { ActivityEventItem } from "@/components/activity/activity-event-item";
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

describe("ActivityEventItem", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the event title", () => {
    render(<ActivityEventItem event={makeEvent()} />);
    expect(screen.getByText("Completed: Phase 1")).toBeInTheDocument();
  });

  it("renders the project name as a link when link is provided", () => {
    render(<ActivityEventItem event={makeEvent()} />);
    const link = screen.getByText("Test Project");
    expect(link.closest("a")).toHaveAttribute(
      "href",
      "/project/test-project/roadmap",
    );
  });

  it("renders project name as plain text when no link", () => {
    render(<ActivityEventItem event={makeEvent({ link: undefined })} />);
    const name = screen.getByText("Test Project");
    expect(name.closest("a")).toBeNull();
  });

  it("renders description in non-compact mode", () => {
    render(
      <ActivityEventItem
        event={makeEvent({ description: "Setup scaffolding" })}
      />,
    );
    expect(screen.getByText("Setup scaffolding")).toBeInTheDocument();
  });

  it("hides description in compact mode", () => {
    render(
      <ActivityEventItem
        event={makeEvent({ description: "Setup scaffolding" })}
        compact
      />,
    );
    expect(screen.queryByText("Setup scaffolding")).not.toBeInTheDocument();
  });

  it("renders the testid", () => {
    render(<ActivityEventItem event={makeEvent()} />);
    expect(screen.getByTestId("activity-event-item")).toBeInTheDocument();
  });

  it("renders different event types", () => {
    const types = [
      "roadmap_item_completed",
      "roadmap_item_started",
      "session_started",
      "session_work_completed",
    ] as const;

    for (const type of types) {
      const { unmount } = render(
        <ActivityEventItem
          event={makeEvent({
            id: `event-${type}`,
            type,
            title: `Event: ${type}`,
          })}
        />,
      );
      expect(screen.getByText(`Event: ${type}`)).toBeInTheDocument();
      unmount();
    }
  });
});
