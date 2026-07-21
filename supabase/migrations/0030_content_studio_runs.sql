-- Live-progress tracking for Content Studio, matching the pattern already
-- used by blog_pipeline_runs: each step is mirrored here as it happens, so
-- the client can poll this row instead of needing websockets. Prefixed
-- content_ like the rest of this module's tables, for the same
-- collision-avoidance reason as 0026.

create table public.content_studio_runs (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('linkedin', 'carousel')),
  status       text not null default 'running' check (status in ('running', 'done', 'error')),
  topic_hint   text,
  steps        jsonb not null default '[]',
  piece_id     uuid references public.content_pieces(id) on delete set null,
  error        text,
  created_at   timestamptz not null default now(),
  finished_at  timestamptz
);

alter table public.content_studio_runs enable row level security;

create policy "admins manage content_studio_runs" on public.content_studio_runs
  for all using (public.is_admin()) with check (public.is_admin());
