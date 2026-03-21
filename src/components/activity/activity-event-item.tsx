"use client";

import Link from "next/link";
import { CheckCircle2, PlayCircle, Terminal, CheckSquare } from "lucide-react";
import { RelativeTime } from "@/components/shared/relative-time";
import type { ActivityEvent, ActivityEventType } from "@/lib/activity/types";

const EVENT_ICONS: Record<ActivityEventType, typeof CheckCircle2> = {
  roadmap_item_completed: CheckCircle2,
  roadmap_item_started: PlayCircle,
  session_started: Terminal,
  session_work_completed: CheckSquare,
};

const EVENT_COLORS: Record<ActivityEventType, string> = {
  roadmap_item_completed: "text-[var(--status-active)]",
  roadmap_item_started: "text-[var(--status-complete)]",
  session_started: "text-primary",
  session_work_completed: "text-[var(--status-active)]",
};

interface ActivityEventItemProps {
  event: ActivityEvent;
  compact?: boolean;
}

export function ActivityEventItem({
  event,
  compact = false,
}: ActivityEventItemProps) {
  const Icon = EVENT_ICONS[event.type];
  const colorClass = EVENT_COLORS[event.type];

  return (
    <div
      data-testid="activity-event-item"
      className={`flex items-start gap-3 border-l-2 border-muted pl-3 ${compact ? "py-2" : "py-3.5"}`}
    >
      <div className={`mt-0.5 shrink-0 ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base">
          <span className="font-medium">{event.title}</span>
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
          {event.link ? (
            <Link
              href={event.link}
              className="hover:text-foreground hover:underline"
            >
              {event.projectName}
            </Link>
          ) : (
            <span>{event.projectName}</span>
          )}
          <span>&middot;</span>
          <RelativeTime iso={event.timestamp} />
        </div>
        {!compact && event.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {event.description}
          </p>
        )}
      </div>
    </div>
  );
}
