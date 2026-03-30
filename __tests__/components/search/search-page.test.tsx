import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// --- Mocks ---

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const mockReplace = vi.fn();
const mockSearchParams = vi.hoisted(() => ({
  get: vi.fn().mockReturnValue(null),
  toString: vi.fn().mockReturnValue(""),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ replace: mockReplace }),
}));

const { mockSearchAllProjects } = vi.hoisted(() => ({
  mockSearchAllProjects: vi.fn(),
}));

vi.mock("@/lib/actions/search-actions", () => ({
  searchAllProjects: mockSearchAllProjects,
}));

// Import AFTER mocks
import { SearchPage } from "@/components/search/search-page";

const EMPTY_RESULTS = {
  roadmapItems: [],
  sessionTasks: [],
  ideas: [],
};

const MOCK_RESULTS = {
  roadmapItems: [
    {
      projectSlug: "my-project",
      projectName: "My Project",
      itemId: "r_abc12",
      title: "Build search feature",
      description: "Implement cross-project search",
      status: "planned",
      type: "roadmap" as const,
      link: "/project/my-project/roadmap",
    },
  ],
  sessionTasks: [],
  ideas: [],
};

describe("SearchPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.get.mockReturnValue(null);
    mockSearchParams.toString.mockReturnValue("");
    mockSearchAllProjects.mockResolvedValue(EMPTY_RESULTS);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders page heading", () => {
    render(<SearchPage />);
    expect(screen.getByText("Search")).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(<SearchPage />);
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("shows search prompt when input is empty", () => {
    render(<SearchPage />);
    expect(screen.getByTestId("search-prompt")).toBeInTheDocument();
  });

  it("pre-fills input from URL query param", () => {
    mockSearchParams.get.mockReturnValue("my query");
    render(<SearchPage />);
    const input = screen.getByRole("searchbox");
    expect(input).toHaveValue("my query");
  });

  it("updates URL when user types in input", async () => {
    render(<SearchPage />);
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "search term" } });
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("search"),
      expect.any(Object),
    );
  });

  it("calls searchAllProjects after debounce when query is entered", async () => {
    vi.useFakeTimers();
    mockSearchAllProjects.mockResolvedValue(EMPTY_RESULTS);

    render(<SearchPage />);
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "test query" } });

    // Before debounce fires
    expect(mockSearchAllProjects).not.toHaveBeenCalled();

    // Advance past debounce
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockSearchAllProjects).toHaveBeenCalledWith("test query");
    vi.useRealTimers();
  });

  it("does not call searchAllProjects for whitespace-only input", async () => {
    vi.useFakeTimers();

    render(<SearchPage />);
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "   " } });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockSearchAllProjects).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("shows results after search completes", async () => {
    vi.useFakeTimers();
    mockSearchAllProjects.mockResolvedValue(MOCK_RESULTS);

    render(<SearchPage />);
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "search" } });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByTestId("search-results")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("shows empty state when search returns no results", async () => {
    vi.useFakeTimers();
    mockSearchAllProjects.mockResolvedValue(EMPTY_RESULTS);

    render(<SearchPage />);
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "noresult" } });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByTestId("search-empty-state")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("hides search prompt after typing a query", async () => {
    vi.useFakeTimers();
    mockSearchAllProjects.mockResolvedValue(MOCK_RESULTS);

    render(<SearchPage />);
    const input = screen.getByRole("searchbox");

    expect(screen.getByTestId("search-prompt")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "search" } });
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.queryByTestId("search-prompt")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("resets to prompt when input is cleared", async () => {
    vi.useFakeTimers();
    mockSearchAllProjects.mockResolvedValue(MOCK_RESULTS);

    render(<SearchPage />);
    const input = screen.getByRole("searchbox");

    // Type then clear
    fireEvent.change(input, { target: { value: "search" } });
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.queryByTestId("search-prompt")).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "" } });
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByTestId("search-prompt")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
