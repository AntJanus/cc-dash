"use client";

import type { VelocityBucket } from "@/lib/metrics/portfolio-metrics";

interface VelocityChartProps {
  buckets: VelocityBucket[];
}

export function VelocityChart({ buckets }: VelocityChartProps) {
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  if (buckets.every((b) => b.count === 0)) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        No completions in the last 8 weeks.
      </p>
    );
  }

  return (
    <div className="flex items-end gap-2 h-40">
      {buckets.map((bucket) => {
        const heightPct = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;

        return (
          <div
            key={bucket.weekStart}
            className="flex-1 flex flex-col items-center gap-1"
          >
            {/* Count label */}
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {bucket.count > 0 ? bucket.count : ""}
            </span>

            {/* Bar */}
            <div className="w-full flex-1 flex items-end">
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: `${Math.max(heightPct, 4)}%`,
                  background:
                    bucket.count > 0
                      ? "var(--accent-teal)"
                      : "var(--bg-accent)",
                }}
              />
            </div>

            {/* Week label */}
            <span
              className="text-sm leading-tight text-center"
              style={{ color: "var(--text-muted)" }}
              title={bucket.label}
            >
              {bucket.weekStart.slice(5)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
