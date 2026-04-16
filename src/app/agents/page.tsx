import { Bot, Users, FolderGit2, GitCommit } from "lucide-react";
import { getAgentActivity } from "@/lib/activity/get-agent-activity";
import { AgentActivityFeed } from "@/components/agents/agent-activity-feed";

export default async function AgentsPage() {
  const activity = await getAgentActivity(100);

  return (
    <main className="p-8 lg:p-10">
      <h1 className="mb-8 text-xl font-semibold">Agent Activity</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <SummaryCard
          icon={GitCommit}
          label="Agent Commits"
          value={activity.totalCommits}
          color="violet"
        />
        <SummaryCard
          icon={Users}
          label="Unique Agents"
          value={activity.uniqueAgents}
          color="teal"
        />
        <SummaryCard
          icon={FolderGit2}
          label="Projects Touched"
          value={activity.projectsWithAgents}
          color="blue"
        />
      </div>

      {/* Agent breakdown */}
      {activity.agents.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{
                background: "var(--accent-violet-light)",
                color: "var(--accent-violet)",
              }}
            >
              <Bot className="h-4 w-4" />
            </div>
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Agents
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activity.agents.map((agent) => (
              <div
                key={agent.name}
                className="rounded-xl p-4"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-light)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Bot
                    className="h-4 w-4"
                    style={{ color: "var(--accent-violet)" }}
                  />
                  <span
                    className="text-sm font-semibold truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {agent.name}
                  </span>
                </div>
                <p
                  className="text-sm mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {agent.totalCommits} commit
                  {agent.totalCommits !== 1 ? "s" : ""} across{" "}
                  {agent.projects.length} project
                  {agent.projects.length !== 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {agent.projects.slice(0, 5).map((p) => (
                    <span
                      key={p.slug}
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-sm"
                      style={{
                        background: "var(--accent-teal-light)",
                        color: "var(--accent-teal)",
                      }}
                    >
                      {p.name}
                      <span className="ml-1 opacity-70">{p.commitCount}</span>
                    </span>
                  ))}
                  {agent.projects.length > 5 && (
                    <span
                      className="text-sm px-2 py-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      +{agent.projects.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commit feed */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{
            background: "var(--accent-blue-light)",
            color: "var(--accent-blue)",
          }}
        >
          <GitCommit className="h-4 w-4" />
        </div>
        <h2
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Recent Commits
        </h2>
      </div>
      <AgentActivityFeed commits={activity.commits} agents={activity.agents} />
    </main>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-light)",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" style={{ color: `var(--accent-${color})` }} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
      </div>
      <p
        className="text-2xl font-bold"
        style={{ color: `var(--accent-${color})` }}
      >
        {value}
      </p>
    </div>
  );
}
