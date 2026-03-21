# cc-dash

A local Next.js dashboard that aggregates `ROADMAP.md` and `SESSION_PROGRESS.md` files across multiple projects into a single Kanban/CRUD interface. All state lives in markdown files — the dashboard is a lens, not a database.

## Features

- **Project Discovery** — Scans configured directories for projects with cc-dash schema files
- **Roadmap Board** — Kanban board and list views for roadmap items with drag-and-drop
- **Session Tracking** — View and edit session progress, tasks, decisions, failed attempts
- **Ideas System** — Capture and manage project ideas with a guided wizard
- **Milestone Timeline** — Date-based activity feed from roadmap and session events
- **Prompt Generation** — Generate context-rich Claude Code prompts per project
- **Settings** — Configure scan directories, exclusions, and explicit projects

## Setup

```bash
# Requirements: Node.js 22+
npm install
npm run dev    # http://localhost:3000
```

### Configuration

Create `~/.config/cc-dash/config.json`:

```json
{
  "scan_dirs": ["~/projects"],
  "exclude_dirs": ["node_modules", ".git", "vendor"],
  "explicit_projects": [],
  "scan_depth": 2,
  "port": 3000
}
```

### Schema Files

Projects are discovered when they contain `ROADMAP.md` or `SESSION_PROGRESS.md` with cc-dash schema frontmatter:

```yaml
---
schema: cc-dash/roadmap@1
project: my-project
description: Project description
last_updated: "2026-01-01T00:00:00Z"
---
```

## Commands

| Command            | Description      |
| ------------------ | ---------------- |
| `npm run dev`      | Start dev server |
| `npm run build`    | Production build |
| `npm run lint`     | Run ESLint       |
| `npm run test:run` | Run all tests    |
| `npm test`         | Watch mode       |

## Constraints

- **No database** — markdown files are the only state
- **Round-trip fidelity** — parse then serialize must preserve file content
- **Atomic writes** — all file mutations write to `.tmp` then rename
- **Item IDs are permanent** — once assigned, IDs never change

## Planned Work

- Legacy v1 file support (read-only detection + migration)
- Live file watching via SSE
- Cross-project search
- E2E tests (Playwright)
