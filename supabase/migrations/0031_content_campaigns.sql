-- Multi-channel campaigns: a theme -> one "mother narrative" -> four
-- channel runs. run_ids links to content_studio_runs rows, one per
-- channel, so each channel owns its own steps array — the reason
-- parallel execution here is safe when it wasn't for repurpose (where
-- Instagram and LinkedIn wrote to one shared steps array).
-- Prefixed content_ for the same collision-avoidance reason as 0026 — this
-- exact bare name ("campaigns") collided with an unrelated table once in
-- the reference build.

create table public.content_campaigns (
  id          uuid primary key default gen_random_uuid(),
  theme       text not null,
  narrative   jsonb,
  run_ids     jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) on delete set null
);

alter table public.content_campaigns enable row level security;

create policy "admins manage content_campaigns" on public.content_campaigns
  for all using (public.is_admin()) with check (public.is_admin());
