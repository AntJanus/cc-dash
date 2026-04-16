import { describe, it, expect } from "vitest";
import {
  parseCoAuthors,
  buildAgentSummaries,
  type AgentCommit,
} from "@/lib/activity/get-agent-activity";

describe("parseCoAuthors", () => {
  it("extracts a single Co-Authored-By line", () => {
    const body =
      "Some commit message\n\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>";
    const result = parseCoAuthors(body);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "Claude Opus 4.6",
      email: "noreply@anthropic.com",
    });
  });

  it("extracts agent name with parenthetical info", () => {
    const body =
      "feat: something\n\nCo-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>";
    const result = parseCoAuthors(body);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Claude Opus 4.6 (1M context)");
  });

  it("extracts multiple Co-Authored-By lines", () => {
    const body = [
      "feat: collaborative work",
      "",
      "Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>",
      "Co-Authored-By: GitHub Copilot <copilot@github.com>",
    ].join("\n");
    const result = parseCoAuthors(body);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Claude Opus 4.6");
    expect(result[1].name).toBe("GitHub Copilot");
  });

  it("returns empty array when no Co-Authored-By present", () => {
    expect(parseCoAuthors("just a normal commit\n\nbody text")).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(parseCoAuthors("")).toEqual([]);
  });

  it("handles case-insensitive matching", () => {
    const body = "co-authored-by: Some Agent <agent@test.com>";
    const result = parseCoAuthors(body);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Some Agent");
  });

  it("trims whitespace from name and email", () => {
    const body = "Co-Authored-By:  Claude Opus 4.6  < noreply@anthropic.com >";
    const result = parseCoAuthors(body);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Claude Opus 4.6");
  });
});

function makeCommit(overrides: Partial<AgentCommit> = {}): AgentCommit {
  return {
    hash: "abc1234",
    subject: "feat: something",
    date: "2026-04-10T12:00:00Z",
    projectSlug: "test-project",
    projectName: "Test Project",
    agentName: "Claude Opus 4.6",
    agentEmail: "noreply@anthropic.com",
    ...overrides,
  };
}

describe("buildAgentSummaries", () => {
  it("aggregates commits by agent", () => {
    const commits = [
      makeCommit({ hash: "a1" }),
      makeCommit({ hash: "a2" }),
      makeCommit({
        hash: "b1",
        agentName: "GitHub Copilot",
        agentEmail: "copilot@github.com",
      }),
    ];

    const summaries = buildAgentSummaries(commits);
    expect(summaries).toHaveLength(2);
    expect(summaries[0].name).toBe("Claude Opus 4.6");
    expect(summaries[0].totalCommits).toBe(2);
    expect(summaries[1].name).toBe("GitHub Copilot");
    expect(summaries[1].totalCommits).toBe(1);
  });

  it("groups project contributions per agent", () => {
    const commits = [
      makeCommit({
        hash: "a1",
        projectSlug: "proj-a",
        projectName: "Project A",
      }),
      makeCommit({
        hash: "a2",
        projectSlug: "proj-a",
        projectName: "Project A",
      }),
      makeCommit({
        hash: "a3",
        projectSlug: "proj-b",
        projectName: "Project B",
      }),
    ];

    const summaries = buildAgentSummaries(commits);
    expect(summaries[0].projects).toHaveLength(2);
    expect(summaries[0].projects[0].slug).toBe("proj-a");
    expect(summaries[0].projects[0].commitCount).toBe(2);
    expect(summaries[0].projects[1].slug).toBe("proj-b");
    expect(summaries[0].projects[1].commitCount).toBe(1);
  });

  it("sorts agents by total commits descending", () => {
    const commits = [
      makeCommit({ hash: "a1", agentName: "Agent A" }),
      makeCommit({ hash: "b1", agentName: "Agent B" }),
      makeCommit({ hash: "b2", agentName: "Agent B" }),
      makeCommit({ hash: "b3", agentName: "Agent B" }),
    ];

    const summaries = buildAgentSummaries(commits);
    expect(summaries[0].name).toBe("Agent B");
    expect(summaries[0].totalCommits).toBe(3);
    expect(summaries[1].name).toBe("Agent A");
    expect(summaries[1].totalCommits).toBe(1);
  });

  it("tracks most recent activity date", () => {
    const commits = [
      makeCommit({ hash: "a1", date: "2026-04-10T12:00:00Z" }),
      makeCommit({ hash: "a2", date: "2026-04-14T12:00:00Z" }),
      makeCommit({ hash: "a3", date: "2026-04-12T12:00:00Z" }),
    ];

    const summaries = buildAgentSummaries(commits);
    expect(summaries[0].lastActive).toBe("2026-04-14T12:00:00Z");
  });

  it("returns empty array for no commits", () => {
    expect(buildAgentSummaries([])).toEqual([]);
  });

  it("sorts projects within agent by commit count descending", () => {
    const commits = [
      makeCommit({ hash: "a1", projectSlug: "few", projectName: "Few" }),
      makeCommit({ hash: "a2", projectSlug: "many", projectName: "Many" }),
      makeCommit({ hash: "a3", projectSlug: "many", projectName: "Many" }),
      makeCommit({ hash: "a4", projectSlug: "many", projectName: "Many" }),
    ];

    const summaries = buildAgentSummaries(commits);
    expect(summaries[0].projects[0].slug).toBe("many");
    expect(summaries[0].projects[1].slug).toBe("few");
  });
});
