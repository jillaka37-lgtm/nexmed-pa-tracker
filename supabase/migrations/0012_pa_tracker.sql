-- PA Tracker schema: cases, an append-only timeline (doubles as notes in a
-- later stage), and a daily usage counter for rate limiting case creation.

create type public.pa_status as enum ('new', 'sent', 'waiting', 'approved', 'denied');

create table public.pa_cases (
  id              uuid primary key default gen_random_uuid(),
  case_id         text not null,            -- de-identified reference (no patient name)
  insurer         text not null,
  medication      text not null,
  diagnosis       text,
  status          public.pa_status not null default 'new',
  created_by      uuid not null references auth.users(id) on delete cascade,
  assigned_to     uuid references auth.users(id) on delete set null,
  due_at          timestamptz,
  last_action_at  timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index pa_cases_created_by_idx on public.pa_cases(created_by);
create index pa_cases_assigned_to_idx on public.pa_cases(assigned_to);
create index pa_cases_due_at_idx on public.pa_cases(due_at) where status in ('sent', 'waiting');

create table public.pa_case_events (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references public.pa_cases(id) on delete cascade,
  actor       uuid references auth.users(id) on delete set null,
  action      text not null,   -- 'created' | 'status_changed' | 'assigned' | 'note_added' | 'reminder_sent' | 'ai_action'
  detail      jsonb,
  created_at  timestamptz not null default now()
);
create index pa_case_events_case_id_idx on public.pa_case_events(case_id, created_at);

alter table public.pa_cases enable row level security;
alter table public.pa_case_events enable row level security;

-- Visible to both the creator and whoever it's assigned to.
create policy "staff view own or assigned pa_cases" on public.pa_cases for select
  using (public.is_admin() and (created_by = auth.uid() or assigned_to = auth.uid()));
create policy "staff insert own pa_cases" on public.pa_cases for insert
  with check (public.is_admin() and created_by = auth.uid());
create policy "staff update own or assigned pa_cases" on public.pa_cases for update
  using (public.is_admin() and (created_by = auth.uid() or assigned_to = auth.uid()))
  with check (public.is_admin() and (created_by = auth.uid() or assigned_to = auth.uid()));
create policy "creator deletes own pa_cases" on public.pa_cases for delete
  using (public.is_admin() and created_by = auth.uid());

create policy "staff view events on visible pa_cases" on public.pa_case_events for select
  using (public.is_admin() and exists (
    select 1 from public.pa_cases c where c.id = pa_case_events.case_id
      and (c.created_by = auth.uid() or c.assigned_to = auth.uid())));
create policy "staff insert events on visible pa_cases" on public.pa_case_events for insert
  with check (public.is_admin() and exists (
    select 1 from public.pa_cases c where c.id = pa_case_events.case_id
      and (c.created_by = auth.uid() or c.assigned_to = auth.uid())));
-- No update/delete policy on pa_case_events — append-only by design.

-- Rate limiting (hardening item 1): one cap for all staff for now — no
-- paid/free plan tiers exist yet in this repo.
create table public.pa_usage (
  user_id     uuid not null references auth.users(id) on delete cascade,
  day         date not null default current_date,
  count       int not null default 0,
  primary key (user_id, day)
);

alter table public.pa_usage enable row level security;
create policy "staff manage own pa_usage" on public.pa_usage for all
  using (public.is_admin() and user_id = auth.uid())
  with check (public.is_admin() and user_id = auth.uid());

-- Atomic increment (avoids the read-then-upsert race found in AuthDraft's
-- earlier rate limiter — see this session's audit finding).
create or replace function public.increment_pa_usage(p_user_id uuid, p_day date)
returns int
language sql
security definer
set search_path = public
as $$
  insert into public.pa_usage (user_id, day, count)
  values (p_user_id, p_day, 1)
  on conflict (user_id, day)
  do update set count = pa_usage.count + 1
  returning count;
$$;

revoke execute on function public.increment_pa_usage(uuid, date) from public;
grant execute on function public.increment_pa_usage(uuid, date) to authenticated;

-- Audit trail (hardening item 2): generic, reusable beyond PA Tracker.
create table public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete set null,
  action        text not null,
  target        text,
  created_at    timestamptz not null default now()
);

alter table public.audit_log enable row level security;
create policy "staff manage own audit_log" on public.audit_log for all
  using (public.is_admin() and user_id = auth.uid())
  with check (public.is_admin() and user_id = auth.uid());

create table public.ai_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  feature     text not null,
  prompt      text not null,
  response    jsonb,
  error       text,
  created_at  timestamptz not null default now()
);

alter table public.ai_log enable row level security;
create policy "staff manage own ai_log" on public.ai_log for all
  using (public.is_admin() and user_id = auth.uid())
  with check (public.is_admin() and user_id = auth.uid());
