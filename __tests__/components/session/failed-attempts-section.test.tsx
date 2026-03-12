import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { FailedAttemptsSection } from "@/components/session/failed-attempts-section";
import type { FailedAttempt } from "@/lib/schemas/session";

const taskNames: Record<string, string> = {
  t_abc12: "Implement auth",
  t_def34: "Setup database",
};

describe("SESS-12: FailedAttemptsSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders list of failed attempts", () => {
    const attempts: FailedAttempt[] = [
      {
        id: "f_xyz99",
        taskRef: "t_abc12",
        description: "JWT validation failed due to wrong secret",
      },
    ];
    render(
      <FailedAttemptsSection failedAttempts={attempts} taskNames={taskNames} />,
    );
    expect(
      screen.getByText("JWT validation failed due to wrong secret"),
    ).toBeInTheDocument();
  });

  it("renders task reference for each attempt", () => {
    const attempts: FailedAttempt[] = [
      {
        id: "f_xyz99",
        taskRef: "t_abc12",
        description: "Attempt failed",
      },
    ];
    render(
      <FailedAttemptsSection failedAttempts={attempts} taskNames={taskNames} />,
    );
    // Should resolve task reference to name
    expect(screen.getByText("Implement auth")).toBeInTheDocument();
  });

  it("resolves task reference to task name via lookup", () => {
    const attempts: FailedAttempt[] = [
      {
        id: "f_xyz99",
        taskRef: "t_def34",
        description: "Connection string was wrong",
      },
    ];
    render(
      <FailedAttemptsSection failedAttempts={attempts} taskNames={taskNames} />,
    );
    expect(screen.getByText("Setup database")).toBeInTheDocument();
  });

  it("renders empty state when no failed attempts", () => {
    render(<FailedAttemptsSection failedAttempts={[]} taskNames={taskNames} />);
    expect(screen.getByText("No failed attempts")).toBeInTheDocument();
  });
});
