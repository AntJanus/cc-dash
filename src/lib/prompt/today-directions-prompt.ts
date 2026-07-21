/**
 * Pure assembly for the "Today's Directions" generation prompt.
 *
 * The output is a complete, copy-pasteable prompt the user feeds to a
 * Claude agent running from the configured orchestrator directory. The prompt embeds
 * current portfolio context (sessions touched today, top QA items,
 * recommended-projects scoring) so the agent does not have to re-derive
 * it, and instructs the agent to produce a single
 * `TODAYS_DIRECTIONS.md` file conforming to `cc-dash/today-directions@1`.
 */

import type { ProjectCardData } from "@/lib/projects/get-projects";
import type { RecommendedPick } from "@/lib/projects/pick-recommended";

export interface TodayQaSummary {
  qaId: string;
  slug: string;
  projectName: string;
  description: string;
}

export interface AssembleTodayDirectionsInput {
  now: Date;
  sessionsToday: ProjectCardData[];
  topQa: TodayQaSummary[];
  recommended: RecommendedPick[];
  /** Portfolio-level directory the agent runs from. Defaults to `~/projects`. */
  orchestratorDir?: string;
}

/** Rewrite an absolute home-relative path back to a `~`-prefixed one. */
function tildify(absolutePath: string): string {
  return absolutePath.replace(/^\/(?:Users|home)\/[^/]+/, "~");
}

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatSessionsToday(projects: ProjectCardData[]): string {
  if (projects.length === 0) {
    return "  (no sessions touched today)";
  }
  return projects
    .map((project) => {
      const working = project.sessionStatusText
        ? ` — ${project.sessionStatusText}`
        : "";
      return `  - ${project.name}${working}`;
    })
    .join("\n");
}

function formatTopQa(items: TodayQaSummary[]): string {
  if (items.length === 0) {
    return "  (no pending QA items across the portfolio)";
  }
  return items
    .map(
      (item) =>
        `  - [ ] <!-- ref:${item.qaId} slug:${item.slug} --> ${item.description}  (project: ${item.projectName})`,
    )
    .join("\n");
}

function formatRecommended(picks: RecommendedPick[]): string {
  if (picks.length === 0) {
    return "  (no strong recommendations right now)";
  }
  return picks
    .map((pick) => {
      const tags = pick.whyTags.join(", ");
      const action =
        pick.project.nextAction?.name ?? "(no roadmap next action)";
      return `  - ${pick.project.name} [${tags}] — ${action}`;
    })
    .join("\n");
}

/**
 * Assemble the agent prompt for generating TODAYS_DIRECTIONS.md.
 *
 * The output is plain text intended to be copied into an interactive
 * Claude session running from the configured orchestrator directory.
 */
export function assembleTodayDirectionsPrompt(
  input: AssembleTodayDirectionsInput,
): string {
  const { now, sessionsToday, topQa, recommended } = input;
  const orchestratorDir = input.orchestratorDir ?? "~/projects";
  const outputFile = `${orchestratorDir}/TODAYS_DIRECTIONS.md`;
  const todayDate = isoDate(now);

  const recommendedDispatch = recommended
    .map((pick) => {
      const action = pick.project.nextAction?.name ?? "advance the roadmap";
      const repoPath = tildify(pick.project.path);
      const promptLine = action.replace(/"/g, '\\"');
      return `cd ${repoPath} && claude -p "${promptLine}"`;
    })
    .join("\n");

  return `You are the Today's Directions agent for the project portfolio at \`${orchestratorDir}\`.

Write a single file at:

  ${outputFile}

It must conform to the \`cc-dash/today-directions@1\` schema. The cc-dash dashboard at \`http://localhost:3737/today\` renders this file directly, so the format is strict.

## Required output format

\`\`\`markdown
---
schema: cc-dash/today-directions@1
generated: <ISO 8601 timestamp with timezone offset, e.g. 2026-05-07T08:30:00-06:00>
for_date: ${todayDate}
---

# Today's Directions

## Active sessions to advance
- **<project-name>** — <one-line working-on summary>

## QA items to run today
- [ ] <!-- ref:q_xxxxx slug:<project-slug> --> <description>

## Concurrent dispatch plan
\`\`\`bash
# Run these in parallel from separate terminals.
cd <orchestrator-dir>/<repo-a> && claude -p "<terse, concrete prompt>"
cd <orchestrator-dir>/<repo-b> && claude -p "<terse, concrete prompt>"
\`\`\`

## Notes
<2-4 short bullets on priorities, blockers, decisions to make today>
\`\`\`

The QA \`<!-- ref:q_xxxxx slug:project -->\` markers are load-bearing — the dashboard parses them and ticking a box on the dashboard mutates the underlying \`QA.md\`. Preserve the exact format including the \`q_\` prefix and the \`slug:\` key.

## Current portfolio state (use as the source for the file you write)

### Sessions touched today
${formatSessionsToday(sessionsToday)}

### Top pending QA items
${formatTopQa(topQa)}

### Recommended projects (Up Next)
${formatRecommended(recommended)}

## Suggested concurrent dispatch (refine before writing)
${recommendedDispatch || "  (no recommendations to dispatch)"}

## Instructions

1. Use the Bash and Write tools to create \`${outputFile}\`. If a previous version exists, overwrite it.
2. Set \`generated\` to the actual current ISO 8601 timestamp at write time, with the local timezone offset.
3. Set \`for_date\` to \`${todayDate}\`.
4. For each session listed above, write a bullet under "Active sessions to advance" with the project name and current working-on line.
5. Under "QA items to run today", include the QA items above using the exact \`<!-- ref:q_xxxxx slug:project -->\` marker format. Add others if you read state that suggests today's bandwidth is larger.
6. Refine the concurrent dispatch plan: each \`cd ... && claude -p "..."\` line should target the recommended repo with a tight, concrete prompt scoped to that repo's next action — not a vague "make progress" string.
7. Keep "Notes" to 2-4 lines, focusing on priorities, blockers, or decisions the operator needs to make today.
8. After writing, print the file path and a one-line summary; do not dispatch the subagents yourself — the operator runs the bash block manually.
`;
}
