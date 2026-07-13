# cc-dash

A local dashboard and **Model Context Protocol server** for managing a multi-project
portfolio whose entire state lives in markdown files.

Projects declare their state in `ROADMAP.md`, `SESSION_PROGRESS.md`, and `QA.md` files
using a small schema. cc-dash reads those files, renders them as boards, timelines, and
queues, and writes changes back to the same markdown. There is no database. The
dashboard is a lens over your files, not a copy of them.

The MCP server exposes the same operations to Claude Code, so an agent can read a
roadmap, advance a session, or work a QA queue without anyone opening the UI.

## The MCP server

`src/mcp/server.ts` is a standard MCP server over stdio, with 25 zod-typed tools.

```bash
claude mcp add --scope user cc-dash -- npx tsx /path/to/cc-dash/src/mcp/server.ts
```

Tools are grouped by what they act on:

| Group     | Tools                                                                                       |
| --------- | ------------------------------------------------------------------------------------------- |
| Portfolio | `list_projects`, `get_portfolio`, `get_project`, `get_config`, `search`, `reorder_projects` |
| Roadmap   | `add_roadmap_item`, `add_roadmap_category`, `update_roadmap_item`, `bulk_update_status`     |
| Sessions  | `get_session`, `list_sessions_today`, `update_session_status`                               |
| QA        | `next_qa_item`, `approve_qa_item`, `fail_qa_item`, `skip_qa_item`, `reset_qa_item`          |
| Planning  | `get_today_directions`, `list_ideas`, `set_project_status`                                  |

Every tool validates its input with zod and returns structured content. A tool that
cannot do what was asked raises instead of returning a plausible-looking empty result,
so an agent cannot silently proceed on bad state.

## Why markdown as the database

Three properties fall out of that constraint, and they are the reason it is worth its
cost:

- **The files stay useful without the app.** A `ROADMAP.md` is readable in any editor,
  diffable in any review, greppable from any shell.
- **Git is the audit log.** Every state change is a commit: attributable, revertible,
  and with no separate migration story.
- **Agents already understand it.** A coding agent can read and edit the source of truth
  directly, with or without the MCP server.

The cost is that parsing and serialization have to be exact. Round-trip fidelity is
enforced by tests: parse a file, serialize it, and the bytes must match.

## Features

- **Project discovery** across configured scan directories
- **Roadmap board** with kanban and list views, drag and drop, and bulk status edits
- **Session tracking** for tasks, decisions, and failed attempts across work sessions
- **QA queues**, portfolio-wide and per-project, with a keyboard-driven focus mode
- **Today's Directions**, a generated daily plan with dispatch commands per project
- **Agent activity feed** that attributes commits to the AI agents that co-authored them
- **Ideas system** with a guided capture wizard
- **Milestone timeline** built from roadmap and session events

## Setup

Requires Node.js 22 or newer.

```bash
npm install
npm run dev     # http://localhost:3737
npm run mcp     # run the MCP server over stdio
```

Create `~/.config/cc-dash/config.json`:

```json
{
  "scan_dirs": ["~/projects"],
  "exclude_dirs": ["node_modules", ".git", "vendor"],
  "explicit_projects": [],
  "scan_depth": 2,
  "port": 3737,
  "orchestrator_dir": "~/projects"
}
```

`orchestrator_dir` is the portfolio-level directory your orchestrator agent runs from,
and where `TODAYS_DIRECTIONS.md` is written. Every machine-specific path lives in this
file, outside the repository, so nothing personal is ever committed.

A project is discovered when it contains a schema file:

```yaml
---
schema: cc-dash/roadmap@1
project: my-project
description: One-line description
last_updated: 2026-01-01T00:00:00Z
---
```

Roadmap items carry stable IDs in HTML comments, so an item can be reworded without
losing its identity:

```markdown
- <!-- id:r_a1b2c status:planned --> **Item name** - What it does
```

## Commands

| Command            | Description           |
| ------------------ | --------------------- |
| `npm run dev`      | Dev server            |
| `npm run build`    | Production build      |
| `npm run mcp`      | MCP server over stdio |
| `npm run test:run` | Full suite, once      |
| `npm test`         | Watch mode            |
| `npm run test:e2e` | Playwright end-to-end |
| `npm run lint`     | ESLint                |

1,666 tests across 148 files.

## Constraints

These are enforced, not aspirational:

- **No database.** Markdown files are the only state.
- **Round-trip fidelity.** Parse then serialize must reproduce the file byte for byte.
- **Atomic writes.** Every mutation writes to a `.tmp` file, then renames.
- **Item IDs are permanent.** Once assigned, an ID never changes.

## Stack

Next.js 15, React 19, TypeScript, Tailwind CSS 4, zod,
[`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk),
Vitest, Playwright.

## License

MIT. See [LICENSE](./LICENSE).
