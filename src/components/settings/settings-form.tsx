"use client";

import { useState } from "react";
import type { Config } from "@/lib/schemas/config";
import { saveConfig } from "@/lib/actions/settings-actions";
import { ListEditor } from "@/components/settings/list-editor";
import { ExplicitProjectEditor } from "@/components/settings/explicit-project-editor";
import { Button } from "@/components/ui/button";

interface SettingsFormProps {
  initialConfig: Config;
}

type SaveStatus = "idle" | "saving" | "success" | "error";

/**
 * Client component for the settings page.
 *
 * Renders all config sections (scan dirs, exclude patterns, explicit projects,
 * scan depth, display preferences) with Save button and feedback.
 */
export function SettingsForm({ initialConfig }: SettingsFormProps) {
  const [formData, setFormData] = useState<Config>(
    structuredClone(initialConfig),
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function updateFormData(updates: Partial<Config>) {
    setFormData((prev) => ({ ...prev, ...updates }));
  }

  function updateDisplay(updates: Partial<Config["display"]>) {
    setFormData((prev) => ({
      ...prev,
      display: { ...prev.display, ...updates },
    }));
  }

  function handleThemeChange(theme: Config["display"]["theme"]) {
    updateDisplay({ theme });

    // Apply theme immediately
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // system
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    // Persist to localStorage for FOIT prevention
    localStorage.setItem("cc-dash-theme", JSON.stringify(theme));

    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    window.dispatchEvent(new CustomEvent("theme-change", { detail: resolved }));
  }

  async function handleSave() {
    setSaveStatus("saving");
    setErrorMessage("");

    const result = await saveConfig(
      formData as unknown as Record<string, unknown>,
    );

    if (result.success) {
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } else {
      setSaveStatus("error");
      setErrorMessage(result.error);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Scan Configuration */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Scan Configuration</h2>

        <ListEditor
          label="Scan Directories"
          items={formData.scan_dirs}
          onChange={(scan_dirs) => updateFormData({ scan_dirs })}
          placeholder="Add scan directory"
        />

        <ListEditor
          label="Exclude Patterns"
          items={formData.exclude_dirs}
          onChange={(exclude_dirs) => updateFormData({ exclude_dirs })}
          placeholder="Add exclude pattern"
        />

        <ExplicitProjectEditor
          projects={formData.explicit_projects}
          onChange={(explicit_projects) =>
            updateFormData({ explicit_projects })
          }
        />

        <div className="space-y-1">
          <label htmlFor="scan-depth" className="text-sm font-medium">
            Scan Depth
          </label>
          <input
            id="scan-depth"
            type="number"
            min={1}
            max={10}
            value={formData.scan_depth}
            onChange={(e) =>
              updateFormData({ scan_depth: parseInt(e.target.value, 10) || 1 })
            }
            className="w-20 rounded border bg-background px-3 py-1.5 text-sm"
          />
        </div>
      </section>

      {/* Display Preferences */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Display Preferences</h2>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label htmlFor="default-view" className="text-sm font-medium">
              Default View
            </label>
            <select
              id="default-view"
              value={formData.display.default_view}
              onChange={(e) =>
                updateDisplay({
                  default_view: e.target.value as "board" | "list",
                })
              }
              className="w-full rounded border bg-background px-3 py-1.5 text-sm"
            >
              <option value="board">Board</option>
              <option value="list">List</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="sort-order" className="text-sm font-medium">
              Sort Order
            </label>
            <select
              id="sort-order"
              value={formData.display.sort_order}
              onChange={(e) =>
                updateDisplay({
                  sort_order: e.target.value as
                    | "last_updated"
                    | "name"
                    | "status",
                })
              }
              className="w-full rounded border bg-background px-3 py-1.5 text-sm"
            >
              <option value="last_updated">Last Updated</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="theme" className="text-sm font-medium">
              Theme
            </label>
            <select
              id="theme"
              value={formData.display.theme}
              onChange={(e) =>
                handleThemeChange(e.target.value as "light" | "dark" | "system")
              }
              className="w-full rounded border bg-background px-3 py-1.5 text-sm"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saveStatus === "saving"}>
          {saveStatus === "saving" ? "Saving..." : "Save"}
        </Button>

        {saveStatus === "success" && (
          <span className="text-sm text-green-600">Settings saved</span>
        )}
        {saveStatus === "error" && (
          <span className="text-sm text-red-600">{errorMessage}</span>
        )}
      </div>
    </div>
  );
}
