"use client";

import { Zap } from "lucide-react";

interface TopBarProps {
  projectCount: number;
  activeSessionCount: number;
  completionPercent: number;
}

export function TopBar({
  projectCount,
  activeSessionCount,
  completionPercent,
}: TopBarProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
      {/* Logo section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-teal), var(--accent-violet))",
            }}
          >
            <Zap className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold dark:gradient-text">
            cc-dash
          </span>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-4">
        <StatusPill
          value={projectCount}
          label="Projects"
          dotColor="var(--accent-teal)"
        />
        <StatusPill
          value={activeSessionCount}
          label="Active Sessions"
          dotColor="var(--accent-emerald)"
        />
        <StatusPill
          value={`${completionPercent}%`}
          label="Complete"
          dotColor="var(--accent-blue)"
        />
      </div>
    </header>
  );
}

interface StatusPillProps {
  value: number | string;
  label: string;
  dotColor: string;
}

function StatusPill({ value, label, dotColor }: StatusPillProps) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-[var(--bg-accent)] px-3 py-1.5">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: dotColor }}
      />
      <span
        className="text-sm font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </span>
      <span className="text-sm" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
    </div>
  );
}
