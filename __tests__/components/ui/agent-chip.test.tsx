import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AgentChip } from "@/components/ui/agent-chip";

describe("AgentChip", () => {
  afterEach(cleanup);

  it("renders the agent name", () => {
    render(<AgentChip name="Sage" />);
    expect(screen.getByText("Sage")).toBeInTheDocument();
  });

  it("derives single-word initials as the first letter, uppercased", () => {
    render(<AgentChip name="moss" />);
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("derives two-word initials as first + last letters", () => {
    render(<AgentChip name="claude opus" />);
    expect(screen.getByText("CO")).toBeInTheDocument();
  });

  it("uses custom initials when provided", () => {
    render(<AgentChip name="Whatever" initials="GP" />);
    expect(screen.getByText("GP")).toBeInTheDocument();
  });

  it("renders an avatar image when avatarUrl is provided", () => {
    render(<AgentChip name="Sage" avatarUrl="/avatar.png" />);
    const root = screen.getByText("Sage").closest("[data-slot=agent-chip]");
    const img = root?.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", "/avatar.png");
  });

  it("renders a status dot when state is provided", () => {
    render(<AgentChip name="Sage" state="running" />);
    expect(screen.getByLabelText("Running")).toBeInTheDocument();
  });

  it("does not render a status dot when state is omitted", () => {
    render(<AgentChip name="Sage" />);
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("marks itself active when state=running", () => {
    render(<AgentChip name="Sage" state="running" />);
    const root = screen.getByText("Sage").closest("[data-slot=agent-chip]");
    expect(root).toHaveAttribute("data-active", "true");
    expect(root).toHaveClass("agent-chip-active");
  });

  it("can be forced inactive even when state=running via active=false", () => {
    render(<AgentChip name="Sage" state="running" active={false} />);
    const root = screen.getByText("Sage").closest("[data-slot=agent-chip]");
    expect(root).toHaveAttribute("data-active", "false");
    expect(root).not.toHaveClass("agent-chip-active");
  });

  it("falls back to ? for empty name", () => {
    render(<AgentChip name="   " />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("merges custom className on the root", () => {
    render(<AgentChip name="Sage" className="extra-class" />);
    const root = screen.getByText("Sage").closest("[data-slot=agent-chip]");
    expect(root).toHaveClass("agent-chip");
    expect(root).toHaveClass("extra-class");
  });
});
