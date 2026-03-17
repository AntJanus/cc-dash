"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type IdeaStatusType = "not-started" | "started" | "complete";

interface IdeaStatusBadgeProps {
  status: IdeaStatusType;
  className?: string;
}

const statusConfig: Record<
  IdeaStatusType,
  {
    label: string;
    variant: "default" | "secondary" | "outline";
    className: string;
  }
> = {
  "not-started": {
    label: "Not Started",
    variant: "secondary",
    className: "",
  },
  started: {
    label: "Started",
    variant: "default",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  complete: {
    label: "Complete",
    variant: "outline",
    className:
      "border-green-300 text-green-700 dark:border-green-700 dark:text-green-400",
  },
};

export function IdeaStatusBadge({ status, className }: IdeaStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
