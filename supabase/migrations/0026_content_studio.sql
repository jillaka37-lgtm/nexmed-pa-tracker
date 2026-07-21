-- Content Studio (stage 1): weekly brief -> LinkedIn writer agent -> human
-- approval queue -> archive. Table names are prefixed with content_/ai_ to
-- avoid colliding with any other project's tables in this shared database —
-- a bare `campaigns` or `posts` table name has bitten this exact pattern
-- before in a sibling project.

create table public.brand_voice (
  id            uuid primary key default gen_random_uuid(),
  tone          text not null default '',
  banned_words  text[] not null default '{}',
  audience      text not null default '',
  updated_at    timestamptz not null default now()
);

-- Singleton row seeded so the admin UI always has something to edit.
insert into public.brand_voice (tone, banned_words, audience)
values (
  'Warm, clear, caring, professional. Plain language, no jargon. Short sentences.',
  array['guaranteed', 'best in the industry', 'unbeatable', '100% cure'],
  'NexMed pharmacy patients and local healthcare partners'
);

create table public.content_briefs (
  id          uuid primary key default gen_random_uuid(),
  topics      jsonb not null default '[]',
  campaign    text,
  notes       text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create type public.content_platform as enum ('linkedin', 'reels', 'carousel');
create type public.content_status as enum ('draft', 'approved', 'rejected');

create table public.content_pieces (
  id             uuid primary key default gen_random_uuid(),
  brief_id       uuid not null references public.content_briefs(id) on delete cascade,
  platform       public.content_platform not null,
  hook           text,
  body           text not null,
  status         public.content_status not null default 'draft',
  reject_reason  text,
  score          numeric,
  created_at     timestamptz not null default now(),
  decided_at     timestamptz,
  decided_by     uuid references auth.users(id) on delete set null
);

create index content_pieces_brief_idx on public.content_pieces(brief_id);
create index content_pieces_status_idx on public.content_pieces(status);

-- NOTE: an `ai_log` table already exists in this database (lib/audit.ts's
-- logAiCall, used by PA Tracker) with shape (user_id, feature, prompt,
-- response jsonb, error, created_at). This is exactly the table-name
-- collision this project's own lessons warn about — so instead of creating
-- a second, incompatible `ai_log`, we reuse the existing one and only add
-- the token/cost columns it's missing, additive and nullable so existing
-- rows and callers are unaffected.
alter table public.ai_log add column if not exists input_tokens integer;
alter table public.ai_log add column if not exists output_tokens integer;
alter table public.ai_log add column if not exists cost_usd numeric;

alter table public.brand_voice    enable row level security;
alter table public.content_briefs enable row level security;
alter table public.content_pieces enable row level security;

create policy "admins manage brand_voice" on public.brand_voice
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage content_briefs" on public.content_briefs
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage content_pieces" on public.content_pieces
  for all using (public.is_admin()) with check (public.is_admin());
