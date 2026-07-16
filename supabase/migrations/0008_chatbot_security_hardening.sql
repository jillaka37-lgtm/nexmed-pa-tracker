-- Already applied live to the nexmed-chatbot project earlier this session.
-- Recorded here for reproducibility — the repo's migration files previously
-- didn't reflect this, so `supabase db reset` would have produced a
-- different (insecure) schema than what's actually running in production.

-- chat_sessions/chat_messages/chat_documents/chat_leads/chat_feedback/profiles
-- had RLS disabled entirely — anyone with the public anon key could read or
-- write every row. Enabling RLS with no policies default-denies anon access
-- (service-role client used by all chatbot code bypasses RLS regardless).
alter table public.chat_sessions   enable row level security;
alter table public.chat_messages   enable row level security;
alter table public.chat_documents  enable row level security;
alter table public.chat_leads      enable row level security;
alter table public.chat_feedback   enable row level security;
alter table public.profiles        enable row level security;

create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

-- handle_new_user is a signup trigger (references `new`, only valid in
-- trigger context) — should never be callable directly via RPC.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;

-- Pin search_path on RPC-exposed / SECURITY DEFINER functions to prevent
-- search_path hijacking.
alter function public.handle_new_user() set search_path = public;
alter function public.match_chat_documents(vector, int, float) set search_path = public;
alter function public.match_chunks(vector, int, float) set search_path = public;
