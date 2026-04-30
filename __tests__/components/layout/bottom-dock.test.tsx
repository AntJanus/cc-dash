import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { BottomDock } from "@/components/layout/bottom-dock";

const TRACE = [
  {
    hash: "abc123",
    date: new Date(Date.now() - 10 * 60_000).toISOString(),
    agentName: "Claude",
    projectName: "alpha-app",
    projectSlug: "alpha-app",
    subject: "feat: add level loader",
  },
  {
    hash: "def456",
    date: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
    agentName: "Claude",
    projectName: "project-beta",
    projectSlug: "project-beta",
    subject: "fix: skill manifest validation",
  },
];

const ACTIVE = [
  {
    slug: "alpha-app",
    name: "alpha-app",
    commitCount: 12,
    lastActive: new Date(Date.now() - 10 * 60_000).toISOString(),
  },
  {
    slug: "project-beta",
    name: "project-beta",
    commitCount: 4,
    lastActive: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
  },
];

describe("BottomDock", () => {
  afterEach(cleanup);

  it("renders the three folder tabs", () => {
    render(<BottomDock trace={TRACE} active={ACTIVE} />);
    expect(screen.getByRole("tab", { name: "Tool Trace" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Most Active" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Quick Filters" }),
    ).toBeInTheDocument();
  });

  it("starts collapsed (no body content visible)", () => {
    const { container } = render(<BottomDock trace={TRACE} active={ACTIVE} />);
    const dock = container.querySelector("[data-slot=bottom-dock]");
    expect(dock).toHaveAttribute("data-expanded", "false");
    // No tool-trace panel rendered when collapsed
    expect(container.querySelector("[data-slot=tool-trace]")).toBeNull();
  });

  it("expands and shows trace pane when Tool Trace tab is clicked", () => {
    render(<BottomDock trace={TRACE} active={ACTIVE} />);
    fireEvent.click(screen.getByRole("tab", { name: "Tool Trace" }));
    expect(
      screen.getByText("alpha-app: feat: add level loader"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("project-beta: fix: skill manifest validation"),
    ).toBeInTheDocument();
  });

  it("switches to Most Active pane", () => {
    render(<BottomDock trace={TRACE} active={ACTIVE} />);
    fireEvent.click(screen.getByRole("tab", { name: "Most Active" }));
    // Active project names render as agent chips
    expect(screen.getAllByText("alpha-app").length).toBeGreaterThan(0);
    expect(screen.getAllByText("project-beta").length).toBeGreaterThan(0);
    // Commit-count meta shows
    expect(screen.getByText(/12 commits/)).toBeInTheDocument();
    expect(screen.getByText(/4 commits/)).toBeInTheDocument();
  });

  it("switches to Quick Filters pane", () => {
    render(<BottomDock trace={TRACE} active={ACTIVE} />);
    fireEvent.click(screen.getByRole("tab", { name: "Quick Filters" }));
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Stalled")).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.getByText("Jump to")).toBeInTheDocument();
  });

  it("collapse button toggles expanded state", () => {
    const { container } = render(<BottomDock trace={TRACE} active={ACTIVE} />);
    const dock = container.querySelector("[data-slot=bottom-dock]")!;
    const toggle = screen.getByLabelText("Expand dock");
    fireEvent.click(toggle);
    expect(dock).toHaveAttribute("data-expanded", "true");
    fireEvent.click(screen.getByLabelText("Collapse dock"));
    expect(dock).toHaveAttribute("data-expanded", "false");
  });

  it("renders the empty trace message when no commits are passed", () => {
    render(<BottomDock trace={[]} active={ACTIVE} />);
    fireEvent.click(screen.getByRole("tab", { name: "Tool Trace" }));
    expect(
      screen.getByText("No agent commits in the recent log."),
    ).toBeInTheDocument();
  });

  it("renders the empty active message when no projects are passed", () => {
    render(<BottomDock trace={TRACE} active={[]} />);
    fireEvent.click(screen.getByRole("tab", { name: "Most Active" }));
    expect(screen.getByText("No recent project activity.")).toBeInTheDocument();
  });
});
