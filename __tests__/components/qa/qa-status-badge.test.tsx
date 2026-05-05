import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QaStatusBadge } from "@/components/qa/qa-status-badge";

describe("QaStatusBadge", () => {
  afterEach(() => cleanup());

  it.each([
    ["pending", "Pending"],
    ["passed", "Passed"],
    ["failed", "Failed"],
    ["needs-decision", "Needs decision"],
    ["skipped", "Skipped"],
  ] as const)("renders the human label for status %s", (status, label) => {
    render(<QaStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("merges a custom className alongside the variant classes", () => {
    const { container } = render(
      <QaStatusBadge status="pending" className="custom-extra" />,
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("custom-extra");
  });
});
