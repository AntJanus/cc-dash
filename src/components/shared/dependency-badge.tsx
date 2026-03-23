import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link2 } from "lucide-react";

interface DependencyBadgeProps {
  depends: string[];
  /** Lookup map: item ID -> item name for display */
  itemNames: Record<string, string>;
}

export function DependencyBadge({ depends, itemNames }: DependencyBadgeProps) {
  if (depends.length === 0) return null;

  const names = depends.map((id) => itemNames[id] ?? id).join(", ");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground" />
          }
        >
          <Link2 className="h-3 w-3" />
          {depends.length}
        </TooltipTrigger>
        <TooltipContent>
          <p>Depends on: {names}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
