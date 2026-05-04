---
schema: cc-dash/qa@1
project: project-beta
last_updated: 2026-05-04T10:00:00-06:00
---

# Manual QA — project-beta

## Setup

Run: `cd project-beta && bash scripts/test-skills.sh`

You can also trigger the GitHub Actions workflow on a scratch PR.

## Checklist

- <!-- id:q_a1b2c status:pending --> CI validation workflow runs clean on a fresh PR.
- <!-- id:q_d3e4f status:passed at:2026-05-04T10:15:00-06:00 --> All skills pass the 500-line progressive-disclosure limit.
- <!-- id:q_g5h6i status:failed at:2026-05-04T10:20:00-06:00 ref:r_xyz12 --> AGENTS.md "Last Updated" date is current.
  > **Note (2026-05-04):** Date shows 2026-04-17, not refreshed since the QA consolidation. Filed as r_xyz12 in ROADMAP.md.
- <!-- id:q_j7k8l status:needs-decision at:2026-05-04T10:25:00-06:00 --> UI redesign discussion.
  > **Note:** Needs design conversation before any code change.
  >
  > Reference the v3.2 design inspiration assets in projects-planning/.
- <!-- id:q_m9n8o status:skipped at:2026-05-04T10:30:00-06:00 --> Optional integration check (no API key configured).
