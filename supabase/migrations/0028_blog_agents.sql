-- Blog multi-agent pipeline: idea-scout -> writer <-> editor loop -> seo ->
-- publisher (code, not an agent) -> critic. Tables prefixed blog_ for the
-- same collision-avoidance reason as 0026 (content_/ai_ prefix).

create table public.blog_posts (
  id                uuid primary key default gen_random_uuid(),
  run_id            uuid,
  title             text not null,
  slug              text not null unique,
  excerpt           text,
  content_md        text not null,
  meta_title        text,
  meta_description  text,
  keywords          jsonb not null default '[]',
  faq               jsonb not null default '[]',
  score             numeric,
  status            text not null default 'draft' check (status in ('draft', 'published')),
  created_at        timestamptz not null default now(),
  published_at      timestamptz
);

create index blog_posts_status_idx on public.blog_posts(status, published_at);

create table public.blog_pipeline_runs (
  id           uuid primary key default gen_random_uuid(),
  status       text not null default 'running' check (status in ('running', 'done', 'error')),
  topic_hint   text,
  steps        jsonb not null default '[]',
  post_id      uuid references public.blog_posts(id) on delete set null,
  error        text,
  created_at   timestamptz not null default now(),
  finished_at  timestamptz
);

alter table public.blog_posts add constraint blog_posts_run_fk
  foreign key (run_id) references public.blog_pipeline_runs(id) on delete set null;

-- Self-improvement memory: the critic agent (and human feedback) write
-- lessons here, targeted at a specific agent id. lessons.ts caps active
-- lessons per agent at 8 so this prompt-injection budget can't grow unbounded.
create table public.blog_lessons (
  id          uuid primary key default gen_random_uuid(),
  agent       text not null,
  lesson      text not null,
  source      text not null default 'critic' check (source in ('critic', 'human')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index blog_lessons_agent_idx on public.blog_lessons(agent, active);

create table public.blog_feedback (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.blog_posts(id) on delete cascade,
  rating      smallint not null check (rating in (-1, 1)),
  comment     text,
  created_at  timestamptz not null default now()
);

alter table public.blog_posts          enable row level security;
alter table public.blog_pipeline_runs  enable row level security;
alter table public.blog_lessons        enable row level security;
alter table public.blog_feedback       enable row level security;

create policy "admins manage blog_posts" on public.blog_posts
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage blog_pipeline_runs" on public.blog_pipeline_runs
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage blog_lessons" on public.blog_lessons
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage blog_feedback" on public.blog_feedback
  for all using (public.is_admin()) with check (public.is_admin());

-- Published posts are public content — anyone (including anon) may read
-- published rows, mirroring how /blog will be served with no auth.
create policy "public reads published blog_posts" on public.blog_posts
  for select using (status = 'published');
