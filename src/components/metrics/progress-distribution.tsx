"use client";

import type { ProgressBucket } from "@/lib/metrics/portfolio-metrics";

interface ProgressDistributionProps {
  buckets: ProgressBucket[];
  totalProjects: number;
}

const BUCKET_COLORS = [
  "var(--accent-amber)",
  "var(--accent-violet)",
  "var(--accent-blue)",
  "var(--accent-teal)",
  "var(--accent-emerald)",
];

export function ProgressDistribution({
  buckets,
  totalProjects,
}: ProgressDistributionProps) {
  return (
    <div className="space-y-3">
      {buckets.map((bucket, i) => {
        const pct =
          totalProjects > 0 ? (bucket.count / totalProjects) * 100 : 0;

        return (
          <div key={bucket.label} className="flex items-center gap-3">
            <span
              className="text-sm font-medium w-16 shrink-0 text-right"
              style={{ color: "var(--text-primary)" }}
            >
              {bucket.label}
            </span>
            <div
              className="flex-1 h-6 rounded-md overflow-hidden"
              style={{ background: "var(--bg-accent)" }}
            >
              <div
                className="h-full rounded-md transition-all duration-500 flex items-center px-2"
                style={{
                  width: `${Math.max(pct, bucket.count > 0 ? 8 : 0)}%`,
                  background: BUCKET_COLORS[i],
                }}
              >
                {bucket.count > 0 && (
                  <span className="text-sm font-medium text-white">
                    {bucket.count}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
