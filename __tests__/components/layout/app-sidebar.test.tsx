import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

// Mock refresh-button
vi.mock("@/components/shared/refresh-button", () => ({
  RefreshButton: () => <button>Refresh</button>,
}));

// Mock sidebar context
const mockToggle = vi.fn();
const mockCloseMobile = vi.fn();
const mockOpenMobile = vi.fn();
vi.mock("@/components/layout/sidebar-context", () => ({
  useSidebar: () => ({
    isOpen: true,
    isMobileOpen: false,
    toggle: mockToggle,
    closeMobile: mockCloseMobile,
    openMobile: mockOpenMobile,
  }),
}));

import { AppSidebar } from "@/components/layout/app-sidebar";

const MOCK_PROJECTS = [
  { slug: "alpha", name: "Alpha" },
  { slug: "beta", name: "Beta" },
];

describe("AppSidebar", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nav links", () => {
    render(<AppSidebar projects={MOCK_PROJECTS} />);

    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByText("Ideas")).toBeDefined();
    expect(screen.getByText("Activity")).toBeDefined();
    expect(screen.getByText("Settings")).toBeDefined();
  });

  it("renders project list", () => {
    render(<AppSidebar projects={MOCK_PROJECTS} />);

    expect(screen.getByText("Alpha")).toBeDefined();
    expect(screen.getByText("Beta")).toBeDefined();
  });

  it("renders logo text", () => {
    render(<AppSidebar projects={MOCK_PROJECTS} />);

    expect(screen.getByText("cc-dash")).toBeDefined();
  });

  it("renders sidebar testid", () => {
    render(<AppSidebar projects={MOCK_PROJECTS} />);

    expect(screen.getByTestId("app-sidebar")).toBeDefined();
  });
});
