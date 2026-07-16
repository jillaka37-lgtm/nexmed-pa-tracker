-- Applied live (see supabase/migrations/README or migration history in the
-- nexmed-chatbot project). Adds defense-in-depth per-creator RLS, view
-- tracking, genuine public-share links, per-creator scoping on the AI/audit
-- log tables, and an atomic daily-usage counter.

create table public.prior_auth_views (
  id          uuid primary key default gen_random_uuid(),
  draft_id    uuid not null references public.prior_auth_drafts(id) on delete cascade,
  viewed_at   timestamptz not null default now()
);

create index prior_auth_views_draft_idx on public.prior_auth_views(draft_id);

alter table public.prior_auth_views enable row level security;
create policy "admins manage prior_auth_views"
  on public.prior_auth_views for all
  using (public.is_admin())
  with check (public.is_admin());

-- Replace the "any admin sees all drafts" policy from 0009 with per-creator
-- isolation, matching the original spec (each staff member only sees their
-- own drafts).
drop policy "admins manage prior_auth_drafts" on public.prior_auth_drafts;

create policy "staff manage own prior_auth_drafts"
  on public.prior_auth_drafts for all
  using (public.is_admin() and created_by = auth.uid())
  with check (public.is_admin() and created_by = auth.uid());

-- Real shareable links: a draft the creator has explicitly shared is
-- readable by anyone (including anon), scoped to that one draft only —
-- not a full-table-open policy. Toggled via app/api/prior-auth/[id]/share.
alter table public.prior_auth_drafts add column is_shared boolean not null default false;

create policy "shared prior_auth_drafts are publicly readable"
  on public.prior_auth_drafts for select
  to anon, authenticated
  using (is_shared = true);

-- ai_log and audit_log were scoped only by is_admin() in 0009, which let any
-- admin read every other admin's raw case prompts (diagnosis, medication,
-- prior treatments) via these tables even with per-creator isolation on
-- prior_auth_drafts itself. Tighten both to per-creator, closing that gap.
drop policy "admins manage ai_log" on public.ai_log;
create policy "staff manage own ai_log"
  on public.ai_log for all
  using (public.is_admin() and user_id = auth.uid())
  with check (public.is_admin() and user_id = auth.uid());

drop policy "admins manage audit_log" on public.audit_log;
create policy "staff manage own audit_log"
  on public.audit_log for all
  using (public.is_admin() and admin_user_id = auth.uid())
  with check (public.is_admin() and admin_user_id = auth.uid());

-- Atomic daily-usage increment: the previous app-layer read-then-upsert in
-- lib/prior-auth/rate-limit.ts had a TOCTOU race that let concurrent
-- requests both pass the cap check. A single INSERT ... ON CONFLICT DO
-- UPDATE ... RETURNING is atomic per row at the DB level.
create or replace function public.increment_prior_auth_usage(p_user_id uuid, p_day date)
returns int
language sql
security definer
set search_path = public
as $$
  insert into public.prior_auth_usage (user_id, day, count)
  values (p_user_id, p_day, 1)
  on conflict (user_id, day)
  do update set count = prior_auth_usage.count + 1
  returning count;
$$;

revoke execute on function public.increment_prior_auth_usage(uuid, date) from public;
grant execute on function public.increment_prior_auth_usage(uuid, date) to authenticated;
