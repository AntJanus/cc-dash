import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { CategoryBadge } from "@/components/shared/category-badge";
import { DependencyBadge } from "@/components/shared/dependency-badge";
import type { BoardItem } from "./roadmap-board";

interface RoadmapCardProps {
  item: BoardItem;
  sessionRefs: Record<string, string>;
  itemNames: Record<string, string>;
}

/**
 * A Kanban board card for a roadmap item.
 * Shows name, description, category badge, dependencies, dates, and session link.
 */
export function RoadmapCard({
  item,
  sessionRefs,
  itemNames,
}: RoadmapCardProps) {
  const sessionUrl = sessionRefs[item.id];

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {item.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge slug={item.categorySlug} title={item.categoryTitle} />
          {item.depends && item.depends.length > 0 && (
            <DependencyBadge depends={item.depends} itemNames={itemNames} />
          )}
        </div>
        {(item.started || item.completed) && (
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            {item.started && <span>Started: {item.started}</span>}
            {item.completed && <span>Completed: {item.completed}</span>}
          </div>
        )}
        {sessionUrl && (
          <Link
            href={sessionUrl}
            data-testid="session-link"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View session
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
