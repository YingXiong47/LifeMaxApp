create extension if not exists pgcrypto;

create or replace function public.lifemax_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  email text,
  full_name text,
  onboarding_answers jsonb not null default '{}'::jsonb,
  profile_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'Complete',
  request_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  diagnostic_report jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weekly_plans (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id text references public.assessments(id) on delete set null,
  label text,
  status text not null default 'Complete',
  plan_payload jsonb not null default '[]'::jsonb,
  tracker_payload jsonb not null default '{}'::jsonb,
  execution_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_runs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id text references public.assessments(id) on delete set null,
  workflow_status text not null default 'Complete',
  confidence numeric not null default 0,
  backend text,
  title text,
  result_payload jsonb,
  workflow_meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.domains (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id text references public.assessments(id) on delete set null,
  domain_key text not null,
  title text,
  progress_score numeric not null default 0,
  status text not null default 'not_started',
  summary text,
  plan_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, domain_key)
);

create table if not exists public.domain_progress_logs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  domain_key text not null,
  source_kind text not null,
  note text,
  progress_delta numeric not null default 0,
  payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reflections (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'weekly',
  focus_areas jsonb not null default '[]'::jsonb,
  reflections_payload jsonb not null default '[]'::jsonb,
  summary_payload jsonb,
  metrics jsonb not null default '{}'::jsonb,
  domain_changes_payload jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  appearance text not null default 'midnight',
  settings_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assessments_user_id_created_at_idx on public.assessments (user_id, created_at desc);
create index if not exists weekly_plans_user_id_created_at_idx on public.weekly_plans (user_id, created_at desc);
create index if not exists agent_runs_user_id_created_at_idx on public.agent_runs (user_id, created_at desc);
create index if not exists domains_user_id_domain_key_idx on public.domains (user_id, domain_key);
create index if not exists domain_progress_logs_user_id_created_at_idx on public.domain_progress_logs (user_id, created_at desc);
create index if not exists reflections_user_id_created_at_idx on public.reflections (user_id, created_at desc);

drop trigger if exists lifemax_profiles_updated_at on public.profiles;
create trigger lifemax_profiles_updated_at
before update on public.profiles
for each row execute function public.lifemax_set_updated_at();

drop trigger if exists lifemax_assessments_updated_at on public.assessments;
create trigger lifemax_assessments_updated_at
before update on public.assessments
for each row execute function public.lifemax_set_updated_at();

drop trigger if exists lifemax_weekly_plans_updated_at on public.weekly_plans;
create trigger lifemax_weekly_plans_updated_at
before update on public.weekly_plans
for each row execute function public.lifemax_set_updated_at();

drop trigger if exists lifemax_agent_runs_updated_at on public.agent_runs;
create trigger lifemax_agent_runs_updated_at
before update on public.agent_runs
for each row execute function public.lifemax_set_updated_at();

drop trigger if exists lifemax_domains_updated_at on public.domains;
create trigger lifemax_domains_updated_at
before update on public.domains
for each row execute function public.lifemax_set_updated_at();

drop trigger if exists lifemax_domain_progress_logs_updated_at on public.domain_progress_logs;
create trigger lifemax_domain_progress_logs_updated_at
before update on public.domain_progress_logs
for each row execute function public.lifemax_set_updated_at();

drop trigger if exists lifemax_reflections_updated_at on public.reflections;
create trigger lifemax_reflections_updated_at
before update on public.reflections
for each row execute function public.lifemax_set_updated_at();

drop trigger if exists lifemax_user_settings_updated_at on public.user_settings;
create trigger lifemax_user_settings_updated_at
before update on public.user_settings
for each row execute function public.lifemax_set_updated_at();

alter table public.profiles enable row level security;
alter table public.assessments enable row level security;
alter table public.weekly_plans enable row level security;
alter table public.agent_runs enable row level security;
alter table public.domains enable row level security;
alter table public.domain_progress_logs enable row level security;
alter table public.reflections enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "assessments_select_own" on public.assessments;
create policy "assessments_select_own" on public.assessments for select using (auth.uid() = user_id);
drop policy if exists "assessments_insert_own" on public.assessments;
create policy "assessments_insert_own" on public.assessments for insert with check (auth.uid() = user_id);
drop policy if exists "assessments_update_own" on public.assessments;
create policy "assessments_update_own" on public.assessments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "weekly_plans_select_own" on public.weekly_plans;
create policy "weekly_plans_select_own" on public.weekly_plans for select using (auth.uid() = user_id);
drop policy if exists "weekly_plans_insert_own" on public.weekly_plans;
create policy "weekly_plans_insert_own" on public.weekly_plans for insert with check (auth.uid() = user_id);
drop policy if exists "weekly_plans_update_own" on public.weekly_plans;
create policy "weekly_plans_update_own" on public.weekly_plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "agent_runs_select_own" on public.agent_runs;
create policy "agent_runs_select_own" on public.agent_runs for select using (auth.uid() = user_id);
drop policy if exists "agent_runs_insert_own" on public.agent_runs;
create policy "agent_runs_insert_own" on public.agent_runs for insert with check (auth.uid() = user_id);
drop policy if exists "agent_runs_update_own" on public.agent_runs;
create policy "agent_runs_update_own" on public.agent_runs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "domains_select_own" on public.domains;
create policy "domains_select_own" on public.domains for select using (auth.uid() = user_id);
drop policy if exists "domains_insert_own" on public.domains;
create policy "domains_insert_own" on public.domains for insert with check (auth.uid() = user_id);
drop policy if exists "domains_update_own" on public.domains;
create policy "domains_update_own" on public.domains for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "domain_progress_logs_select_own" on public.domain_progress_logs;
create policy "domain_progress_logs_select_own" on public.domain_progress_logs for select using (auth.uid() = user_id);
drop policy if exists "domain_progress_logs_insert_own" on public.domain_progress_logs;
create policy "domain_progress_logs_insert_own" on public.domain_progress_logs for insert with check (auth.uid() = user_id);
drop policy if exists "domain_progress_logs_update_own" on public.domain_progress_logs;
create policy "domain_progress_logs_update_own" on public.domain_progress_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reflections_select_own" on public.reflections;
create policy "reflections_select_own" on public.reflections for select using (auth.uid() = user_id);
drop policy if exists "reflections_insert_own" on public.reflections;
create policy "reflections_insert_own" on public.reflections for insert with check (auth.uid() = user_id);
drop policy if exists "reflections_update_own" on public.reflections;
create policy "reflections_update_own" on public.reflections for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own" on public.user_settings for select using (auth.uid() = user_id);
drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own" on public.user_settings for insert with check (auth.uid() = user_id);
drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own" on public.user_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
