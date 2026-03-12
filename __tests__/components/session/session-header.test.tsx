import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { SessionHeader } from "@/components/session/session-header";

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

const defaultProps = {
  sessionId: "s_2026-03-09_auth-refactor",
  status: "in-progress",
  roadmapRef: "r_abc12",
  started: "2026-03-09T10:00:00-07:00",
  lastUpdated: "2026-03-09T14:30:00-07:00",
  slug: "my-project",
  onStatusChange: vi.fn(),
};

describe("SESS-01: SessionHeader", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders session ID", () => {
    render(<SessionHeader {...defaultProps} />);
    expect(screen.getByText("s_2026-03-09_auth-refactor")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<SessionHeader {...defaultProps} />);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("renders roadmap reference link", () => {
    render(<SessionHeader {...defaultProps} />);
    const link = screen.getByRole("link", { name: /r_abc12/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/project/my-project/roadmap");
  });

  it("renders started timestamp", () => {
    render(<SessionHeader {...defaultProps} />);
    expect(screen.getByText("Started")).toBeInTheDocument();
    // RelativeTime renders <time> elements
    const timeElements = screen.getAllByTestId("relative-time");
    expect(timeElements.length).toBeGreaterThanOrEqual(1);
  });

  it("renders last updated timestamp", () => {
    render(<SessionHeader {...defaultProps} />);
    expect(screen.getByText("Last updated")).toBeInTheDocument();
    const timeElements = screen.getAllByTestId("relative-time");
    expect(timeElements.length).toBeGreaterThanOrEqual(2);
  });
});
