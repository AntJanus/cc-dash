"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, GitCommit, Filter } from "lucide-react";
import type {
  AgentCommit,
  AgentSummary,
} from "@/lib/activity/get-agent-activity";

interface AgentActivityFeedProps {
  commits: AgentCommit[];
  agents: AgentSummary[];
}

export function AgentActivityFeed({ commits, agents }: AgentActivityFeedProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const projectList = Array.from(
    new Map(commits.map((c) => [c.projectSlug, c.projectName])),
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const filtered = commits.filter((c) => {
    if (selectedAgent && c.agentName !== selectedAgent) return false;
    if (selectedProject && c.projectSlug !== selectedProject) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex items-center gap-2 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <Filter className="h-4 w-4" />
          <span>Filter:</span>
        </div>
        <select
          value={selectedAgent ?? ""}
          onChange={(e) => setSelectedAgent(e.target.value || null)}
          className="rounded-lg px-3 py-1.5 text-sm"
          style={{
            background: "var(--bg-accent)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-light)",
          }}
        >
          <option value="">All agents</option>
          {agents.map((a) => (
            <option key={a.name} value={a.name}>
              {a.name} ({a.totalCommits})
            </option>
          ))}
        </select>
        <select
          value={selectedProject ?? ""}
          onChange={(e) => setSelectedProject(e.target.value || null)}
          className="rounded-lg px-3 py-1.5 text-sm"
          style={{
            background: "var(--bg-accent)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-light)",
          }}
        >
          <option value="">All projects</option>
          {projectList.map(([slug, name]) => (
            <option key={slug} value={slug}>
              {name}
            </option>
          ))}
        </select>
        {(selectedAgent || selectedProject) && (
          <button
            type="button"
            onClick={() => {
              setSelectedAgent(null);
              setSelectedProject(null);
            }}
            className="text-sm px-2 py-1 rounded-lg transition-colors hover:bg-sidebar-accent"
            style={{ color: "var(--text-muted)" }}
          >
            Clear
          </button>
        )}
        <span
          className="text-sm ml-auto"
          style={{ color: "var(--text-muted)" }}
        >
          {filtered.length} commit{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Commit list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p
            className="text-sm py-8 text-center"
            style={{ color: "var(--text-muted)" }}
          >
            No agent commits found.
          </p>
        ) : (
          filtered
            .slice(0, 100)
            .map((commit) => (
              <CommitRow
                key={`${commit.hash}-${commit.projectSlug}`}
                commit={commit}
              />
            ))
        )}
        {filtered.length > 100 && (
          <p
            className="text-sm text-center py-2"
            style={{ color: "var(--text-muted)" }}
          >
            Showing first 100 of {filtered.length} commits.
          </p>
        )}
      </div>
    </div>
  );
}

function CommitRow({ commit }: { commit: AgentCommit }) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg p-3"
      style={{ background: "var(--bg-accent)" }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
        style={{
          background: "var(--accent-violet-light)",
          color: "var(--accent-violet)",
        }}
      >
        <GitCommit className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {commit.subject}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
          <Link
            href={`/project/${commit.projectSlug}/roadmap`}
            className="text-sm hover:underline"
            style={{ color: "var(--accent-teal)" }}
          >
            {commit.projectName}
          </Link>
          <span
            className="flex items-center gap-1 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            <Bot className="h-3 w-3" />
            {commit.agentName}
          </span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {formatDate(commit.date)}
          </span>
          <code
            className="text-sm font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            {commit.hash}
          </code>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
