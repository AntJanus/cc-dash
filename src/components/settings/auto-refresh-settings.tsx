"use client";

import { useAutoRefresh } from "@/components/shared/auto-refresh-provider";

/**
 * Settings section for auto-refresh configuration.
 * State is stored in localStorage (not config.json) via the AutoRefreshProvider.
 */
export function AutoRefreshSettings() {
  const { enabled, setEnabled, interval, setInterval } = useAutoRefresh();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Auto-Refresh</h2>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Automatically refresh dashboard data when project files change on disk.
      </p>

      <div className="flex items-center gap-3">
        <label htmlFor="auto-refresh-toggle" className="text-sm font-medium">
          Enable auto-refresh
        </label>
        <button
          id="auto-refresh-toggle"
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled(!enabled)}
          className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors"
          style={{
            background: enabled ? "var(--accent-emerald)" : "var(--bg-accent)",
          }}
        >
          <span
            className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
            style={{
              transform: enabled ? "translateX(20px)" : "translateX(0)",
            }}
          />
        </button>
      </div>

      <div className="space-y-1">
        <label htmlFor="refresh-interval" className="text-sm font-medium">
          Poll interval (seconds)
        </label>
        <div className="flex items-center gap-3">
          <input
            id="refresh-interval"
            type="range"
            min={2}
            max={30}
            step={1}
            value={interval}
            onChange={(e) => setInterval(parseInt(e.target.value, 10))}
            className="w-48"
            disabled={!enabled}
          />
          <span
            className="text-sm font-mono w-8"
            style={{ color: "var(--text-primary)" }}
          >
            {interval}s
          </span>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Lower values detect changes faster but use more resources.
        </p>
      </div>
    </section>
  );
}
