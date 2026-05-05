import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

const { mockApprove, mockFail, mockSkip, mockDecision, mockReset } = vi.hoisted(
  () => ({
    mockApprove: vi.fn(),
    mockFail: vi.fn(),
    mockSkip: vi.fn(),
    mockDecision: vi.fn(),
    mockReset: vi.fn(),
  }),
);
vi.mock("@/lib/actions/qa-actions", () => ({
  approveQaItem: mockApprove,
  failQaItem: mockFail,
  skipQaItem: mockSkip,
  markQaNeedsDecision: mockDecision,
  resetQaItem: mockReset,
}));

const { mockRefresh } = vi.hoisted(() => ({ mockRefresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

import { QaActionsRow } from "@/components/qa/qa-actions-row";

beforeEach(() => {
  vi.clearAllMocks();
  mockApprove.mockResolvedValue({ success: true, data: undefined });
  mockFail.mockResolvedValue({
    success: true,
    data: { roadmapItemId: "r_zzzzz" },
  });
  mockSkip.mockResolvedValue({ success: true, data: undefined });
  mockDecision.mockResolvedValue({ success: true, data: undefined });
  mockReset.mockResolvedValue({ success: true, data: undefined });
});

describe("QaActionsRow — pending", () => {
  afterEach(() => cleanup());

  it("renders Approve / Fail / Decision / Skip when pending", () => {
    render(
      <QaActionsRow slug="p" itemId="q_aaaaa" status="pending" hasRoadmap />,
    );
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fail" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Needs decision" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip" })).toBeInTheDocument();
  });

  it("calls approveQaItem and refreshes on Approve click", async () => {
    render(
      <QaActionsRow slug="p" itemId="q_aaaaa" status="pending" hasRoadmap />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    await new Promise((r) => setTimeout(r, 0));
    expect(mockApprove).toHaveBeenCalledWith("p", "q_aaaaa");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("disables Fail when hasRoadmap is false", () => {
    render(
      <QaActionsRow
        slug="p"
        itemId="q_aaaaa"
        status="pending"
        hasRoadmap={false}
      />,
    );
    expect(screen.getByRole("button", { name: "Fail" })).toBeDisabled();
  });

  it("opens the fail dialog and submits with the typed note", async () => {
    render(
      <QaActionsRow slug="p" itemId="q_aaaaa" status="pending" hasRoadmap />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Fail" }));
    fireEvent.change(screen.getByLabelText("Note"), {
      target: { value: "Saw error X" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Fail and file issue" }),
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(mockFail).toHaveBeenCalledWith("p", "q_aaaaa", "Saw error X");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("opens the decision dialog and submits with note", async () => {
    render(
      <QaActionsRow slug="p" itemId="q_aaaaa" status="pending" hasRoadmap />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Needs decision" }));
    fireEvent.change(screen.getByLabelText("Note"), {
      target: { value: "Design conversation needed" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Mark needs-decision" }),
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(mockDecision).toHaveBeenCalledWith(
      "p",
      "q_aaaaa",
      "Design conversation needed",
    );
  });

  it("calls skipQaItem and refreshes on Skip click", async () => {
    render(
      <QaActionsRow slug="p" itemId="q_aaaaa" status="pending" hasRoadmap />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    await new Promise((r) => setTimeout(r, 0));
    expect(mockSkip).toHaveBeenCalledWith("p", "q_aaaaa");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("surfaces an error message inline when an action fails", async () => {
    mockApprove.mockResolvedValueOnce({
      success: false,
      errors: [{ field: "x", message: "Boom", received: null }],
    });
    render(
      <QaActionsRow slug="p" itemId="q_aaaaa" status="pending" hasRoadmap />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.getByText("Boom")).toBeInTheDocument();
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});

describe("QaActionsRow — non-pending", () => {
  afterEach(() => cleanup());

  it("shows only the Reset button when status is passed", () => {
    render(
      <QaActionsRow slug="p" itemId="q_aaaaa" status="passed" hasRoadmap />,
    );
    expect(
      screen.getByRole("button", { name: "Reset to pending" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Approve" }),
    ).not.toBeInTheDocument();
  });

  it("calls resetQaItem and refreshes on Reset click", async () => {
    render(
      <QaActionsRow slug="p" itemId="q_aaaaa" status="failed" hasRoadmap />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Reset to pending" }));
    await new Promise((r) => setTimeout(r, 0));
    expect(mockReset).toHaveBeenCalledWith("p", "q_aaaaa");
    expect(mockRefresh).toHaveBeenCalled();
  });
});
