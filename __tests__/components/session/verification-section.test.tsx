import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { VerificationSection } from "@/components/session/verification-section";
import type { UnknownSection } from "@/lib/fs/types";

describe("SESS-14: VerificationSection", () => {
  afterEach(() => {
    cleanup();
  });

  const makeVerificationSection = (raw: string): UnknownSection => ({
    heading: "Verification Results",
    raw,
  });

  it("renders verification blocks with color-coded borders", () => {
    const sections: UnknownSection[] = [
      makeVerificationSection(
        `### Successfully Verified\nAll tests pass.\n### Minor Issues Found\nSome warnings.\n### Blocking Issues\nCritical failure.`,
      ),
    ];
    render(<VerificationSection verificationSections={sections} />);
    expect(screen.getByText("Successfully Verified")).toBeInTheDocument();
    expect(screen.getByText("Minor Issues Found")).toBeInTheDocument();
    expect(screen.getByText("Blocking Issues")).toBeInTheDocument();
  });

  it('renders green border for "Successfully Verified"', () => {
    const sections: UnknownSection[] = [
      makeVerificationSection(`### Successfully Verified\nAll tests pass.`),
    ];
    render(<VerificationSection verificationSections={sections} />);
    const block = screen
      .getByText("Successfully Verified")
      .closest("[data-testid='verification-block']");
    expect(block).toHaveClass("border-l-green-500");
  });

  it('renders yellow border for "Minor Issues Found"', () => {
    const sections: UnknownSection[] = [
      makeVerificationSection(`### Minor Issues Found\nSome linting warnings.`),
    ];
    render(<VerificationSection verificationSections={sections} />);
    const block = screen
      .getByText("Minor Issues Found")
      .closest("[data-testid='verification-block']");
    expect(block).toHaveClass("border-l-yellow-500");
  });

  it('renders red border for "Blocking Issues"', () => {
    const sections: UnknownSection[] = [
      makeVerificationSection(`### Blocking Issues\nCritical test failure.`),
    ];
    render(<VerificationSection verificationSections={sections} />);
    const block = screen
      .getByText("Blocking Issues")
      .closest("[data-testid='verification-block']");
    expect(block).toHaveClass("border-l-red-500");
  });

  it("renders summary count badges at top", () => {
    const sections: UnknownSection[] = [
      makeVerificationSection(
        `### Successfully Verified\nPassed.\n### Minor Issues Found\nWarnings.\n### Blocking Issues\nFailed.`,
      ),
    ];
    render(<VerificationSection verificationSections={sections} />);
    expect(screen.getByText("1 pass")).toBeInTheDocument();
    expect(screen.getByText("1 partial")).toBeInTheDocument();
    expect(screen.getByText("1 fail")).toBeInTheDocument();
  });
});
