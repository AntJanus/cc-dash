import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AgentActivityFeed } from "@/components/agents/agent-activity-feed";
import type {
  AgentCommit,
  AgentSummary,
} from "@/lib/activity/get-agent-activity";

function makeCommit(overrides: Partial<AgentCommit> = {}): AgentCommit {
  return {
    hash: "abc1234",
    subject: "feat: test commit",
    date: "2026-04-14T12:00:00Z",
    projectSlug: "test-project",
    projectName: "Test Project",
    agentName: "Claude Opus 4.6",
    agentEmail: "noreply@anthropic.com",
    ...overrides,
  };
}

const defaultAgents: AgentSummary[] = [
  {
    name: "Claude Opus 4.6",
    totalCommits: 3,
    projects: [{ slug: "test-project", name: "Test Project", commitCount: 3 }],
    lastActive: "2026-04-14T12:00:00Z",
  },
];

describe("AgentActivityFeed", () => {
  afterEach(cleanup);

  it("renders commit subjects", () => {
    const commits = [
      makeCommit({ hash: "a1", subject: "feat: first commit" }),
      makeCommit({ hash: "a2", subject: "fix: second commit" }),
    ];
    render(<AgentActivityFeed commits={commits} agents={defaultAgents} />);

    expect(screen.getByText("feat: first commit")).toBeInTheDocument();
    expect(screen.getByText("fix: second commit")).toBeInTheDocument();
  });

  it("shows commit count", () => {
    const commits = [makeCommit(), makeCommit({ hash: "a2" })];
    render(<AgentActivityFeed commits={commits} agents={defaultAgents} />);

    expect(screen.getByText("2 commits")).toBeInTheDocument();
  });

  it("shows empty message when no commits", () => {
    render(<AgentActivityFeed commits={[]} agents={[]} />);
    expect(screen.getByText(/No agent commits found/)).toBeInTheDocument();
  });

  it("filters by agent when selected", () => {
    const commits = [
      makeCommit({
        hash: "a1",
        agentName: "Claude Opus 4.6",
        subject: "opus commit",
      }),
      makeCommit({
        hash: "b1",
        agentName: "Copilot",
        subject: "copilot commit",
      }),
    ];
    const agents: AgentSummary[] = [
      {
        name: "Claude Opus 4.6",
        totalCommits: 1,
        projects: [],
        lastActive: "",
      },
      { name: "Copilot", totalCommits: 1, projects: [], lastActive: "" },
    ];
    render(<AgentActivityFeed commits={commits} agents={agents} />);

    // Select Copilot filter
    const agentSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(agentSelect, { target: { value: "Copilot" } });

    expect(screen.getByText("copilot commit")).toBeInTheDocument();
    expect(screen.queryByText("opus commit")).not.toBeInTheDocument();
    expect(screen.getByText("1 commit")).toBeInTheDocument();
  });

  it("filters by project when selected", () => {
    const commits = [
      makeCommit({
        hash: "a1",
        projectSlug: "proj-a",
        projectName: "Project A",
        subject: "in A",
      }),
      makeCommit({
        hash: "b1",
        projectSlug: "proj-b",
        projectName: "Project B",
        subject: "in B",
      }),
    ];
    render(<AgentActivityFeed commits={commits} agents={defaultAgents} />);

    const projectSelect = screen.getAllByRole("combobox")[1];
    fireEvent.change(projectSelect, { target: { value: "proj-a" } });

    expect(screen.getByText("in A")).toBeInTheDocument();
    expect(screen.queryByText("in B")).not.toBeInTheDocument();
  });

  it("clear button resets filters", () => {
    const commits = [
      makeCommit({ hash: "a1", subject: "commit a" }),
      makeCommit({ hash: "b1", agentName: "Other", subject: "commit b" }),
    ];
    const agents: AgentSummary[] = [
      {
        name: "Claude Opus 4.6",
        totalCommits: 1,
        projects: [],
        lastActive: "",
      },
      { name: "Other", totalCommits: 1, projects: [], lastActive: "" },
    ];
    render(<AgentActivityFeed commits={commits} agents={agents} />);

    // Apply filter
    const agentSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(agentSelect, { target: { value: "Other" } });
    expect(screen.getByText("1 commit")).toBeInTheDocument();

    // Clear
    fireEvent.click(screen.getByText("Clear"));
    expect(screen.getByText("2 commits")).toBeInTheDocument();
  });
});
