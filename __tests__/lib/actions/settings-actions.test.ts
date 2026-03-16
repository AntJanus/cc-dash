import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks must be set up before importing the module under test ---

const { mockLoadConfig, mockConfigPath } = vi.hoisted(() => ({
  mockLoadConfig: vi.fn(),
  mockConfigPath: "/mock/.config/cc-dash/config.json",
}));
vi.mock("@/lib/config", () => ({
  loadConfig: mockLoadConfig,
  CONFIG_PATH: mockConfigPath,
}));

const { mockAtomicWriteFile } = vi.hoisted(() => ({
  mockAtomicWriteFile: vi.fn(),
}));
vi.mock("@/lib/fs", () => ({
  atomicWriteFile: mockAtomicWriteFile,
}));

const { mockMkdir } = vi.hoisted(() => ({
  mockMkdir: vi.fn(),
}));
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    default: { ...actual, mkdir: mockMkdir },
    mkdir: mockMkdir,
  };
});

const { mockRevalidatePath } = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

// Import AFTER mocks
import { saveConfig } from "@/lib/actions/settings-actions";

const defaultConfig = {
  scan_dirs: ["/projects"],
  exclude_dirs: ["node_modules", ".git", "vendor"],
  explicit_projects: [],
  scan_depth: 2,
  port: 3000,
  display: {
    default_view: "board" as const,
    sort_order: "last_updated" as const,
    theme: "light" as const,
  },
};

describe("saveConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadConfig.mockResolvedValue({ ...defaultConfig });
    mockMkdir.mockResolvedValue(undefined);
    mockAtomicWriteFile.mockResolvedValue(undefined);
  });

  it("writes merged config to config path", async () => {
    const result = await saveConfig({ scan_depth: 5 });

    expect(result).toEqual({ success: true });
    expect(mockAtomicWriteFile).toHaveBeenCalledOnce();
    expect(mockAtomicWriteFile).toHaveBeenCalledWith(
      mockConfigPath,
      expect.stringContaining('"scan_depth": 5'),
    );
  });

  it("creates config directory if missing", async () => {
    await saveConfig({ scan_depth: 3 });

    expect(mockMkdir).toHaveBeenCalledWith("/mock/.config/cc-dash", {
      recursive: true,
    });
  });

  it("validates merged config before writing", async () => {
    const result = await saveConfig({ scan_depth: 99 });

    expect(result).toEqual({
      success: false,
      error: expect.stringContaining("Invalid configuration"),
    });
    expect(mockAtomicWriteFile).not.toHaveBeenCalled();
  });

  it("returns error for invalid config values", async () => {
    const result = await saveConfig({ scan_depth: -1 });

    expect(result).toEqual({
      success: false,
      error: expect.stringContaining("Invalid configuration"),
    });
  });

  it("preserves existing fields when updating subset", async () => {
    await saveConfig({ scan_depth: 4 });

    const writtenContent = mockAtomicWriteFile.mock.calls[0][1] as string;
    const written = JSON.parse(writtenContent);
    expect(written.scan_dirs).toEqual(["/projects"]);
    expect(written.scan_depth).toBe(4);
    expect(written.display.default_view).toBe("board");
  });

  it("calls revalidatePath after successful save", async () => {
    await saveConfig({ scan_depth: 3 });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("deep merges display preferences", async () => {
    await saveConfig({ display: { theme: "dark" } });

    const writtenContent = mockAtomicWriteFile.mock.calls[0][1] as string;
    const written = JSON.parse(writtenContent);
    expect(written.display.theme).toBe("dark");
    expect(written.display.default_view).toBe("board");
    expect(written.display.sort_order).toBe("last_updated");
  });

  it("returns error when atomicWriteFile throws", async () => {
    mockAtomicWriteFile.mockRejectedValue(new Error("disk full"));

    const result = await saveConfig({ scan_depth: 3 });

    expect(result).toEqual({
      success: false,
      error: expect.stringContaining("disk full"),
    });
  });
});
