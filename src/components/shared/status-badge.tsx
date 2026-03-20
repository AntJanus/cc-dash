"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProjectStatus = "active" | "stalled" | "complete" | "inactive";

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

/** Left-border accent colors by project status, reusable by card components */
export const STATUS_ACCENT_COLORS: Record<ProjectStatus, string> = {
  active: "border-l-green-500",
  stalled: "border-l-amber-500",
  complete: "border-l-blue-500",
  inactive: "border-l-gray-300 dark:border-l-gray-600",
};

const statusConfig: Record<
  ProjectStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline";
    className: string;
  }
> = {
  active: {
    label: "Active",
    variant: "default",
    className: "bg-green-600 text-white",
  },
  stalled: {
    label: "Stalled",
    variant: "secondary",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  complete: {
    label: "Complete",
    variant: "outline",
    className:
      "border-green-300 text-green-700 dark:border-green-700 dark:text-green-400",
  },
  inactive: {
    label: "Inactive",
    variant: "secondary",
    className: "",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
