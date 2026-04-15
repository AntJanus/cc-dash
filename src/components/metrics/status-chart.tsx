"use client";

import { Zap, AlertCircle, CheckCircle, Circle } from "lucide-react";
import type { StatusDistribution } from "@/lib/metrics/portfolio-metrics";

interface StatusChartProps {
  distribution: StatusDistribution;
  total: number;
}

const STATUS_CONFIG = [
  { key: "active" as const, label: "Active", icon: Zap, color: "emerald" },
  {
    key: "stalled" as const,
    label: "Stalled",
    icon: AlertCircle,
    color: "amber",
  },
  {
    key: "complete" as const,
    label: "Complete",
    icon: CheckCircle,
    color: "blue",
  },
  {
    key: "inactive" as const,
    label: "Inactive",
    icon: Circle,
    color: "violet",
  },
];

export function StatusChart({ distribution, total }: StatusChartProps) {
  return (
    <div className="space-y-3">
      {STATUS_CONFIG.map(({ key, label, icon: Icon, color }) => {
        const count = distribution[key];
        const pct = total > 0 ? (count / total) * 100 : 0;

        return (
          <div key={key} className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: `var(--accent-${color}-light)`,
                color: `var(--accent-${color})`,
              }}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-1">
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {label}
                </span>
                <span
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  {count} ({Math.round(pct)}%)
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: "var(--bg-accent)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: `var(--accent-${color})`,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
