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
  active: "border-l-[var(--status-active)]",
  stalled: "border-l-[var(--status-stalled)]",
  complete: "border-l-[var(--status-complete)]",
  inactive: "border-l-[var(--status-inactive)]",
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
    variant: "outline",
    className:
      "bg-[var(--status-active-bg)] text-[var(--status-active)] border-[var(--status-active)]/20",
  },
  stalled: {
    label: "Stalled",
    variant: "outline",
    className:
      "bg-[var(--status-stalled-bg)] text-[var(--status-stalled)] border-[var(--status-stalled)]/20",
  },
  complete: {
    label: "Complete",
    variant: "outline",
    className:
      "bg-[var(--status-complete-bg)] text-[var(--status-complete)] border-[var(--status-complete)]/20",
  },
  inactive: {
    label: "Inactive",
    variant: "outline",
    className:
      "bg-[var(--status-inactive-bg)] text-[var(--status-inactive)] border-[var(--status-inactive)]/20",
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
