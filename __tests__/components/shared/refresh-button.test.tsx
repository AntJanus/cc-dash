import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// --- Mocks must be set up before importing the module under test ---

const { mockRefreshAllData } = vi.hoisted(() => ({
  mockRefreshAllData: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/actions/refresh-action", () => ({
  refreshAllData: mockRefreshAllData,
}));

const { mockRefresh } = vi.hoisted(() => ({
  mockRefresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

// Import AFTER mocks
import { RefreshButton } from "@/components/shared/refresh-button";

// --- Tests ---

describe("RefreshButton", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders a button with aria-label 'Refresh all data'", () => {
    render(<RefreshButton />);
    const button = screen.getByRole("button", { name: "Refresh all data" });
    expect(button).toBeInTheDocument();
  });

  it("renders a RefreshCw icon (svg element inside the button)", () => {
    render(<RefreshButton />);
    const button = screen.getByRole("button", { name: "Refresh all data" });
    const svg = button.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("clicking the button calls refreshAllData server action", async () => {
    render(<RefreshButton />);
    const button = screen.getByRole("button", { name: "Refresh all data" });

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockRefreshAllData).toHaveBeenCalledTimes(1);
    });
  });

  it("clicking the button calls router.refresh() after server action", async () => {
    render(<RefreshButton />);
    const button = screen.getByRole("button", { name: "Refresh all data" });

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it("button is disabled while refresh is pending", async () => {
    // Make refreshAllData return a promise that doesn't resolve immediately
    let resolveRefresh!: () => void;
    mockRefreshAllData.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    render(<RefreshButton />);
    const button = screen.getByRole("button", { name: "Refresh all data" });

    fireEvent.click(button);

    // Button should be disabled while pending
    await waitFor(() => {
      expect(button).toBeDisabled();
    });

    // Resolve the promise
    resolveRefresh();

    // Button should re-enable after completing
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it("icon has animate-spin class while pending", async () => {
    let resolveRefresh!: () => void;
    mockRefreshAllData.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    render(<RefreshButton />);
    const button = screen.getByRole("button", { name: "Refresh all data" });
    const svg = button.querySelector("svg")!;

    // Initially no animate-spin
    expect(
      svg.className.baseVal || svg.getAttribute("class") || "",
    ).not.toContain("animate-spin");

    fireEvent.click(button);

    // Should have animate-spin while pending
    await waitFor(() => {
      const currentSvg = screen
        .getByRole("button", { name: "Refresh all data" })
        .querySelector("svg")!;
      const classes =
        currentSvg.className.baseVal || currentSvg.getAttribute("class") || "";
      expect(classes).toContain("animate-spin");
    });

    // Resolve the promise
    resolveRefresh();

    // Should no longer have animate-spin
    await waitFor(() => {
      const currentSvg = screen
        .getByRole("button", { name: "Refresh all data" })
        .querySelector("svg")!;
      const classes =
        currentSvg.className.baseVal || currentSvg.getAttribute("class") || "";
      expect(classes).not.toContain("animate-spin");
    });
  });
});
