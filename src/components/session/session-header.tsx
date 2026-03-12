"use client";

import Link from "next/link";
import { SessionStatusBadge } from "@/components/session/session-status-badge";
import { RelativeTime } from "@/components/shared/relative-time";

interface SessionHeaderProps {
  sessionId: string;
  status: string;
  roadmapRef?: string;
  started: string;
  lastUpdated: string;
  slug: string;
  onStatusChange: (status: string) => void;
}

export function SessionHeader({
  sessionId,
  status,
  roadmapRef,
  started,
  lastUpdated,
  slug,
  onStatusChange,
}: SessionHeaderProps) {
  return (
    <div className="sticky top-0 z-10 border-b bg-background pb-4 mb-4">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-xl font-semibold">{sessionId}</h1>
        <SessionStatusBadge status={status} onStatusChange={onStatusChange} />
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {roadmapRef && (
          <span>
            Roadmap:{" "}
            <Link
              href={`/project/${slug}/roadmap`}
              className="text-primary hover:underline"
            >
              {roadmapRef}
            </Link>
          </span>
        )}

        <span className="flex items-center gap-1">
          Started <RelativeTime iso={started} />
        </span>

        <span className="flex items-center gap-1">
          Last updated <RelativeTime iso={lastUpdated} />
        </span>
      </div>
    </div>
  );
}
