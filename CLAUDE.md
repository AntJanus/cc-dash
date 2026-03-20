# CLAUDE.md — prd-board (cc-dash)

## Project Overview

Planning and implementation repo for **cc-dash** — a local Next.js web dashboard that aggregates `ROADMAP.md` and `SESSION_PROGRESS.md` files across 20+ projects into a single Kanban/CRUD interface. All project state lives in markdown files; the dashboard is a lens, not a database.

**Status**: Pre-implementation (planning complete, Phase 1 not started).

**Target stack**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + gray-matter + chokidar + @dnd-kit.

## Key Files

| File                          | Purpose                                                               |
| ----------------------------- | --------------------------------------------------------------------- |
| `prd-cc-project-dashboard.md` | Full PRD with schemas, API design, component hierarchy, parsing specs |
| `.planning/PROJECT.md`        | Project definition, requirements, constraints, key decisions          |
| `.planning/ROADMAP.md`        | 12-phase GSD roadmap derived from 68 requirements                     |
| `.planning/REQUIREMENTS.md`   | Detailed requirement specifications                                   |
| `.planning/STATE.md`          | Current GSD workflow state and session continuity                     |
| `.planning/research/`         | Research artifacts for technology choices                             |
| `.planning/config.json`       | GSD workflow configuration                                            |

## Development Commands

Once scaffolded (Phase 1):

```bash
npm install
npm run dev              # Next.js dev server at localhost:3000
npm run build            # Production build
npm test                 # Unit tests
npm test -- --watch      # Watch mode
```

## Architecture (Planned)

```
app/
├── layout.tsx                   # Root layout with sidebar nav
├── page.tsx                     # Dashboard home (project grid)
├── settings/page.tsx            # Settings page
└── project/[slug]/
    ├── layout.tsx               # Project layout with tabs
    ├── roadmap/page.tsx         # Roadmap board/list view
    └── session/page.tsx         # Session progress view
lib/
├── fs/
│   ├── parser.ts                # Markdown parsing (gray-matter + regex for HTML comment metadata)
│   ├── serializer.ts            # Markdown generation (must preserve unrecognized content)
│   ├── discovery.ts             # Project scanning across configured directories
│   ├── watcher.ts               # chokidar file watching
│   └── atomic-write.ts          # Safe writes (write .tmp then rename)
├── schemas/
│   ├── roadmap.ts               # Zod schema for cc-dash/roadmap@1
│   └── session.ts               # Zod schema for cc-dash/session@1
├── actions/                     # Next.js Server Actions for CRUD
└── config.ts                    # Config loading (~/.config/cc-dash/config.json)
components/
├── projects/                    # Dashboard home cards, grid, filters
├── roadmap/                     # Board columns, cards, list view, detail editor
├── session/                     # Task list, status fields, decisions, verification
└── shared/                      # Status badges, dependency badges, timestamps
```

**Key patterns**:

- Files are the only state (no database)
- Two custom markdown schemas: `cc-dash/roadmap@1` and `cc-dash/session@1`
- YAML frontmatter for file-level metadata, HTML comments for item-level metadata (invisible in rendered markdown)
- ID format: `r_` (roadmap), `t_` (task), `f_` (failed attempt), `s_` (session)
- Atomic file writes: write to `.tmp` then rename
- Round-trip invariant: `parse(serialize(parse(file)))` must equal `parse(file)`
- Project discovery: scan configured directories for schema-v2 markdown files
- Live updates: chokidar watches files, SSE pushes changes to browser
- Prompt generation: produces Claude Code prompts with project context and suggested workflow

## Conventions

- GSD workflow for planning: `.planning/` directory with phases, plans, requirements, state
- Read `STATE.md` before starting work to understand current position
- Each phase has explicit success criteria and dependency declarations
- Plans are numbered `{phase}-{plan}` (e.g., `01-01`, `02-03`)

## Do Not

- Do not use a database — files are the only state, this is a core architectural constraint
- Do not change existing item IDs — IDs are permanent once assigned
- Do not skip round-trip tests for parser/serializer — this is the most critical invariant
- Do not modify `.planning/` workflow documents without reading `STATE.md` first
- Do not deviate from the PRD's schema specs (`cc-dash/roadmap@1`, `cc-dash/session@1`) without updating the PRD
- Do not break markdown readability — files must render correctly in GitHub, Obsidian, and VS Code
