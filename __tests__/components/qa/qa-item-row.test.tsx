import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// next/link is a server component shim; render it as an anchor for tests.
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

import { QaItemRow } from "@/components/qa/qa-item-row";
import type { QaItem } from "@/lib/schemas/qa";

function makeItem(overrides: Partial<QaItem> = {}): QaItem {
  return {
    id: "q_aaaaa",
    status: "pending",
    description: "Verify install flow works end-to-end",
    ...overrides,
  };
}

describe("QaItemRow", () => {
  afterEach(() => cleanup());

  it("renders the description and the status badge", () => {
    render(<QaItemRow slug="my-proj" item={makeItem()} />);
    expect(
      screen.getByText("Verify install flow works end-to-end"),
    ).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("does not render a timestamp when item is pending", () => {
    render(<QaItemRow slug="my-proj" item={makeItem()} />);
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument();
  });

  it("renders the formatted timestamp when `at` is set", () => {
    render(
      <QaItemRow
        slug="my-proj"
        item={makeItem({
          status: "passed",
          at: "2026-05-04T10:15:00Z",
        })}
      />,
    );
    // toLocaleString produces a string that contains "2026" — exact format is locale-dependent
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it("renders the roadmap-ref link to the project's roadmap page when failed", () => {
    render(
      <QaItemRow
        slug="my-proj"
        item={makeItem({
          status: "failed",
          at: "2026-05-04T10:20:00Z",
          roadmapRef: "r_xyz12",
        })}
      />,
    );
    const link = screen.getByRole("link", { name: /r_xyz12/ });
    expect(link).toHaveAttribute("href", "/project/my-proj/roadmap");
  });

  it("renders the note as a blockquote when present", () => {
    render(
      <QaItemRow
        slug="my-proj"
        item={makeItem({
          status: "failed",
          at: "2026-05-04T10:20:00Z",
          roadmapRef: "r_xyz12",
          note: "Saw error X — see log line 42.",
        })}
      />,
    );
    const note = screen.getByText(/Saw error X/);
    expect(note.tagName.toLowerCase()).toBe("blockquote");
  });

  it("renders custom action node when provided", () => {
    render(
      <QaItemRow
        slug="my-proj"
        item={makeItem()}
        actions={<button>Approve</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
  });
});
