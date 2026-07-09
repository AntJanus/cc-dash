import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks must be set up before importing the module under test ---

const { mockLoadConfig } = vi.hoisted(() => ({
  mockLoadConfig: vi.fn(),
}));
vi.mock("@/lib/config", () => ({
  loadConfig: mockLoadConfig,
}));

const { mockDiscoverProjects } = vi.hoisted(() => ({
  mockDiscoverProjects: vi.fn(),
}));
vi.mock("@/lib/fs", () => ({
  discoverProjects: mockDiscoverProjects,
}));

const { mockExpandTilde } = vi.hoisted(() => ({
  mockExpandTilde: vi.fn((p: string) => p.replace(/^~/, "/home/user")),
}));
vi.mock("@/lib/fs/discovery", () => ({
  expandTilde: mockExpandTilde,
}));

const { mockLoadPortfolio, mockSavePortfolio } = vi.hoisted(() => ({
  mockLoadPortfolio: vi.fn(),
  mockSavePortfolio: vi.fn(),
}));
vi.mock("@/lib/fs/portfolio", () => ({
  loadPortfolio: mockLoadPortfolio,
  savePortfolio: mockSavePortfolio,
}));

const { mockRevalidatePath } = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

// Import AFTER mocks
import {
  setProjectStatus,
  setProjectCanvasPosition,
} from "@/lib/actions/portfolio-actions";

// --- Helpers ---

function setupHappyPath() {
  mockLoadConfig.mockResolvedValue({
    scan_dirs: ["~/projects"],
  });
  mockDiscoverProjects.mockResolvedValue([
    {
      slug: "alpha-app",
      name: "alpha-app",
      path: "/home/user/projects/alpha-app",
      roadmapPath: null,
      sessionPath: null,
    },
  ]);
  mockLoadPortfolio.mockResolvedValue({
    schema: "cc-dash/portfolio@1",
    projects: {},
  });
  mockSavePortfolio.mockResolvedValue(undefined);
}

// --- Tests ---

describe("setProjectStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupHappyPath();
  });

  it("rejects an invalid status string", async () => {
    const result = await setProjectStatus("alpha-app", "garbage");
    expect(result).toEqual({ success: false, error: "Invalid status" });
    expect(mockSavePortfolio).not.toHaveBeenCalled();
  });

  it("creates a new portfolio entry when none exists", async () => {
    const result = await setProjectStatus("alpha-app", "maintenance");
    expect(result).toEqual({ success: true });
    expect(mockSavePortfolio).toHaveBeenCalledTimes(1);
    const [, portfolio] = mockSavePortfolio.mock.calls[0]!;
    expect(portfolio.projects["alpha-app"].status).toBe("maintenance");
  });

  it("revalidates the layout on success", async () => {
    await setProjectStatus("alpha-app", "active");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("returns Project not found when slug is unknown", async () => {
    mockDiscoverProjects.mockResolvedValue([]);
    const result = await setProjectStatus("unknown", "active");
    expect(result).toEqual({ success: false, error: "Project not found" });
  });
});

describe("setProjectCanvasPosition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupHappyPath();
  });

  it("rejects non-finite coords", async () => {
    const nan = await setProjectCanvasPosition("alpha-app", { x: NaN, y: 0 });
    expect(nan).toEqual({ success: false, error: "Invalid canvas position" });
    const inf = await setProjectCanvasPosition("alpha-app", {
      x: 0,
      y: Infinity,
    });
    expect(inf).toEqual({ success: false, error: "Invalid canvas position" });
    expect(mockSavePortfolio).not.toHaveBeenCalled();
  });

  it("creates a new portfolio entry with canvas position when none exists", async () => {
    const result = await setProjectCanvasPosition("alpha-app", {
      x: 120.7,
      y: -42.4,
    });
    expect(result).toEqual({ success: true });
    expect(mockSavePortfolio).toHaveBeenCalledTimes(1);
    const [scanDir, portfolio] = mockSavePortfolio.mock.calls[0]!;
    expect(scanDir).toBe("/home/user/projects");
    expect(portfolio.projects["alpha-app"].status).toBe("active");
    // Coordinates are rounded to integers when saved.
    expect(portfolio.projects["alpha-app"].canvas).toEqual({ x: 121, y: -42 });
  });

  it("preserves existing status when updating canvas on an existing entry", async () => {
    mockLoadPortfolio.mockResolvedValue({
      schema: "cc-dash/portfolio@1",
      projects: {
        "alpha-app": { status: "maintenance", order: 3 },
      },
    });
    const result = await setProjectCanvasPosition("alpha-app", {
      x: 10,
      y: 20,
    });
    expect(result).toEqual({ success: true });
    const [, portfolio] = mockSavePortfolio.mock.calls[0]!;
    expect(portfolio.projects["alpha-app"]).toEqual({
      status: "maintenance",
      order: 3,
      canvas: { x: 10, y: 20 },
    });
  });

  it("clears canvas when position is null", async () => {
    mockLoadPortfolio.mockResolvedValue({
      schema: "cc-dash/portfolio@1",
      projects: {
        "alpha-app": { status: "active", canvas: { x: 100, y: 100 } },
      },
    });
    const result = await setProjectCanvasPosition("alpha-app", null);
    expect(result).toEqual({ success: true });
    const [, portfolio] = mockSavePortfolio.mock.calls[0]!;
    expect(portfolio.projects["alpha-app"].canvas).toBeUndefined();
    expect(portfolio.projects["alpha-app"].status).toBe("active");
  });

  it("does NOT revalidate the layout (avoid mid-drag snap)", async () => {
    await setProjectCanvasPosition("alpha-app", { x: 50, y: 50 });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("returns Project not found when slug is unknown", async () => {
    mockDiscoverProjects.mockResolvedValue([]);
    const result = await setProjectCanvasPosition("unknown", {
      x: 0,
      y: 0,
    });
    expect(result).toEqual({ success: false, error: "Project not found" });
  });

  it("returns scan-dir error when project path is outside any scan dir", async () => {
    mockDiscoverProjects.mockResolvedValue([
      {
        slug: "alpha-app",
        name: "alpha-app",
        path: "/somewhere/else/alpha-app",
        roadmapPath: null,
        sessionPath: null,
      },
    ]);
    const result = await setProjectCanvasPosition("alpha-app", { x: 0, y: 0 });
    expect(result).toEqual({
      success: false,
      error: "Could not determine scan directory",
    });
  });
});
