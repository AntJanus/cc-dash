import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { RightPanel } from "@/components/layout/right-panel";

const defaultStats = {
  active: 5,
  stalled: 3,
  complete: 10,
  totalTasks: 42,
};

const defaultActivity: Parameters<typeof RightPanel>[0]["recentActivity"] = [];
const defaultAlerts: Parameters<typeof RightPanel>[0]["alerts"] = [];

describe("RightPanel", () => {
  afterEach(() => {
    cleanup();
  });

  describe("ResourceCard links", () => {
    it("renders Active stat as a link to /?status=active", () => {
      render(
        <RightPanel
          stats={defaultStats}
          recentActivity={defaultActivity}
          alerts={defaultAlerts}
        />,
      );

      const activeLink = screen.getByRole("link", { name: /5.*active/i });
      expect(activeLink).toHaveAttribute("href", "/?status=active");
    });

    it("renders Stalled stat as a link to /?status=stalled", () => {
      render(
        <RightPanel
          stats={defaultStats}
          recentActivity={defaultActivity}
          alerts={defaultAlerts}
        />,
      );

      const stalledLink = screen.getByRole("link", { name: /3.*stalled/i });
      expect(stalledLink).toHaveAttribute("href", "/?status=stalled");
    });

    it("renders Complete stat as a link to /?status=complete", () => {
      render(
        <RightPanel
          stats={defaultStats}
          recentActivity={defaultActivity}
          alerts={defaultAlerts}
        />,
      );

      const completeLink = screen.getByRole("link", { name: /10.*complete/i });
      expect(completeLink).toHaveAttribute("href", "/?status=complete");
    });

    it("renders Tasks stat without a link", () => {
      render(
        <RightPanel
          stats={defaultStats}
          recentActivity={defaultActivity}
          alerts={defaultAlerts}
        />,
      );

      // Tasks should not be a link
      const tasksText = screen.getByText("Tasks");
      expect(tasksText.closest("a")).toBeNull();
    });
  });

  describe("stats display", () => {
    it("displays all stat values correctly", () => {
      render(
        <RightPanel
          stats={defaultStats}
          recentActivity={defaultActivity}
          alerts={defaultAlerts}
        />,
      );

      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
    });
  });

  describe("tab navigation", () => {
    it("renders three folder tabs (Overview, Activity, Chat)", () => {
      render(
        <RightPanel
          stats={defaultStats}
          recentActivity={defaultActivity}
          alerts={defaultAlerts}
        />,
      );
      expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Activity" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Chat" })).toBeInTheDocument();
    });

    it("starts on the Overview tab", () => {
      render(
        <RightPanel
          stats={defaultStats}
          recentActivity={defaultActivity}
          alerts={defaultAlerts}
        />,
      );
      expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByText("5")).toBeInTheDocument(); // active stat visible
    });

    it("switches to Activity pane and shows recent activity heading", async () => {
      const { fireEvent } = await import("@testing-library/react");
      render(
        <RightPanel
          stats={defaultStats}
          recentActivity={defaultActivity}
          alerts={defaultAlerts}
        />,
      );
      fireEvent.click(screen.getByRole("tab", { name: "Activity" }));
      expect(screen.getByText("Recent Activity")).toBeInTheDocument();
      expect(screen.getByText("No recent activity.")).toBeInTheDocument();
    });

    it("switches to Chat pane and shows the agent council + compose box", async () => {
      const { fireEvent } = await import("@testing-library/react");
      render(
        <RightPanel
          stats={defaultStats}
          recentActivity={defaultActivity}
          alerts={defaultAlerts}
        />,
      );
      fireEvent.click(screen.getByRole("tab", { name: "Chat" }));
      expect(screen.getByText("Agents on duty")).toBeInTheDocument();
      expect(screen.getByText("Sage")).toBeInTheDocument();
      expect(screen.getByText("Moss")).toBeInTheDocument();
      expect(screen.getByText("Send a note")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(
          "(visual only — chat backend not yet wired)",
        ),
      ).toBeDisabled();
    });

    it("Chat pane displays whisper trace when activity is provided", async () => {
      const { fireEvent } = await import("@testing-library/react");
      render(
        <RightPanel
          stats={defaultStats}
          recentActivity={[
            {
              type: "session_started",
              title: "Started cozy refactor",
              projectName: "prd-board",
              projectSlug: "prd-board",
              timestamp: new Date().toISOString(),
            },
          ]}
          alerts={defaultAlerts}
        />,
      );
      fireEvent.click(screen.getByRole("tab", { name: "Chat" }));
      expect(screen.getByText("Whispers from the trail")).toBeInTheDocument();
      expect(
        screen.getByText("prd-board: Started cozy refactor"),
      ).toBeInTheDocument();
    });
  });
});
