-- Eval dashboard (stage 1): golden-set runs against the live chatbot at
-- /api/chat. results/summary are deliberately jsonb, not normalized tables —
-- a run report is always read as one whole document, never queried by
-- individual case, so normalizing it would only add joins with no benefit.

create type public.eval_run_status as enum ('running', 'done', 'error');

create table public.eval_runs (
  id           uuid primary key default gen_random_uuid(),
  status       public.eval_run_status not null default 'running',
  suite_id     text not null,
  label        text,
  judge_model  text not null default 'google/gemini-2.5-flash',
  progress     jsonb not null default '{"done":0,"total":0}',
  results      jsonb not null default '[]',
  summary      jsonb,
  error        text,
  created_at   timestamptz not null default now(),
  finished_at  timestamptz
);

-- Backs the judge-of-judge / Cohen's kappa page (stage 3): a human records
-- their own verdict per case so judge accuracy can be measured, not assumed.
create table public.eval_human_labels (
  id             uuid primary key default gen_random_uuid(),
  run_id         uuid not null references public.eval_runs(id) on delete cascade,
  case_id        text not null,
  human_verdict  text not null,
  judge_verdict  text not null,
  note           text,
  created_at     timestamptz not null default now(),
  unique (run_id, case_id)
);

alter table public.eval_runs         enable row level security;
alter table public.eval_human_labels enable row level security;

create policy "admins manage eval_runs" on public.eval_runs
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage eval_human_labels" on public.eval_human_labels
  for all using (public.is_admin()) with check (public.is_admin());
