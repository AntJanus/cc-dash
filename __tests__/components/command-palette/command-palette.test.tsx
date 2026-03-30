import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// --- Mocks ---

const { mockPush, mockRefresh } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const { mockRefreshAllData } = vi.hoisted(() => ({
  mockRefreshAllData: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/actions/refresh-action", () => ({
  refreshAllData: mockRefreshAllData,
}));

// Import AFTER mocks
import { CommandPalette } from "@/components/command-palette/command-palette";

// --- Helpers ---

const MOCK_PROJECTS = [
  { slug: "alpha", name: "Alpha Project" },
  { slug: "beta", name: "Beta Project" },
];

function renderPalette(projects = MOCK_PROJECTS) {
  return render(<CommandPalette projects={projects} />);
}

function openPalette() {
  fireEvent.keyDown(document, { key: "k", metaKey: true });
}

function _closePalette() {
  fireEvent.keyDown(document, { key: "Escape" });
}

// --- Tests ---

describe("CommandPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("open/close behavior", () => {
    it("is not visible initially", () => {
      renderPalette();
      expect(
        screen.queryByTestId("command-palette-overlay"),
      ).not.toBeInTheDocument();
    });

    it("opens when Cmd+K is pressed", () => {
      renderPalette();
      openPalette();
      expect(screen.getByTestId("command-palette-overlay")).toBeInTheDocument();
    });

    it("opens when Ctrl+K is pressed", () => {
      renderPalette();
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
      expect(screen.getByTestId("command-palette-overlay")).toBeInTheDocument();
    });

    it("closes when Escape is pressed on the input", () => {
      renderPalette();
      openPalette();
      const input = screen.getByRole("combobox");
      fireEvent.keyDown(input, { key: "Escape" });
      expect(
        screen.queryByTestId("command-palette-overlay"),
      ).not.toBeInTheDocument();
    });

    it("closes when backdrop is clicked", () => {
      renderPalette();
      openPalette();
      // The backdrop div is the sibling of the panel (aria-hidden)
      const backdrop = screen
        .getByTestId("command-palette-overlay")
        .querySelector('[aria-hidden="true"]')!;
      fireEvent.click(backdrop);
      expect(
        screen.queryByTestId("command-palette-overlay"),
      ).not.toBeInTheDocument();
    });

    it("toggles closed when Cmd+K is pressed again", () => {
      renderPalette();
      openPalette();
      expect(screen.getByTestId("command-palette-overlay")).toBeInTheDocument();
      openPalette(); // press again
      expect(
        screen.queryByTestId("command-palette-overlay"),
      ).not.toBeInTheDocument();
    });

    it("clears the search query when reopened", () => {
      renderPalette();
      openPalette();
      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "something" } });
      // Close then reopen
      openPalette();
      openPalette();
      const freshInput = screen.getByRole("combobox");
      expect(freshInput).toHaveValue("");
    });
  });

  describe("navigation commands", () => {
    it("lists all navigation items", () => {
      renderPalette();
      openPalette();
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Search")).toBeInTheDocument();
      expect(screen.getByText("Ideas")).toBeInTheDocument();
      expect(screen.getByText("Activity")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("shows a Navigation section header", () => {
      renderPalette();
      openPalette();
      expect(screen.getByText("Navigation")).toBeInTheDocument();
    });
  });

  describe("project commands", () => {
    it("lists project items from props", () => {
      renderPalette();
      openPalette();
      expect(screen.getByText("Alpha Project")).toBeInTheDocument();
      expect(screen.getByText("Beta Project")).toBeInTheDocument();
    });

    it("shows a Projects section header", () => {
      renderPalette();
      openPalette();
      expect(screen.getByText("Projects")).toBeInTheDocument();
    });

    it("navigates to project roadmap when project command is clicked", () => {
      renderPalette();
      openPalette();
      fireEvent.click(screen.getByText("Alpha Project"));
      expect(mockPush).toHaveBeenCalledWith("/project/alpha/roadmap");
    });

    it("renders with no projects when projects array is empty", () => {
      renderPalette([]);
      openPalette();
      expect(screen.queryByText("Projects")).not.toBeInTheDocument();
    });
  });

  describe("action commands", () => {
    it("shows an Actions section header", () => {
      renderPalette();
      openPalette();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("shows Refresh Data action", () => {
      renderPalette();
      openPalette();
      expect(screen.getByText("Refresh Data")).toBeInTheDocument();
    });

    it("clicking Refresh Data calls refreshAllData and router.refresh", async () => {
      renderPalette();
      openPalette();
      fireEvent.click(screen.getByText("Refresh Data"));
      await waitFor(() => {
        expect(mockRefreshAllData).toHaveBeenCalledTimes(1);
      });
      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("search filtering", () => {
    it("filters items as user types", () => {
      renderPalette();
      openPalette();
      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "alpha" } });

      expect(screen.getByText("Alpha Project")).toBeInTheDocument();
      expect(screen.queryByText("Beta Project")).not.toBeInTheDocument();
    });

    it("filters navigation items by label", () => {
      renderPalette();
      openPalette();
      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "settings" } });

      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.queryByText("Home")).not.toBeInTheDocument();
      expect(screen.queryByText("Ideas")).not.toBeInTheDocument();
    });

    it("filters by keywords (case-insensitive)", () => {
      renderPalette();
      openPalette();
      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "dashboard" } });

      // "dashboard" is a keyword for Home
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.queryByText("Settings")).not.toBeInTheDocument();
    });

    it("shows 'No commands found' when nothing matches", () => {
      renderPalette();
      openPalette();
      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "xyzzy-not-found-99999" } });

      expect(screen.getByText("No commands found")).toBeInTheDocument();
    });

    it("resets selected index to 0 when query changes", () => {
      renderPalette();
      openPalette();
      // Move selection down first
      const input = screen.getByRole("combobox");
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });

      // Then type — index should reset
      fireEvent.change(input, { target: { value: "home" } });

      // The first (only) result should be selected
      const options = screen.getAllByRole("option");
      const selected = options.find(
        (el) => el.getAttribute("aria-selected") === "true",
      );
      expect(selected).toBeInTheDocument();
      expect(selected).toHaveTextContent("Home");
    });
  });

  describe("keyboard navigation", () => {
    it("first item is selected by default", () => {
      renderPalette();
      openPalette();
      const options = screen.getAllByRole("option");
      expect(options[0].getAttribute("aria-selected")).toBe("true");
    });

    it("ArrowDown moves selection to next item", () => {
      renderPalette();
      openPalette();
      const input = screen.getByRole("combobox");
      fireEvent.keyDown(input, { key: "ArrowDown" });

      const options = screen.getAllByRole("option");
      expect(options[0].getAttribute("aria-selected")).toBe("false");
      expect(options[1].getAttribute("aria-selected")).toBe("true");
    });

    it("ArrowUp moves selection to previous item", () => {
      renderPalette();
      openPalette();
      const input = screen.getByRole("combobox");
      // Move down first
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });
      // Now move back up
      fireEvent.keyDown(input, { key: "ArrowUp" });

      const options = screen.getAllByRole("option");
      expect(options[1].getAttribute("aria-selected")).toBe("true");
    });

    it("ArrowDown does not go past the last item", () => {
      renderPalette([]);
      openPalette();
      // Only nav items + actions, no projects
      const input = screen.getByRole("combobox");
      // Press ArrowDown many times
      for (let i = 0; i < 20; i++) {
        fireEvent.keyDown(input, { key: "ArrowDown" });
      }
      const options = screen.getAllByRole("option");
      const lastOption = options[options.length - 1];
      expect(lastOption.getAttribute("aria-selected")).toBe("true");
    });

    it("ArrowUp does not go above the first item", () => {
      renderPalette();
      openPalette();
      const input = screen.getByRole("combobox");
      // ArrowUp from the start
      fireEvent.keyDown(input, { key: "ArrowUp" });
      fireEvent.keyDown(input, { key: "ArrowUp" });

      const options = screen.getAllByRole("option");
      expect(options[0].getAttribute("aria-selected")).toBe("true");
    });

    it("Enter executes the selected command", () => {
      renderPalette();
      openPalette();
      // Filter to just "Home" to be sure it's the first/only item
      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "home" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("hovering an item changes the selected index", () => {
      renderPalette();
      openPalette();
      const options = screen.getAllByRole("option");
      fireEvent.mouseEnter(options[2]);

      expect(options[2].getAttribute("aria-selected")).toBe("true");
      expect(options[0].getAttribute("aria-selected")).toBe("false");
    });
  });

  describe("navigation execution", () => {
    it("clicking Home navigates to /", () => {
      renderPalette();
      openPalette();
      fireEvent.click(screen.getByText("Home"));
      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("clicking Search navigates to /search", () => {
      renderPalette();
      openPalette();
      fireEvent.click(screen.getByText("Search"));
      expect(mockPush).toHaveBeenCalledWith("/search");
    });

    it("clicking Ideas navigates to /ideas", () => {
      renderPalette();
      openPalette();
      fireEvent.click(screen.getByText("Ideas"));
      expect(mockPush).toHaveBeenCalledWith("/ideas");
    });

    it("clicking Activity navigates to /activity", () => {
      renderPalette();
      openPalette();
      fireEvent.click(screen.getByText("Activity"));
      expect(mockPush).toHaveBeenCalledWith("/activity");
    });

    it("clicking Settings navigates to /settings", () => {
      renderPalette();
      openPalette();
      fireEvent.click(screen.getByText("Settings"));
      expect(mockPush).toHaveBeenCalledWith("/settings");
    });

    it("clicking a command closes the palette", () => {
      renderPalette();
      openPalette();
      fireEvent.click(screen.getByText("Home"));
      expect(
        screen.queryByTestId("command-palette-overlay"),
      ).not.toBeInTheDocument();
    });
  });

  describe("dialog accessibility", () => {
    it("has role=dialog on the panel", () => {
      renderPalette();
      openPalette();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("has aria-modal=true on the panel", () => {
      renderPalette();
      openPalette();
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("has a listbox for results", () => {
      renderPalette();
      openPalette();
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("search input has role=combobox", () => {
      renderPalette();
      openPalette();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });
});
