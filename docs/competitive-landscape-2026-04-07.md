# Competitive Landscape Research: cc-dash

**Date:** 2026-04-07
**Scope:** Developer dashboards, AI-powered PM tools, Claude Code ecosystem, markdown-based project managers

---

## Part 1: Projects to Check Out

### Closest Competitors (markdown/file-based PM)

| Project               | Stars | URL                                                                                       | What it does                                                  |
| --------------------- | ----- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Backlog.md**        | ~5.3k | [GitHub](https://github.com/MrLesk/Backlog.md)                                            | Git-native markdown project board with MCP + AI agent support |
| **Tasks.md**          | ~1.9k | [GitHub](https://github.com/BaldissaraMatheus/Tasks.md)                                   | Self-hosted Kanban: directories = lanes, files = cards        |
| **taskmd**            | new   | [Medium](https://medium.com/@driangle/taskmd-task-management-for-the-ai-era-92d8b476e24e) | One task = one .md file with YAML frontmatter, AI-first       |
| **Markdown Projects** | new   | [Site](https://www.markdownprojects.com/)                                                 | CLI-first markdown PM with JSON output                        |
| **AIPIM**             | new   | [GitHub](https://github.com/rmarsigli/aipim)                                              | Event-sourced PM with MCP server for Claude Code              |
| **Imdone**            | est.  | [Site](https://imdone.io/)                                                                | Scans TODO comments in code/markdown into Kanban              |

### AI-First Project Management for Coding Agents

| Project                | Stars | URL                                                          | What it does                                                |
| ---------------------- | ----- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| **Claude Task Master** | ~25k  | [GitHub](https://github.com/eyaltoledano/claude-task-master) | Parses PRDs into structured tasks with deps, MCP server     |
| **Vibe Kanban**        | ~24k  | [GitHub](https://github.com/BloopAI/vibe-kanban)             | Kanban for orchestrating AI agents, dual MCP client/server  |
| **CCPM**               | ~7k   | [GitHub](https://github.com/automazeio/ccpm)                 | PRDs -> GitHub Issues + worktrees for parallel agents       |
| **Gastown**            | ~8.8k | [GitHub](https://github.com/steveyegge/gastown)              | Steve Yegge's multi-agent workspace with git-backed "beads" |
| **Superset**           | ~8.7k | [GitHub](https://github.com/superset-sh/superset)            | Desktop editor for running agent swarms in parallel         |
| **Claude Squad**       | ~6.9k | [GitHub](https://github.com/smtg-ai/claude-squad)            | Terminal app managing multiple AI agents via tmux           |
| **KanVibe**            | new   | [GitHub](https://github.com/rookedsysc/kanvibe)              | Self-hosted Kanban with Claude Code Hooks integration       |
| **Kanban Code**        | new   | [GitHub](https://github.com/langwatch/kanban-code)           | Native macOS/Windows app for parallel Claude Code agents    |
| **Conductor**          | YC    | [Site](https://www.conductor.build/)                         | Mac app for orchestrating agent teams (YC S24)              |

### Session/Usage Trackers

| Project             | URL                                                      | What it does                                                |
| ------------------- | -------------------------------------------------------- | ----------------------------------------------------------- |
| **claude-code-ui**  | [GitHub](https://github.com/KyleAMathews/claude-code-ui) | Real-time dashboard monitoring Claude sessions across repos |
| **claude-sessions** | [GitHub](https://github.com/iannuttall/claude-sessions)  | Session tracking slash commands for Claude Code             |
| **ccusage**         | [GitHub](https://github.com/ryoppippi/ccusage)           | CLI for analyzing Claude Code token usage                   |

### Open-Source PM Platforms (database-backed, for context)

| Project      | Stars  | URL                                                                      |
| ------------ | ------ | ------------------------------------------------------------------------ |
| **Plane.so** | ~47k   | [Site](https://plane.so/) — has native MCP server + AI agent integration |
| **Huly**     | ~24.5k | [Site](https://huly.io/) — all-in-one PM + chat + docs                   |
| **Planka**   | ~11k   | [Site](https://planka.app/) — self-hosted Trello alternative             |

### Platform Plays

| Project                        | URL                                                                 | What it does                                                 |
| ------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| **GitHub Agentic Workflows**   | [Docs](https://github.github.com/gh-aw/)                            | AI agents in GitHub Actions for repo triage/status (preview) |
| **GitHub Copilot Planning**    | [Docs](https://docs.github.com/en/copilot/tutorials/plan-a-project) | Copilot turns ideas into issue trees with plan files         |
| **Linear Triage Intelligence** | [Site](https://linear.app/ai)                                       | AI auto-assigns priority, labels, teams                      |

### Discovery Lists

- **awesome-claude-code** (~28.5k stars): [GitHub](https://github.com/hesreallyhim/awesome-claude-code)
- **awesome-agent-orchestrators**: [GitHub](https://github.com/andyrewlee/awesome-agent-orchestrators)

### Vibe Coding / AI Dashboard Generators (for context)

| Project          | URL                                          | What it does                                                 |
| ---------------- | -------------------------------------------- | ------------------------------------------------------------ |
| **Bolt.new**     | [Site](https://bolt.new)                     | Browser-based app builder from natural language ($40M ARR)   |
| **Lovable**      | [Site](https://lovable.dev)                  | Full-stack app generator with Supabase ($20M ARR)            |
| **Replit Agent** | [Site](https://replit.com)                   | Autonomous app builder from prompts ($265M ARR)              |
| **Vercel v0**    | [Site](https://v0.dev)                       | React + Tailwind component generation from prompts           |
| **ToolJet**      | [GitHub](https://github.com/ToolJet/ToolJet) | Open-source internal tool builder with AI layer (~33k stars) |

---

## Part 2: Analysis

### What cc-dash does that nobody else does

**Cross-repo markdown aggregation is unique.** Every single tool found operates within a single repo or project. No tool scans 20+ independent repos' ROADMAP.md and SESSION_PROGRESS.md files into a unified dashboard. This is cc-dash's moat.

### What others do that cc-dash doesn't

1. **MCP server exposure** — Backlog.md, AIPIM, Vibe Kanban, Claude Task Master, Linear, and GitHub all expose their state via MCP. AI agents can query and update them directly. cc-dash has no MCP interface.

2. **AI agent orchestration** — Vibe Kanban, Claude Squad, Gastown, and Superset manage parallel agent execution with worktrees. cc-dash tracks what happened but doesn't orchestrate agents.

3. **AGENTS.md / AI-agent-readable task format** — Backlog.md, CCPM, and taskmd are explicitly designed for AI agents to read/write tasks. cc-dash's schemas are parseable but not advertised as AI-agent-native.

4. **Real-time session monitoring** — claude-code-ui shows live Claude Code sessions with status updates. cc-dash reads SESSION_PROGRESS.md files on demand (manual refresh).

5. **PRD-to-task decomposition** — Claude Task Master and CCPM auto-decompose PRDs into structured tasks. cc-dash is a lens over existing tasks, not a task generator.

6. **Git worktree management** — Vibe Kanban and CCPM create isolated worktrees per task for parallel agent work. cc-dash doesn't manage execution.

### Key market patterns

- **MCP (Model Context Protocol) is the integration standard** — Nearly every successful tool exposes or consumes MCP. This is the way AI agents talk to project management tools.
- **"Files as state" is gaining legitimacy** — Backlog.md (5k+ stars), taskmd, and Markdown Projects all validate the architectural bet cc-dash made.
- **The AI-agent PM category barely existed in 2024** — Claude Task Master (25k stars), Vibe Kanban (24k stars), and CCPM (7k stars) all launched in 2025-2026.
- **Vibe-coded dashboards are not a threat** — Bolt.new and Lovable can generate a dashboard in 5 minutes, but they can't replicate cc-dash's schema knowledge, round-trip invariants, and 20-repo integration.
- **The AGENTS.md + CLAUDE.md ecosystem is a de facto standard** — Microsoft, Google, Cursor, and Anthropic all read these files.
- **No tool aggregates across 20+ independent repos** — Orchestrators manage parallel work within a single repo (via worktrees). The "portfolio management" layer is an unoccupied niche.

---

## Part 3: Synthesis — What Should Change

### High-Impact Additions

1. **Add an MCP server** — Expose roadmap items, session tasks, and project status as MCP tools so Claude Code (and other agents) can query cc-dash directly. Every successful tool in this space has MCP. The market has converged on this as the integration standard.

2. **Real-time / auto-refresh** — File watchers or polling to update the dashboard when markdown files change on disk. Current manual refresh is a friction point when agents are actively working.

3. **Publish schemas as an open standard** — `cc-dash/roadmap@1` and `cc-dash/session@1` are more sophisticated than what Backlog.md or taskmd use (HTML comments for inline metadata, round-trip serialization). Publishing them as an open spec could attract adoption.

4. **List on awesome-claude-code** — With 28.5k stars, it's the primary discovery channel. cc-dash isn't listed there.

### Medium-Impact Additions

5. **Agent activity feed** — Show which AI agents touched which projects recently, pulling from git log author/committer metadata (Claude Code commits have distinctive signatures).

6. **Portfolio-level metrics** — Aggregate stats across all projects: total items by status, velocity (items completed per week), stale project detection. The home page currently shows per-project progress but lacks portfolio roll-ups.

7. **Backlog.md / taskmd format compatibility** — Ingest their markdown formats as additional schemas so cc-dash can aggregate projects that use those tools.

### Lower Priority / Watch

8. **Agent orchestration** — Adding worktree management or parallel agent dispatch would be a major scope expansion. The orchestration space is crowded (Vibe Kanban, Claude Squad, Gastown all have 7k+ stars). Better to integrate with them than compete.

9. **PRD decomposition** — Claude Task Master dominates this. Consider consuming its `.taskmaster/` output rather than building a PRD parser.

10. **Vibe-coded dashboards are not a threat** — Bolt.new and Lovable can generate a dashboard in 5 minutes, but they can't replicate cc-dash's schema knowledge, round-trip invariants, and 20-repo integration. The value is in the domain model, not the UI.

---

## Appendix: Detailed Agent Reports

### Agent 1: Popular Dev Dashboards

Key findings:

- Backlog.md is the closest conceptual overlap but scoped to single-repo
- Tasks.md (SolidJS + Koa) is simpler — single board, no schema enforcement
- Plane (46.6k stars) is the dominant open-source PM platform (database-backed)
- WTF terminal dashboard (16.6k stars) aggregates developer data in terminal form
- Homepage (29.4k stars) is a YAML-configured service dashboard (different category)

### Agent 2: AI Dashboard Generators

Key findings:

- Bolt.new ($40M ARR), Lovable ($20M ARR), Replit ($265M ARR) dominate vibe-coded app generation
- ClickUp Super Agents, Taskade, Linear Triage Intelligence, Notion Agent all shipped agentic AI in 2025-2026
- GitHub Agentic Workflows (Feb 2026 preview) embeds AI agents in GitHub Actions
- GitHub Copilot Project Planning turns ideas into issue trees with markdown plan files
- Three market tiers: full autonomous PM, AI-assisted PM, AI-generated dashboards

### Agent 3: Claude Code Ecosystem Tools

Key findings:

- Claude Task Master (~25k stars) — #1 trending repo on GitHub, MCP-based task management
- Vibe Kanban (~24k stars) — dual MCP client/server Kanban for AI agents
- Gastown (~8.8k stars) — Steve Yegge's multi-agent orchestrator with git-backed "beads"
- Superset (~8.7k stars) — desktop editor for agent swarms
- CCPM (~7k stars) — GitHub Issues + worktrees for parallel agent execution
- Claude Squad (~6.9k stars) — tmux-based multi-agent terminal manager
- claude-code-ui — real-time session monitoring across repos
- awesome-claude-code (~28.5k stars) — primary discovery channel

### Agent 4: Markdown-Based PM Tools

Key findings:

- Backlog.md is the closest architectural match (markdown + YAML + Git atomic commits)
- CCPM uses GitHub Issues (not files) — architecturally different but popular (~7-8k stars)
- AIPIM uses event-sourced hybrid model with MCP integration
- Obsidian Kanban (~4k stars) seeking new maintainers — ecosystem in flux
- dstask (~970 stars) — Go-based Taskwarrior alternative with Git sync
- Observable Framework (~4k stars) — static site generator for data dashboards from markdown
- No tool aggregates multiple repos' roadmaps into a unified view
