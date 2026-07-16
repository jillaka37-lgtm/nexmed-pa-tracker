-- PENDING — written but not yet applied to the live database. Holding off
-- per instruction until deploy is approved. App-layer per-creator filtering
-- (lib/prior-auth/list.ts, lib/prior-auth/store.ts) is already live in code
-- and enforces isolation independent of this RLS change — this migration
-- adds defense-in-depth at the DB layer plus the views table.

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
