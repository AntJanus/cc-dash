import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const { mockReadFile, mockMkdir } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
  mockMkdir: vi.fn(),
}));

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    default: { ...actual, readFile: mockReadFile, mkdir: mockMkdir },
    readFile: mockReadFile,
    mkdir: mockMkdir,
  };
});

const { mockAtomicWriteFile } = vi.hoisted(() => ({
  mockAtomicWriteFile: vi.fn(),
}));

vi.mock("@/lib/fs/atomic-write", () => ({
  atomicWriteFile: mockAtomicWriteFile,
}));

// Import AFTER mocks
import {
  portfolioPath,
  loadPortfolio,
  savePortfolio,
  loadAllPortfolios,
} from "@/lib/fs/portfolio";

// --- Tests ---

describe("portfolioPath", () => {
  it("returns .cc-dash/portfolio.json under the scan dir", () => {
    expect(portfolioPath("/projects/portfolio")).toBe(
      "/projects/portfolio/.cc-dash/portfolio.json",
    );
  });
});

describe("loadPortfolio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and parses a valid portfolio file", async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        schema: "cc-dash/portfolio@1",
        projects: {
          "prd-board": { status: "active", order: 0 },
          "alpha-app": { status: "maintenance" },
        },
      }),
    );

    const result = await loadPortfolio("/projects/portfolio");
    expect(result.schema).toBe("cc-dash/portfolio@1");
    expect(result.projects["prd-board"].order).toBe(0);
    expect(result.projects["alpha-app"].status).toBe("maintenance");
  });

  it("returns default empty portfolio when file does not exist", async () => {
    mockReadFile.mockRejectedValue(new Error("ENOENT"));

    const result = await loadPortfolio("/projects/portfolio");
    expect(result.schema).toBe("cc-dash/portfolio@1");
    expect(result.projects).toEqual({});
  });

  it("returns default portfolio for invalid JSON", async () => {
    mockReadFile.mockResolvedValue("not json");

    const result = await loadPortfolio("/projects/portfolio");
    expect(result.projects).toEqual({});
  });

  it("returns default portfolio for wrong schema version", async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        schema: "cc-dash/portfolio@99",
        projects: { foo: { status: "active" } },
      }),
    );

    const result = await loadPortfolio("/projects/portfolio");
    expect(result.projects).toEqual({});
  });
});

describe("savePortfolio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMkdir.mockResolvedValue(undefined);
    mockAtomicWriteFile.mockResolvedValue(undefined);
  });

  it("creates .cc-dash directory and writes portfolio file", async () => {
    const portfolio = {
      schema: "cc-dash/portfolio@1" as const,
      projects: {
        "prd-board": { status: "active" as const, order: 0 },
      },
    };

    await savePortfolio("/projects/portfolio", portfolio);

    expect(mockMkdir).toHaveBeenCalledWith("/projects/portfolio/.cc-dash", {
      recursive: true,
    });
    expect(mockAtomicWriteFile).toHaveBeenCalledOnce();
    const [path, content] = mockAtomicWriteFile.mock.calls[0];
    expect(path).toBe("/projects/portfolio/.cc-dash/portfolio.json");
    const parsed = JSON.parse(content);
    expect(parsed.schema).toBe("cc-dash/portfolio@1");
    expect(parsed.projects["prd-board"].order).toBe(0);
  });
});

describe("loadAllPortfolios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merges portfolios from multiple scan dirs", async () => {
    mockReadFile.mockImplementation(async (path: string) => {
      if (path.includes("/dir1/")) {
        return JSON.stringify({
          schema: "cc-dash/portfolio@1",
          projects: { "project-a": { status: "active", order: 0 } },
        });
      }
      if (path.includes("/dir2/")) {
        return JSON.stringify({
          schema: "cc-dash/portfolio@1",
          projects: { "project-b": { status: "maintenance" } },
        });
      }
      throw new Error("ENOENT");
    });

    const result = await loadAllPortfolios(["/dir1", "/dir2"]);
    expect(result.size).toBe(2);
    expect(result.get("project-a")?.status).toBe("active");
    expect(result.get("project-a")?.order).toBe(0);
    expect(result.get("project-b")?.status).toBe("maintenance");
  });

  it("handles missing portfolio files gracefully", async () => {
    mockReadFile.mockRejectedValue(new Error("ENOENT"));

    const result = await loadAllPortfolios(["/dir1", "/dir2"]);
    expect(result.size).toBe(0);
  });
});
