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
    <header
      className="cottage-topbar flex items-center justify-between px-6 py-3"
      style={{
        borderBottom: "1px solid var(--border-light)",
      }}
    >
      {/* Logo section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-amber), #8a6a2a)",
              boxShadow: "0 1px 3px rgba(90,66,29,0.2)",
            }}
          >
            <Zap className="h-4 w-4" />
          </div>
          <span className="font-serif text-xl font-semibold dark:gradient-text">
            cc-dash
          </span>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-3">
        <StatusPill
          value={projectCount}
          label="Projects"
          dotColor="var(--accent-amber)"
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
    <div className="cottage-pill">
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
