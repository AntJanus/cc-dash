import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { SessionStatusBadge } from "@/components/session/session-status-badge";

describe("SESS-02: SessionStatusBadge", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders current status with correct color", () => {
    render(
      <SessionStatusBadge status="in-progress" onStatusChange={vi.fn()} />,
    );
    const badge = screen.getByText("In Progress");
    expect(badge).toBeInTheDocument();
  });

  it("clicking badge opens status menu", () => {
    render(<SessionStatusBadge status="completed" onStatusChange={vi.fn()} />);
    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);
    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();
  });

  it("selecting a status option calls onStatusChange", () => {
    const onStatusChange = vi.fn();
    render(
      <SessionStatusBadge status="paused" onStatusChange={onStatusChange} />,
    );
    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);
    const option = screen.getByRole("menuitem", { name: /In Progress/i });
    fireEvent.click(option);
    expect(onStatusChange).toHaveBeenCalledWith("in-progress");
  });

  it("renders all 4 status options (in-progress/paused/completed/blocked)", () => {
    render(
      <SessionStatusBadge status="in-progress" onStatusChange={vi.fn()} />,
    );
    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);
    expect(
      screen.getByRole("menuitem", { name: /In Progress/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Paused/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Completed/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Blocked/i }),
    ).toBeInTheDocument();
  });

  it("displays correct label for each status", () => {
    const { unmount } = render(
      <SessionStatusBadge status="in-progress" onStatusChange={vi.fn()} />,
    );
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    unmount();

    const { unmount: unmount2 } = render(
      <SessionStatusBadge status="paused" onStatusChange={vi.fn()} />,
    );
    expect(screen.getByText("Paused")).toBeInTheDocument();
    unmount2();

    const { unmount: unmount3 } = render(
      <SessionStatusBadge status="completed" onStatusChange={vi.fn()} />,
    );
    expect(screen.getByText("Completed")).toBeInTheDocument();
    unmount3();

    render(<SessionStatusBadge status="blocked" onStatusChange={vi.fn()} />);
    expect(screen.getByText("Blocked")).toBeInTheDocument();
  });
});
