import { cn } from "@/lib/utils";
import type { QaItem } from "@/lib/schemas/qa";

interface StatusConfig {
  label: string;
  className: string;
}

const STATUS_CONFIG: Record<QaItem["status"], StatusConfig> = {
  pending: {
    label: "Pending",
    className: "bg-muted text-muted-foreground",
  },
  passed: {
    label: "Passed",
    className: "bg-green-600 text-white",
  },
  failed: {
    label: "Failed",
    className: "bg-red-600 text-white",
  },
  "needs-decision": {
    label: "Needs decision",
    className: "bg-amber-500 text-white",
  },
  skipped: {
    label: "Skipped",
    className: "bg-gray-400 text-white",
  },
};

interface QaStatusBadgeProps {
  status: QaItem["status"];
  className?: string;
}

export function QaStatusBadge({ status, className }: QaStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center justify-center rounded-full px-2 py-0.5 text-sm font-medium whitespace-nowrap",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
