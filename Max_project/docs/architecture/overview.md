# LifeMax OS Architecture Overview

## Prototype layout

- `app/frontend`: static browser UI for guided intake, dashboard, tracker, about page, and contact page
- `agents/orchestrator`: milestone controller and retry logic
- `agents/intake`: consent and requirement gate
- `agents/personality`: known-type routing or lightweight inferred classification
- `agents/profile_synthesis`: normalized profile assembly, confidence scoring, and user intelligence synthesis
- `agents/planning`: roadmap sequencing and domain prioritization
- `agents/tracking`: persistent task state, domain progress, and review loops
- `agents/{looks,health,career,finance,routine}`: domain planners
- `agents/testing`: schema and output validation
- `agents/evaluation`: quality and risk scoring
- `agents/compiler`: final package builder

## Current tradeoffs

1. The prototype favors zero dependencies and inspectable browser logic over production infrastructure.
2. Workflow state is local to the browser, which keeps setup trivial but is not enterprise-safe.
3. Tracking is durable across local sessions, but notifications and background jobs are not implemented yet.
4. Retry behavior is heuristic and synchronous instead of queue-backed and event-driven.
5. Shared schemas exist as code-level contracts, but persistence and policy enforcement are still thin.
