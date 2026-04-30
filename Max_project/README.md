# LifeMax OS

This workspace now lives at `/Users/ismailmuhammad/Documents/GitHub/LifeMaxApp/Max_project`. Any older references to `/Users/ismailmuhammad/Documents/Max_project` are obsolete.

LifeMax OS currently has two layers during the rebuild:

- `src/`: the Next.js App Router application
- `agents/` + `core/`: the legacy orchestration engine still reused as the planning backend fallback

## What changed

- route-based onboarding under `src/app/onboarding/*`
- separate marketing, auth, and application shells
- a real dashboard IA under `src/app/app/*`
- Clerk-aware auth scaffolding with demo fallback
- TanStack Query providers and mutation hooks
- `react-hook-form` + `zod` onboarding validation
- shadcn-style UI primitives with Radix building blocks
- Supabase repository/migration scaffolding
- Inngest function registration under `src/app/api/inngest/route.ts`
- OpenAI Agents intake analysis with safe fallback to heuristics and the existing orchestrator

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` and fill in whichever services you want enabled. The app still runs in demo mode if Clerk, Supabase, Inngest, or OpenAI are not configured.

## Validate the current agent engine

```bash
npm test
```

## Production direction

Current production-oriented stack targets:

- Clerk auth
- Supabase Postgres persistence
- OpenAI Agents SDK
- Inngest workflows

The old static prototype remains in `legacy_static_app/` while the Next.js rebuild continues in `src/`.
