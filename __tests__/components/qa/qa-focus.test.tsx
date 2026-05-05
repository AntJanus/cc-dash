import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

const { mockApprove, mockFail, mockSkip, mockDecision } = vi.hoisted(() => ({
  mockApprove: vi.fn(),
  mockFail: vi.fn(),
  mockSkip: vi.fn(),
  mockDecision: vi.fn(),
}));
vi.mock("@/lib/actions/qa-actions", () => ({
  approveQaItem: mockApprove,
  failQaItem: mockFail,
  skipQaItem: mockSkip,
  markQaNeedsDecision: mockDecision,
  resetQaItem: vi.fn(),
}));

const { mockRefresh, mockPush } = vi.hoisted(() => ({
  mockRefresh: vi.fn(),
  mockPush: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: mockPush }),
}));

import { QaFocus } from "@/components/qa/qa-focus";
import type { QaFile, QaItem } from "@/lib/schemas/qa";

function makeItem(overrides: Partial<QaItem>): QaItem {
  return {
    id: "q_aaaaa",
    status: "pending",
    description: "First check",
    ...overrides,
  };
}

function makeQa(items: QaItem[]): QaFile {
  return {
    schema: "cc-dash/qa@1",
    project: "p",
    last_updated: "2026-05-04T10:00:00Z",
    setup: "",
    items,
    filePath: "/p/QA.md",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApprove.mockResolvedValue({ success: true, data: undefined });
  mockFail.mockResolvedValue({
    success: true,
    data: { roadmapItemId: "r_zzzzz" },
  });
  mockSkip.mockResolvedValue({ success: true, data: undefined });
  mockDecision.mockResolvedValue({ success: true, data: undefined });
});

describe("QaFocus", () => {
  afterEach(() => cleanup());

  const items = [
    makeItem({ id: "q_aaaaa", description: "First" }),
    makeItem({ id: "q_bbbbb", description: "Second" }),
    makeItem({ id: "q_ccccc", description: "Third" }),
  ];

  it("renders the item resolved from initialFocusId", () => {
    render(
      <QaFocus
        qa={makeQa(items)}
        slug="p"
        hasRoadmap
        initialFocusId="q_bbbbb"
      />,
    );
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("Item 2 of 3")).toBeInTheDocument();
  });

  it("falls back to the first item when initialFocusId does not exist", () => {
    render(
      <QaFocus
        qa={makeQa(items)}
        slug="p"
        hasRoadmap
        initialFocusId="q_zzzzz"
      />,
    );
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Item 1 of 3")).toBeInTheDocument();
  });

  it("Approve advances to the next pending item", async () => {
    render(
      <QaFocus
        qa={makeQa(items)}
        slug="p"
        hasRoadmap
        initialFocusId="q_aaaaa"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Approve/ }));
    await new Promise((r) => setTimeout(r, 0));
    expect(mockApprove).toHaveBeenCalledWith("p", "q_aaaaa");
    expect(mockRefresh).toHaveBeenCalled();
    // After advancing, the visible description should now be "Second"
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("Skip advances to the next pending item", async () => {
    render(
      <QaFocus
        qa={makeQa(items)}
        slug="p"
        hasRoadmap
        initialFocusId="q_aaaaa"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Skip/ }));
    await new Promise((r) => setTimeout(r, 0));
    expect(mockSkip).toHaveBeenCalled();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("Next/Previous buttons navigate without calling actions", () => {
    render(
      <QaFocus
        qa={makeQa(items)}
        slug="p"
        hasRoadmap
        initialFocusId="q_aaaaa"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Next/ }));
    expect(screen.getByText("Second")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Previous/ }));
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(mockApprove).not.toHaveBeenCalled();
    expect(mockSkip).not.toHaveBeenCalled();
  });

  it("disables Fail when hasRoadmap is false", () => {
    render(
      <QaFocus
        qa={makeQa(items)}
        slug="p"
        hasRoadmap={false}
        initialFocusId="q_aaaaa"
      />,
    );
    expect(screen.getByRole("button", { name: /^Fail/ })).toBeDisabled();
  });

  it("Exit button navigates back to the project QA list view", () => {
    render(
      <QaFocus
        qa={makeQa(items)}
        slug="p"
        hasRoadmap
        initialFocusId="q_aaaaa"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Exit focus mode" }));
    expect(mockPush).toHaveBeenCalledWith("/project/p/qa");
  });

  it("keyboard 'a' triggers Approve", async () => {
    render(
      <QaFocus
        qa={makeQa(items)}
        slug="p"
        hasRoadmap
        initialFocusId="q_aaaaa"
      />,
    );
    fireEvent.keyDown(window, { key: "a" });
    await new Promise((r) => setTimeout(r, 0));
    expect(mockApprove).toHaveBeenCalledWith("p", "q_aaaaa");
  });

  it("keyboard 'n' moves to next item without acting", () => {
    render(
      <QaFocus
        qa={makeQa(items)}
        slug="p"
        hasRoadmap
        initialFocusId="q_aaaaa"
      />,
    );
    fireEvent.keyDown(window, { key: "n" });
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("keyboard 'Escape' navigates back to list", () => {
    render(
      <QaFocus
        qa={makeQa(items)}
        slug="p"
        hasRoadmap
        initialFocusId="q_aaaaa"
      />,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(mockPush).toHaveBeenCalledWith("/project/p/qa");
  });

  it("renders empty-state when QA file has no items", () => {
    render(
      <QaFocus qa={makeQa([])} slug="p" hasRoadmap initialFocusId="q_aaaaa" />,
    );
    expect(screen.getByText("No QA items to focus on.")).toBeInTheDocument();
  });

  it("does not show Approve when focused item is non-pending", () => {
    render(
      <QaFocus
        qa={makeQa([
          makeItem({
            id: "q_aaaaa",
            status: "passed",
            description: "Already done",
            at: "2026-05-04T10:00:00Z",
          }),
        ])}
        slug="p"
        hasRoadmap
        initialFocusId="q_aaaaa"
      />,
    );
    expect(
      screen.queryByRole("button", { name: /^Approve/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/already passed/)).toBeInTheDocument();
  });
});
