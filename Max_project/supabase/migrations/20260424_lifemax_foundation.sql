create extension if not exists pgcrypto;

create table if not exists public.onboarding_submissions (
  owner_key text primary key,
  auth_mode text not null check (auth_mode in ('demo', 'clerk')),
  answers jsonb not null default '{}'::jsonb,
  last_step text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_runs (
  id uuid primary key default gen_random_uuid(),
  owner_key text not null,
  auth_mode text not null check (auth_mode in ('demo', 'clerk')),
  request_payload jsonb not null,
  result_payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists plan_runs_owner_key_idx on public.plan_runs (owner_key, created_at desc);
