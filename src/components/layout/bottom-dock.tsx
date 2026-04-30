"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { FolderTab, FolderTabs } from "@/components/ui/folder-tab";
import {
  ToolTracePanel,
  type ToolTraceEntry,
} from "@/components/ui/tool-trace";
import { AgentChip } from "@/components/ui/agent-chip";

type DockPane = "trace" | "active" | "filters";

export interface DockTraceEntry {
  hash: string;
  date: string;
  agentName: string;
  projectName: string;
  projectSlug: string;
  subject: string;
}

export interface DockActiveProject {
  slug: string;
  name: string;
  commitCount: number;
  lastActive: string;
}

export interface BottomDockProps {
  /** Latest commits across the portfolio. */
  trace: DockTraceEntry[];
  /** Projects with the most recent activity. */
  active: DockActiveProject[];
}

const QUICK_FILTERS: Array<{ label: string; href: string; tone: string }> = [
  { label: "All", href: "/", tone: "pill-tag" },
  { label: "Active", href: "/?status=active", tone: "pill-tag pill-tag-moss" },
  {
    label: "Stalled",
    href: "/?status=stalled",
    tone: "pill-tag pill-tag-gold",
  },
  {
    label: "Complete",
    href: "/?status=complete",
    tone: "pill-tag pill-tag-sky",
  },
];

const QUICK_LINKS: Array<{ label: string; href: string }> = [
  { label: "Search", href: "/search" },
  { label: "Ideas", href: "/ideas" },
  { label: "Activity", href: "/activity" },
  { label: "Metrics", href: "/metrics" },
  { label: "Agents", href: "/agents" },
  { label: "Style guide", href: "/styleguide" },
];

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return iso;
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

export function BottomDock({ trace, active }: BottomDockProps) {
  const [pane, setPane] = useState<DockPane>("trace");
  const [expanded, setExpanded] = useState<boolean>(false);

  const traceEntries: ToolTraceEntry[] = useMemo(
    () =>
      trace.slice(0, 10).map((t) => ({
        id: t.hash,
        timestamp: formatRelative(t.date),
        actor: t.agentName,
        action: `${t.projectName}: ${t.subject}`,
        state: "draft",
      })),
    [trace],
  );

  return (
    <div
      data-slot="bottom-dock"
      data-expanded={expanded ? "true" : "false"}
      className={cn("bottom-dock", expanded && "bottom-dock-expanded")}
    >
      <div className="bottom-dock-rail">
        <FolderTabs variant="detached" className="bottom-dock-tabs">
          <FolderTab
            active={pane === "trace"}
            onClick={() => {
              setPane("trace");
              setExpanded(true);
            }}
          >
            Tool Trace
          </FolderTab>
          <FolderTab
            active={pane === "active"}
            onClick={() => {
              setPane("active");
              setExpanded(true);
            }}
          >
            Most Active
          </FolderTab>
          <FolderTab
            active={pane === "filters"}
            onClick={() => {
              setPane("filters");
              setExpanded(true);
            }}
          >
            Quick Filters
          </FolderTab>
        </FolderTabs>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="bottom-dock-toggle"
          aria-label={expanded ? "Collapse dock" : "Expand dock"}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      {expanded && (
        <div className="bottom-dock-body">
          {pane === "trace" && (
            <ToolTracePanel
              title=""
              entries={traceEntries}
              emptyMessage="No agent commits in the recent log."
              className="bottom-dock-trace"
            />
          )}
          {pane === "active" && (
            <div className="bottom-dock-active">
              {active.length === 0 ? (
                <p className="bottom-dock-empty">No recent project activity.</p>
              ) : (
                <ul className="bottom-dock-active-list">
                  {active.slice(0, 5).map((p) => (
                    <li key={p.slug} className="bottom-dock-active-row">
                      <Link
                        href={`/project/${p.slug}/roadmap`}
                        className="bottom-dock-active-link"
                      >
                        <AgentChip
                          name={p.name}
                          state={p.commitCount > 5 ? "running" : "draft"}
                        />
                      </Link>
                      <span className="bottom-dock-active-meta">
                        {p.commitCount} commits · {formatRelative(p.lastActive)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {pane === "filters" && (
            <div className="bottom-dock-filters">
              <div className="bottom-dock-filters-group">
                <span className="bottom-dock-filters-label">Status</span>
                <div className="flex flex-wrap gap-2">
                  {QUICK_FILTERS.map((f) => (
                    <Link key={f.label} href={f.href} className={f.tone}>
                      {f.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="bottom-dock-filters-group">
                <span className="bottom-dock-filters-label">Jump to</span>
                <div className="flex flex-wrap gap-2">
                  {QUICK_LINKS.map((l) => (
                    <Link key={l.label} href={l.href} className="pill-tag">
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
