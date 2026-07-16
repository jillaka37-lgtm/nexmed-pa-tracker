-- AuthDraft schema — already applied live to the nexmed-chatbot project
-- earlier this session. Recorded here for reproducibility.

-- Mirrors the main NexMed project's is_admin() helper (this project didn't
-- have it — only chatbot tables lived here before AuthDraft).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

create table public.prior_auth_drafts (
  id                          uuid primary key default gen_random_uuid(),
  case_id                     text not null,
  insurer                     text not null,
  medication                  text not null,
  diagnosis                   text not null,
  prior_treatments            text not null,
  notes                       text,
  letter_body                 text not null,
  medical_necessity_summary   text not null,
  prior_treatment_summary     text not null,
  missing_info_warnings       jsonb not null default '[]',
  status                      text not null default 'draft' check (status in ('draft', 'reviewed', 'submitted')),
  created_by                  uuid references auth.users(id) on delete set null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index prior_auth_drafts_created_by_idx on public.prior_auth_drafts(created_by, created_at desc);

alter table public.prior_auth_drafts enable row level security;

-- NOTE: as originally applied, this policy let ANY admin see ALL drafts
-- (shared team resource). Superseded by 0010_authdraft_views_and_isolation.sql,
-- which switches this to per-creator isolation — apply 0010 together with
-- this file on a fresh database, don't stop here.
create policy "admins manage prior_auth_drafts"
  on public.prior_auth_drafts for all
  using (public.is_admin())
  with check (public.is_admin());

create table public.prior_auth_usage (
  user_id     uuid not null references auth.users(id) on delete cascade,
  day         date not null default current_date,
  count       int not null default 0,
  primary key (user_id, day)
);

alter table public.prior_auth_usage enable row level security;
create policy "admins manage prior_auth_usage"
  on public.prior_auth_usage for all
  using (public.is_admin())
  with check (public.is_admin());

-- audit_log already existed (leftover chatbot scaffolding: id, admin_user_id,
-- action, target, created_at), RLS enabled but with no policy. Added one so
-- it's actually usable.
create policy "admins manage audit_log"
  on public.audit_log for all
  using (public.is_admin())
  with check (public.is_admin());

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
create policy "admins manage ai_log"
  on public.ai_log for all
  using (public.is_admin())
  with check (public.is_admin());
