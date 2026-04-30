create table if not exists public.agent_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.plan_runs (id) on delete cascade,
  agent_name text not null,
  step_key text not null,
  status text not null,
  confidence numeric not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, agent_name, step_key)
);

create index if not exists agent_steps_run_id_idx on public.agent_steps (run_id, created_at desc);
