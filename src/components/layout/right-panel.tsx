"use client";

import Link from "next/link";
import {
  BarChart3,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  Bell,
} from "lucide-react";
import type { ActivityEvent } from "@/lib/activity/types";

interface RightPanelProps {
  stats: {
    active: number;
    stalled: number;
    complete: number;
    totalTasks: number;
  };
  recentActivity: ActivityEvent[];
  alerts: { type: "warning" | "info"; title: string; description: string }[];
}

export function RightPanel({ stats, recentActivity, alerts }: RightPanelProps) {
  return (
    <aside className="hidden xl:flex flex-col border-l border-border bg-card w-[340px] overflow-y-auto">
      {/* Overview section */}
      <section className="border-b border-[var(--border-light)] p-5">
        <div className="mb-4 flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{
              background: "var(--accent-teal-light)",
              color: "var(--accent-teal)",
            }}
          >
            <BarChart3 className="h-3.5 w-3.5" />
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Overview
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <ResourceCard
            icon={Zap}
            value={stats.active}
            label="Active"
            color="emerald"
            href="/?status=active"
          />
          <ResourceCard
            icon={AlertCircle}
            value={stats.stalled}
            label="Stalled"
            color="amber"
            href="/?status=stalled"
          />
          <ResourceCard
            icon={CheckCircle}
            value={stats.complete}
            label="Complete"
            color="blue"
            href="/?status=complete"
          />
          <ResourceCard
            icon={BarChart3}
            value={stats.totalTasks}
            label="Tasks"
            color="violet"
          />
        </div>
      </section>

      {/* Recent Activity section */}
      <section className="border-b border-[var(--border-light)] p-5">
        <div className="mb-4 flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{
              background: "var(--accent-blue-light)",
              color: "var(--accent-blue)",
            }}
          >
            <Clock className="h-3.5 w-3.5" />
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Recent Activity
          </span>
        </div>

        <div className="space-y-0">
          {recentActivity.slice(0, 3).map((event, i) => (
            <TimelineItem key={i} event={event} isLast={i === 2} />
          ))}
        </div>
      </section>

      {/* Alerts section */}
      {alerts.length > 0 && (
        <section className="flex-1 p-5">
          <div className="mb-4 flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{
                background: "var(--accent-amber-light)",
                color: "var(--accent-amber)",
              }}
            >
              <Bell className="h-3.5 w-3.5" />
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Alerts
            </span>
          </div>

          <div className="space-y-2.5">
            {alerts.map((alert, i) => (
              <AlertItem key={i} {...alert} />
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}

interface ResourceCardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  color: "emerald" | "amber" | "blue" | "violet";
  href?: string;
}

const COLOR_STYLES = {
  emerald: {
    bg: "var(--accent-emerald-light)",
    fg: "var(--accent-emerald)",
  },
  amber: {
    bg: "var(--accent-amber-light)",
    fg: "var(--accent-amber)",
  },
  blue: {
    bg: "var(--accent-blue-light)",
    fg: "var(--accent-blue)",
  },
  violet: {
    bg: "var(--accent-violet-light)",
    fg: "var(--accent-violet)",
  },
};

function ResourceCard({
  icon: Icon,
  value,
  label,
  color,
  href,
}: ResourceCardProps) {
  const styles = COLOR_STYLES[color];

  const content = (
    <>
      <div
        className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ background: styles.bg, color: styles.fg }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span
        className="text-xl font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </span>
      <span className="text-sm" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
    </>
  );

  const className =
    "flex flex-col items-center rounded-lg p-3.5 text-center transition-all";

  if (href) {
    return (
      <Link
        href={href}
        className={`${className} hover:ring-2 hover:ring-offset-1 cursor-pointer`}
        style={{
          background: "var(--bg-accent)",
          // @ts-expect-error CSS custom property
          "--tw-ring-color": styles.fg,
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={className} style={{ background: "var(--bg-accent)" }}>
      {content}
    </div>
  );
}

interface TimelineItemProps {
  event: ActivityEvent;
  isLast: boolean;
}

function TimelineItem({ event, isLast }: TimelineItemProps) {
  const iconConfig = getTimelineIcon(event.type);

  return (
    <div className="relative flex gap-3 py-3">
      {/* Connector line */}
      {!isLast && (
        <div
          className="absolute left-4 top-10 bottom-0 w-px"
          style={{ background: "var(--border-light)" }}
        />
      )}

      {/* Icon */}
      <div
        className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: iconConfig.bg,
          color: iconConfig.fg,
        }}
      >
        <iconConfig.icon className="h-3.5 w-3.5" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className="text-sm font-medium truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {event.title}
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {event.projectName} · {formatTimeAgo(event.timestamp)}
        </p>
      </div>
    </div>
  );
}

function getTimelineIcon(type: ActivityEvent["type"]) {
  switch (type) {
    case "roadmap_item_completed":
    case "session_work_completed":
      return {
        icon: CheckCircle,
        bg: "var(--accent-emerald-light)",
        fg: "var(--accent-emerald)",
      };
    case "session_started":
    case "roadmap_item_started":
      return {
        icon: Play,
        bg: "var(--accent-blue-light)",
        fg: "var(--accent-blue)",
      };
    default:
      return {
        icon: Clock,
        bg: "var(--accent-teal-light)",
        fg: "var(--accent-teal)",
      };
  }
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

interface AlertItemProps {
  type: "warning" | "info";
  title: string;
  description: string;
}

function AlertItem({ type, title, description }: AlertItemProps) {
  const bgColor =
    type === "warning" ? "var(--accent-amber-bg)" : "var(--accent-blue-bg)";
  const iconColor =
    type === "warning" ? "var(--accent-amber)" : "var(--accent-blue)";
  const Icon = type === "warning" ? AlertCircle : CheckCircle;

  return (
    <div
      className="flex items-start gap-3 rounded-lg p-3"
      style={{ background: bgColor }}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: iconColor }} />
      <div className="min-w-0 flex-1">
        <p
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
      </div>
    </div>
  );
}
