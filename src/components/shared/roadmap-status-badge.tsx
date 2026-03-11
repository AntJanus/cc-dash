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
      "border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400",
  },
  planned: {
    label: "Planned",
    variant: "secondary",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  "in-progress": {
    label: "Active",
    variant: "default",
    className: "bg-amber-500 text-white",
  },
  done: {
    label: "Done",
    variant: "default",
    className: "bg-green-600 text-white",
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
