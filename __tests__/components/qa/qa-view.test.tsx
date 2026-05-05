import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Stub the client-side actions row so QaView's structural tests do not
// transitively pull in next/navigation or the server-action wiring.
vi.mock("@/components/qa/qa-actions-row", () => ({
  QaActionsRow: () => <span data-testid="qa-actions-row" />,
}));

import { QaView } from "@/components/qa/qa-view";
import type { QaFile, QaItem } from "@/lib/schemas/qa";

function makeQa(items: QaItem[] = [], setup = "Run: `make test`"): QaFile {
  return {
    schema: "cc-dash/qa@1",
    project: "test-proj",
    last_updated: "2026-05-04T10:00:00Z",
    setup,
    items,
    filePath: "/p/QA.md",
  };
}

describe("QaView", () => {
  afterEach(() => cleanup());

  it("shows the setup section verbatim when present", () => {
    render(
      <QaView
        qa={makeQa([], "Run: `npm test`\nThen: `npm run lint`")}
        slug="test-proj"
        hasRoadmap
      />,
    );
    expect(screen.getByText(/npm test/)).toBeInTheDocument();
    expect(screen.getByText(/npm run lint/)).toBeInTheDocument();
  });

  it("hides the Setup section heading when setup is empty", () => {
    render(<QaView qa={makeQa([], "")} slug="test-proj" hasRoadmap />);
    expect(screen.queryByText("Setup")).not.toBeInTheDocument();
  });

  it("shows the empty-state message when no items exist", () => {
    render(<QaView qa={makeQa([])} slug="test-proj" hasRoadmap />);
    expect(
      screen.getByText("No QA items in this file yet."),
    ).toBeInTheDocument();
  });

  it("tallies counts in the header", () => {
    const items: QaItem[] = [
      { id: "q_aaaaa", status: "pending", description: "A" },
      {
        id: "q_bbbbb",
        status: "passed",
        description: "B",
        at: "2026-05-04T10:00:00Z",
      },
      {
        id: "q_ccccc",
        status: "failed",
        description: "C",
        at: "2026-05-04T10:00:00Z",
      },
    ];
    render(<QaView qa={makeQa(items)} slug="test-proj" hasRoadmap />);
    expect(screen.getByText("2")).toBeInTheDocument(); // completed
    expect(screen.getByText(/of 3 reviewed/)).toBeInTheDocument();
    expect(screen.getByText(/1 pending/)).toBeInTheDocument();
    expect(screen.getByText(/1 passed/)).toBeInTheDocument();
    expect(screen.getByText(/1 failed/)).toBeInTheDocument();
  });

  it("warns when the project has no ROADMAP.md and pending items remain", () => {
    const items: QaItem[] = [
      { id: "q_aaaaa", status: "pending", description: "A" },
    ];
    render(<QaView qa={makeQa(items)} slug="test-proj" hasRoadmap={false} />);
    expect(
      screen.getByText(/This project has no ROADMAP\.md/),
    ).toBeInTheDocument();
  });

  it("does NOT warn when no pending items remain even without a roadmap", () => {
    const items: QaItem[] = [
      {
        id: "q_aaaaa",
        status: "passed",
        description: "A",
        at: "2026-05-04T10:00:00Z",
      },
    ];
    render(<QaView qa={makeQa(items)} slug="test-proj" hasRoadmap={false} />);
    expect(
      screen.queryByText(/This project has no ROADMAP\.md/),
    ).not.toBeInTheDocument();
  });

  it("renders all items as rows", () => {
    const items: QaItem[] = [
      { id: "q_aaaaa", status: "pending", description: "Check ABC" },
      { id: "q_bbbbb", status: "pending", description: "Check XYZ" },
    ];
    render(<QaView qa={makeQa(items)} slug="test-proj" hasRoadmap />);
    expect(screen.getByText("Check ABC")).toBeInTheDocument();
    expect(screen.getByText("Check XYZ")).toBeInTheDocument();
  });
});
