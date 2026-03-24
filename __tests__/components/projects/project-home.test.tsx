import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { ProjectHome } from "@/components/projects/project-home";
import type { ProjectCardData } from "@/lib/projects/get-projects";

// Mock next/navigation
const mockPush = vi.fn();
const mockSearchParams = vi.hoisted(() => ({
  get: vi.fn().mockReturnValue(null),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: mockPush }),
}));

const testProjects: ProjectCardData[] = [
  {
    slug: "project-a",
    name: "Project A",
    description: "An active project",
    status: "active",
    hasActiveSession: true,
    totalCount: 10,
    doneCount: 5,
    lastUpdated: "2026-03-20T10:00:00Z",
  },
  {
    slug: "project-b",
    name: "Project B",
    description: "A stalled project",
    status: "stalled",
    hasActiveSession: false,
    totalCount: 8,
    doneCount: 2,
    lastUpdated: "2026-03-15T10:00:00Z",
  },
  {
    slug: "project-c",
    name: "Project C",
    description: "A complete project",
    status: "complete",
    hasActiveSession: false,
    totalCount: 5,
    doneCount: 5,
    lastUpdated: "2026-03-10T10:00:00Z",
  },
];

describe("ProjectHome", () => {
  beforeEach(() => {
    mockSearchParams.get.mockReturnValue(null);
    mockPush.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  describe("status filtering", () => {
    it("shows all projects when no status filter is set", () => {
      render(<ProjectHome projects={testProjects} />);

      expect(screen.getByText("Project A")).toBeInTheDocument();
      expect(screen.getByText("Project B")).toBeInTheDocument();
      expect(screen.getByText("Project C")).toBeInTheDocument();
    });

    it("filters to active projects when status=active", () => {
      mockSearchParams.get.mockReturnValue("active");
      render(<ProjectHome projects={testProjects} />);

      expect(screen.getByText("Project A")).toBeInTheDocument();
      expect(screen.queryByText("Project B")).not.toBeInTheDocument();
      expect(screen.queryByText("Project C")).not.toBeInTheDocument();
    });

    it("filters to stalled projects when status=stalled", () => {
      mockSearchParams.get.mockReturnValue("stalled");
      render(<ProjectHome projects={testProjects} />);

      expect(screen.queryByText("Project A")).not.toBeInTheDocument();
      expect(screen.getByText("Project B")).toBeInTheDocument();
      expect(screen.queryByText("Project C")).not.toBeInTheDocument();
    });

    it("filters to complete projects when status=complete", () => {
      mockSearchParams.get.mockReturnValue("complete");
      render(<ProjectHome projects={testProjects} />);

      expect(screen.queryByText("Project A")).not.toBeInTheDocument();
      expect(screen.queryByText("Project B")).not.toBeInTheDocument();
      expect(screen.getByText("Project C")).toBeInTheDocument();
    });

    it("ignores invalid status values", () => {
      mockSearchParams.get.mockReturnValue("invalid");
      render(<ProjectHome projects={testProjects} />);

      // Should show all projects
      expect(screen.getByText("Project A")).toBeInTheDocument();
      expect(screen.getByText("Project B")).toBeInTheDocument();
      expect(screen.getByText("Project C")).toBeInTheDocument();
    });
  });

  describe("filter badge", () => {
    it("does not show filter badge when no filter is active", () => {
      render(<ProjectHome projects={testProjects} />);

      expect(
        screen.queryByRole("button", { name: /active/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /stalled/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /complete/i }),
      ).not.toBeInTheDocument();
    });

    it("shows filter badge when status filter is active", () => {
      mockSearchParams.get.mockReturnValue("stalled");
      render(<ProjectHome projects={testProjects} />);

      expect(
        screen.getByRole("button", { name: /stalled/i }),
      ).toBeInTheDocument();
    });

    it("clears filter when badge is clicked", () => {
      mockSearchParams.get.mockReturnValue("stalled");
      render(<ProjectHome projects={testProjects} />);

      const badge = screen.getByRole("button", { name: /stalled/i });
      fireEvent.click(badge);

      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });
});
