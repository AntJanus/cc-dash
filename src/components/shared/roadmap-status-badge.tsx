import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type RoadmapItemStatus = "planned" | "in-progress" | "done" | "idea";

interface RoadmapStatusBadgeProps {
  status: RoadmapItemStatus;
  className?: string;
}

const statusConfig: Record<
  RoadmapItemStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline";
    className: string;
  }
> = {
  idea: {
    label: "Idea",
    variant: "outline",
    className:
      "bg-[var(--status-inactive-bg)] text-[var(--status-inactive)] border-[var(--status-inactive)]/20",
  },
  planned: {
    label: "Planned",
    variant: "outline",
    className:
      "bg-[var(--status-complete-bg)] text-[var(--status-complete)] border-[var(--status-complete)]/20",
  },
  "in-progress": {
    label: "Active",
    variant: "outline",
    className:
      "bg-[var(--status-stalled-bg)] text-[var(--status-stalled)] border-[var(--status-stalled)]/20",
  },
  done: {
    label: "Done",
    variant: "outline",
    className:
      "bg-[var(--status-active-bg)] text-[var(--status-active)] border-[var(--status-active)]/20",
  },
};

export function RoadmapStatusBadge({
  status,
  className,
}: RoadmapStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
