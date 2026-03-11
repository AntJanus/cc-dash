"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StaleBadgeProps {
  className?: string;
}

export function StaleBadge({ className }: StaleBadgeProps) {
  return (
    <Badge
      variant="destructive"
      className={cn(
        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        className,
      )}
    >
      Stale
    </Badge>
  );
}
