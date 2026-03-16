import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { Config } from "@/lib/schemas/config";

// Mock saveConfig server action
const { mockSaveConfig } = vi.hoisted(() => ({
  mockSaveConfig: vi.fn(),
}));
vi.mock("@/lib/actions/settings-actions", () => ({
  saveConfig: mockSaveConfig,
}));

import { SettingsForm } from "@/components/settings/settings-form";

const defaultConfig: Config = {
  scan_dirs: ["/projects"],
  exclude_dirs: ["node_modules", ".git", "vendor"],
  explicit_projects: [{ path: "/my-app", name: "My App" }],
  scan_depth: 2,
  port: 3000,
  display: {
    default_view: "board",
    sort_order: "last_updated",
    theme: "light",
  },
};

describe("SettingsForm", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveConfig.mockResolvedValue({ success: true });
  });

  it("renders scan directories section", () => {
    render(<SettingsForm initialConfig={defaultConfig} />);

    expect(screen.getByText("Scan Directories")).toBeInTheDocument();
    expect(screen.getByText("/projects")).toBeInTheDocument();
  });

  it("renders exclude patterns section", () => {
    render(<SettingsForm initialConfig={defaultConfig} />);

    expect(screen.getByText("Exclude Patterns")).toBeInTheDocument();
    expect(screen.getByText("node_modules")).toBeInTheDocument();
  });

  it("renders explicit projects section", () => {
    render(<SettingsForm initialConfig={defaultConfig} />);

    expect(screen.getByText("Explicit Projects")).toBeInTheDocument();
    expect(screen.getByText("/my-app")).toBeInTheDocument();
    expect(screen.getByText("My App")).toBeInTheDocument();
  });

  it("renders scan depth input", () => {
    render(<SettingsForm initialConfig={defaultConfig} />);

    const depthInput = screen.getByLabelText(/scan depth/i);
    expect(depthInput).toBeInTheDocument();
    expect(depthInput).toHaveValue(2);
  });

  it("renders display preferences section", () => {
    render(<SettingsForm initialConfig={defaultConfig} />);

    expect(screen.getByText("Display Preferences")).toBeInTheDocument();
  });

  it("renders theme selector", () => {
    render(<SettingsForm initialConfig={defaultConfig} />);

    const themeSelect = screen.getByLabelText(/theme/i);
    expect(themeSelect).toBeInTheDocument();
    expect(themeSelect).toHaveValue("light");
  });

  it("renders default view selector", () => {
    render(<SettingsForm initialConfig={defaultConfig} />);

    const viewSelect = screen.getByLabelText(/default view/i);
    expect(viewSelect).toBeInTheDocument();
    expect(viewSelect).toHaveValue("board");
  });

  it("renders sort order selector", () => {
    render(<SettingsForm initialConfig={defaultConfig} />);

    const sortSelect = screen.getByLabelText(/sort order/i);
    expect(sortSelect).toBeInTheDocument();
    expect(sortSelect).toHaveValue("last_updated");
  });

  it("calls saveConfig on Save button click", async () => {
    render(<SettingsForm initialConfig={defaultConfig} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
    });

    await waitFor(() => {
      expect(mockSaveConfig).toHaveBeenCalledOnce();
    });
  });

  it("shows success feedback after save", async () => {
    render(<SettingsForm initialConfig={defaultConfig} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
    });

    await waitFor(() => {
      expect(screen.getByText(/saved/i)).toBeInTheDocument();
    });
  });

  it("shows error feedback on save failure", async () => {
    mockSaveConfig.mockResolvedValue({
      success: false,
      error: "Write failed",
    });

    render(<SettingsForm initialConfig={defaultConfig} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
    });

    await waitFor(() => {
      expect(screen.getByText(/write failed/i)).toBeInTheDocument();
    });
  });

  it("disables Save button while saving", async () => {
    // Make saveConfig hang
    let resolveSave: (value: { success: true }) => void;
    mockSaveConfig.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
    );

    render(<SettingsForm initialConfig={defaultConfig} />);

    const saveButton = screen.getByRole("button", { name: "Save" });

    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Button should be disabled while saving (text is now "Saving...")
    const savingButton = screen.getByRole("button", { name: "Saving..." });
    expect(savingButton).toBeDisabled();

    // Resolve the save
    await act(async () => {
      resolveSave!({ success: true });
    });

    // Button should be enabled again with "Save" text
    await waitFor(() => {
      const btn = screen.getByRole("button", { name: "Save" });
      expect(btn).not.toBeDisabled();
    });
  });
});
