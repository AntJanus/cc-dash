"use client";

import Link from "next/link";
import { Map, Terminal, Lightbulb } from "lucide-react";
import { RoadmapStatusBadge } from "@/components/shared/roadmap-status-badge";
import { Badge } from "@/components/ui/badge";
import type {
  SearchResult,
  RoadmapItemStatus,
  IdeaStatus,
} from "@/lib/actions/search-actions";

interface SearchResultCardProps {
  result: SearchResult;
}

const TYPE_ICONS = {
  roadmap: Map,
  session: Terminal,
  idea: Lightbulb,
} as const;

const TYPE_COLORS = {
  roadmap: {
    bg: "var(--accent-teal-light)",
    fg: "var(--accent-teal)",
  },
  session: {
    bg: "var(--accent-emerald-light)",
    fg: "var(--accent-emerald)",
  },
  idea: {
    bg: "var(--accent-violet-light)",
    fg: "var(--accent-violet)",
  },
} as const;

const IDEA_STATUS_CONFIG: Record<
  IdeaStatus,
  { label: string; className: string }
> = {
  "not-started": {
    label: "Not Started",
    className:
      "bg-[var(--status-inactive-bg)] text-[var(--status-inactive)] border-[var(--status-inactive)]/20",
  },
  started: {
    label: "Started",
    className:
      "bg-[var(--status-stalled-bg)] text-[var(--status-stalled)] border-[var(--status-stalled)]/20",
  },
  complete: {
    label: "Complete",
    className:
      "bg-[var(--status-active-bg)] text-[var(--status-active)] border-[var(--status-active)]/20",
  },
};

const SESSION_TASK_STATUS_CONFIG: Record<
  "pending" | "done",
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className:
      "bg-[var(--status-inactive-bg)] text-[var(--status-inactive)] border-[var(--status-inactive)]/20",
  },
  done: {
    label: "Done",
    className:
      "bg-[var(--status-active-bg)] text-[var(--status-active)] border-[var(--status-active)]/20",
  },
};

function StatusBadge({ result }: { result: SearchResult }) {
  if (result.type === "roadmap") {
    return <RoadmapStatusBadge status={result.status as RoadmapItemStatus} />;
  }

  if (result.type === "idea") {
    const config = IDEA_STATUS_CONFIG[result.status as IdeaStatus];
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  }

  // session task
  const taskStatus = result.status as "pending" | "done";
  const config = SESSION_TASK_STATUS_CONFIG[taskStatus];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  const Icon = TYPE_ICONS[result.type];
  const colors = TYPE_COLORS[result.type];

  return (
    <Link
      href={result.link}
      data-testid="search-result-card"
      className="interactive-card block rounded-lg border p-4"
      style={{
        background: "var(--bg-panel)",
        borderColor: "var(--border-light)",
      }}
    >
      <div className="flex items-start gap-3">
        {/* Type icon */}
        <span
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ background: colors.bg, color: colors.fg }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>

        <div className="min-w-0 flex-1">
          {/* Title + status */}
          <div className="flex items-start justify-between gap-2">
            <p
              className="text-base font-medium leading-snug"
              style={{ color: "var(--text-primary)" }}
            >
              {result.title}
            </p>
            <div className="shrink-0">
              <StatusBadge result={result} />
            </div>
          </div>

          {/* Description */}
          {result.description && (
            <p
              className="mt-1 line-clamp-2 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {result.description}
            </p>
          )}

          {/* Project name */}
          <p
            className="mt-2 text-sm font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            {result.projectName}
          </p>
        </div>
      </div>
    </Link>
  );
}
