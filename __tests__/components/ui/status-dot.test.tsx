import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { StatusDot } from "@/components/ui/status-dot";

describe("StatusDot", () => {
  afterEach(cleanup);

  it.each([
    ["running", "Running"],
    ["draft", "Draft"],
    ["blocked", "Blocked"],
    ["idle", "Idle"],
    ["archived", "Archived"],
  ] as const)("renders state=%s with class and aria-label", (state, label) => {
    render(<StatusDot state={state} />);
    const dot = screen.getByLabelText(label);
    expect(dot).toHaveClass("status-dot");
    expect(dot).toHaveClass(`status-dot-${state}`);
    expect(dot).toHaveAttribute("data-state", state);
    expect(dot).toHaveAttribute("role", "img");
  });

  it("pulses by default when state is running", () => {
    render(<StatusDot state="running" />);
    const dot = screen.getByLabelText("Running");
    expect(dot).toHaveClass("status-dot-pulse");
  });

  it("does not pulse by default for non-running states", () => {
    render(<StatusDot state="idle" />);
    const dot = screen.getByLabelText("Idle");
    expect(dot).not.toHaveClass("status-dot-pulse");
  });

  it("respects pulse=false override on running", () => {
    render(<StatusDot state="running" pulse={false} />);
    const dot = screen.getByLabelText("Running");
    expect(dot).not.toHaveClass("status-dot-pulse");
  });

  it("respects pulse=true override on idle", () => {
    render(<StatusDot state="idle" pulse />);
    const dot = screen.getByLabelText("Idle");
    expect(dot).toHaveClass("status-dot-pulse");
  });

  it("uses custom label when provided", () => {
    render(<StatusDot state="running" label="Build progressing" />);
    expect(screen.getByLabelText("Build progressing")).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(<StatusDot state="draft" className="extra-class" />);
    const dot = screen.getByLabelText("Draft");
    expect(dot).toHaveClass("extra-class");
    expect(dot).toHaveClass("status-dot");
  });
});
