-- NexMed AI Chatbot — database schema
-- Requires pgvector extension for RAG embeddings.

create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- Knowledge base for RAG
-- ---------------------------------------------------------------------------
create table public.chat_documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text not null,
  embedding   vector(768),
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

-- IVFFlat index for approximate nearest-neighbour cosine search
create index chat_documents_embedding_idx
  on public.chat_documents
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- RPC used by rag.ts — returns documents ordered by cosine similarity
create or replace function match_chat_documents(
  query_embedding vector(768),
  match_count     int default 4,
  match_threshold float default 0.5
)
returns table (
  id        uuid,
  title     text,
  content   text,
  metadata  jsonb,
  similarity float
)
language sql stable
as $$
  select
    id,
    title,
    content,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  from public.chat_documents
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- ---------------------------------------------------------------------------
-- Sessions — one per conversation (web/telegram/widget)
-- ---------------------------------------------------------------------------
create table public.chat_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete set null,
  channel          text not null check (channel in ('web', 'telegram', 'widget')),
  telegram_chat_id bigint unique,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Messages — short-term memory archive
-- ---------------------------------------------------------------------------
create table public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.chat_sessions(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant', 'tool')),
  content     text not null,
  tool_name   text,
  created_at  timestamptz not null default now()
);

create index chat_messages_session_idx on public.chat_messages(session_id, created_at);

-- ---------------------------------------------------------------------------
-- Leads captured by the chatbot
-- ---------------------------------------------------------------------------
create table public.chat_leads (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references public.chat_sessions(id) on delete set null,
  name        text,
  email       text,
  phone       text,
  notes       text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- (Service-role client in brain.ts bypasses all RLS for writes)
-- ---------------------------------------------------------------------------
alter table public.chat_documents enable row level security;
alter table public.chat_sessions  enable row level security;
alter table public.chat_messages  enable row level security;
alter table public.chat_leads     enable row level security;

-- Admins can manage everything
create policy "admins manage chat_documents"
  on public.chat_documents for all
  using (public.is_admin()) with check (public.is_admin());

create policy "admins manage chat_sessions"
  on public.chat_sessions for all
  using (public.is_admin()) with check (public.is_admin());

create policy "admins manage chat_messages"
  on public.chat_messages for all
  using (public.is_admin()) with check (public.is_admin());

create policy "admins manage chat_leads"
  on public.chat_leads for all
  using (public.is_admin()) with check (public.is_admin());
