"use client";

import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: "teal" | "violet" | "amber" | "blue" | "emerald" | "cyan";
  className?: string;
  showValue?: boolean;
}

const COLOR_MAP = {
  teal: {
    stroke: "var(--accent-teal)",
    glow: "var(--accent-teal-light)",
  },
  violet: {
    stroke: "var(--accent-violet)",
    glow: "var(--accent-violet-light)",
  },
  amber: {
    stroke: "var(--accent-amber)",
    glow: "var(--accent-amber-light)",
  },
  blue: {
    stroke: "var(--accent-blue)",
    glow: "var(--accent-blue-light)",
  },
  emerald: {
    stroke: "var(--accent-emerald)",
    glow: "var(--accent-emerald-light)",
  },
  cyan: {
    stroke: "var(--accent-cyan, var(--accent-teal))",
    glow: "var(--accent-cyan-dim, var(--accent-teal-light))",
  },
};

export function ProgressRing({
  value,
  size = 52,
  strokeWidth = 5,
  color = "teal",
  className,
  showValue = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const colors = COLOR_MAP[color];

  return (
    <div
      className={cn("relative flex-shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-[var(--bg-accent)] dark:stroke-[var(--bg-elevated)]"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            stroke: colors.stroke,
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: "stroke-dashoffset 0.5s ease",
            filter: "drop-shadow(0 0 6px var(--accent-cyan-glow, transparent))",
          }}
          className="dark:[filter:drop-shadow(0_0_6px_var(--accent-cyan-glow))]"
        />
      </svg>
      {showValue && (
        <span
          className="absolute inset-0 flex items-center justify-center text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {value}%
        </span>
      )}
    </div>
  );
}
