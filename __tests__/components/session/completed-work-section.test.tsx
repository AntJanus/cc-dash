import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { CompletedWorkSection } from "@/components/session/completed-work-section";
import type { CompletionEntry } from "@/lib/schemas/session";

const taskNames: Record<string, string> = {
  t_abc12: "Implement auth",
  t_def34: "Setup database",
};

describe("SESS-13: CompletedWorkSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders completed work entries", () => {
    const work: CompletionEntry[] = [
      {
        taskRef: "t_abc12",
        timestamp: "2026-03-09T11:00:00-07:00",
        description: "Auth module completed with JWT",
      },
    ];
    render(<CompletedWorkSection completedWork={work} taskNames={taskNames} />);
    expect(
      screen.getByText("Auth module completed with JWT"),
    ).toBeInTheDocument();
  });

  it("renders timestamp for each entry", () => {
    const work: CompletionEntry[] = [
      {
        taskRef: "t_abc12",
        timestamp: "2026-03-09T11:00:00-07:00",
        description: "Auth done",
      },
    ];
    render(<CompletedWorkSection completedWork={work} taskNames={taskNames} />);
    // RelativeTime renders <time> element
    const timeEl = screen.getByTestId("relative-time");
    expect(timeEl).toBeInTheDocument();
    expect(timeEl).toHaveAttribute("datetime", "2026-03-09T11:00:00-07:00");
  });

  it("renders task reference for each entry", () => {
    const work: CompletionEntry[] = [
      {
        taskRef: "t_def34",
        timestamp: "2026-03-09T12:00:00-07:00",
        description: "DB setup complete",
      },
    ];
    render(<CompletedWorkSection completedWork={work} taskNames={taskNames} />);
    expect(screen.getByText("Setup database")).toBeInTheDocument();
  });

  it("renders empty state when no completed work", () => {
    render(<CompletedWorkSection completedWork={[]} taskNames={taskNames} />);
    expect(screen.getByText("No completed work recorded")).toBeInTheDocument();
  });
});
