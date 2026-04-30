alter table if exists public.onboarding_submissions
  drop constraint if exists onboarding_submissions_auth_mode_check;

alter table if exists public.onboarding_submissions
  add constraint onboarding_submissions_auth_mode_check
  check (auth_mode in ('demo', 'clerk', 'supabase'));

alter table if exists public.plan_runs
  drop constraint if exists plan_runs_auth_mode_check;

alter table if exists public.plan_runs
  add constraint plan_runs_auth_mode_check
  check (auth_mode in ('demo', 'clerk', 'supabase'));
