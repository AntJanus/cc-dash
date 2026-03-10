---
schema: cc-dash/roadmap@1
project: full-project
description: A full-featured test project with all field types
last_updated: 2026-03-09T14:30:00-07:00
---

# Roadmap

> A full-featured test project with all field types

## Core Features

<!-- category:core -->

- <!-- id:r_k8x2m status:planned --> **Auth System** - User authentication with OAuth support.
- <!-- id:r_m3p7q status:in-progress started:2026-02-15 --> **API Layer** - REST API with versioning.
- <!-- id:r_x9w1n status:done started:2026-01-10 completed:2026-03-01 --> ~~**Data Models**~~ - Core database models and migrations. *(Completed: 2026-03-01)*

## User Experience

<!-- category:ux -->

- <!-- id:r_j4t8v status:planned --> **Dashboard UI** - Main project dashboard view.
- <!-- id:r_q2r5s status:planned depends:r_j4t8v --> **Theme System** - Light and dark mode support.

## Technical Infrastructure

<!-- category:infra -->

- <!-- id:r_b2c6d status:planned depends:r_k8x2m --> **CI Pipeline** - Automated testing and deployment.
- <!-- id:r_n7y3z status:in-progress started:2026-03-05 depends:r_k8x2m,r_m3p7q --> **Monitoring** - Application health monitoring.

## Future Ideas

<!-- category:future -->

- <!-- id:r_a1z9y status:idea --> **Plugin System** - Extensible plugin architecture.
