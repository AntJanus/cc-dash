# CLAUDE.md — cc-dash

## Project Overview

**cc-dash** is a local Next.js web dashboard that aggregates `ROADMAP.md` and `SESSION_PROGRESS.md` files across 20+ projects into a single Kanban/CRUD interface. All project state lives in markdown files; the dashboard is a lens, not a database.

**Status**: v3.0 shipped (1247 tests). v2.0 complete (14 phases), v3.0 adds AI integration and portfolio intelligence.

**Stack**: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + Zod v4 + Vitest 4.x

## Development Commands

```bash
npm install              # Install dependencies
npm run dev              # Next.js dev server at localhost:3737
npm run build            # Production build
npm run lint             # ESLint
npm run test:run         # Run all tests (1247 tests)
npm test                 # Watch mode
npm run format:check     # Prettier check
```

## Architecture

```
src/
├── app/                         # Next.js App Router pages
│   ├── layout.tsx               # Root layout with sidebar nav + auto-refresh provider
│   ├── page.tsx                 # Dashboard home (project grid)
│   ├── activity/page.tsx        # Milestone timeline
│   ├── agents/page.tsx          # Agent activity feed (Co-Authored-By parsing)
│   ├── api/watch/route.ts       # File change detection API (mtime fingerprint)
│   ├── ideas/                   # Ideas system pages
│   ├── metrics/page.tsx         # Portfolio metrics dashboard
│   ├── settings/page.tsx        # Settings page
│   ├── today/page.tsx           # Today screen (directions panel + Up Next + pulse lanes)
│   └── project/[slug]/
│       ├── layout.tsx           # Project layout with tabs
│       ├── roadmap/page.tsx     # Roadmap board/list view
│       └── session/page.tsx     # Session progress view
├── components/
│   ├── agents/                  # Agent activity feed, commit list, filters
│   ├── ideas/                   # Idea cards, grid, wizard, forms
│   ├── metrics/                 # Status chart, velocity, progress, stale list
│   ├── projects/                # Dashboard home cards, grid, filters
│   ├── prompt/                  # Prompt generation modal/buttons
│   ├── roadmap/                 # Board columns, cards, list view, editor
│   ├── session/                 # Task list, status, decisions, verification
│   ├── today/                   # Directions panel, recommended lane, QA checkboxes, copyable commands
│   ├── shared/                  # Status badges, refresh button, auto-refresh provider
│   └── ui/                      # Base UI primitives (accordion, button, etc.)
└── lib/
    ├── actions/                 # Next.js Server Actions for CRUD
    ├── activity/                # Milestone timeline + agent activity (git log parsing)
    ├── config.ts                # Config loading (~/.config/cc-dash/config.json)
    ├── fs/
    │   ├── parser.ts            # Markdown parsing (gray-matter + regex)
    │   ├── serializer.ts        # Markdown generation (preserves unrecognized content)
    │   ├── discovery.ts         # Project scanning with slug generation
    │   ├── atomic-write.ts      # Safe writes (write .tmp then rename)
    │   ├── discovery-cache.ts   # In-memory discovery cache
    │   ├── file-fingerprint.ts  # File mtime fingerprinting for auto-refresh
    │   └── portfolio.ts         # Portfolio metadata (.cc-dash/portfolio.json)
    ├── metrics/                 # Portfolio-level aggregate metrics computation
    ├── prompt/                  # Prompt assembly for Claude Code
    ├── schemas/                 # Zod schemas (roadmap, session, ideas, config, portfolio)
    └── utils/                   # ID generation, helpers
```

## Key Patterns

- **Files are the only state** — no database, markdown files are source of truth
- **Four custom schemas**: `cc-dash/roadmap@1`, `cc-dash/session@1`, `cc-dash/qa@1`, `cc-dash/today-directions@1`
- **YAML frontmatter** for file-level metadata, **HTML comments** for item-level metadata
- **ID format**: `r_` (roadmap), `t_` (task), `f_` (failed attempt), `s_` (session), `q_` (qa)
- **Atomic file writes**: write to `.tmp` then rename
- **Round-trip invariant**: `parse(serialize(parse(file)))` must equal `parse(file)`
- **Project slugs**: derived from project name via `slugify()`, collision-safe
- **Path aliases**: `@/` → `src/`

## Conventions

- Vitest + jsdom for testing, `__tests__/` mirrors `src/` structure
- `vi.hoisted()` required for mock variables used in `vi.mock()` factories
- Server actions follow read-parse-mutate-write pattern
- Optimistic UI updates with rollback on server error

## Config

Dashboard config lives at `~/.config/cc-dash/config.json`:

```json
{
  "scan_dirs": ["~/projects"],
  "exclude_dirs": ["node_modules", ".git", "vendor"],
  "explicit_projects": [],
  "scan_depth": 2,
  "port": 3000
}
```

## Learnings

- **No text-xs in dashboard UI** — `text-xs` (12px) must never be used for any content. Minimum is `text-sm` (14px). Card titles need `text-base` (16px)+. Page headings need `text-3xl` (30px)+. When user says "bigger", go 2 steps up, not 1. _(captured 2026-03-21)_
- **Use CSS utility classes for interactive states** — Define shared interaction patterns (hover lift, active press) as CSS utility classes (`interactive-card`, `interactive-btn` in globals.css) rather than repeating `transition` and `transform` styles inline on each component. Ensures consistent UX and simplifies timing/effect adjustments. _(captured 2026-03-23)_
- **Today's Directions lives outside any project** — the configured `orchestrator_dir`'s `TODAYS_DIRECTIONS.md` is the portfolio-level scratchpad rendered on `/today`. Auto-refresh fingerprint includes its mtime so the page reloads when the orchestrator agent writes the file. The QA `<!-- ref:q_xxxxx slug:project -->` markers on its checkbox lines are load-bearing — ticking a checkbox calls `approveQaItem` against the project's canonical `QA.md` and rewrites the directions checkbox to `[x]`. _(captured 2026-05-07)_

## Do Not

- Do not use a database — files are the only state, this is a core architectural constraint
- Do not change existing item IDs — IDs are permanent once assigned
- Do not skip round-trip tests for parser/serializer — this is the most critical invariant
- Do not break markdown readability — files must render correctly in GitHub, Obsidian, and VS Code
