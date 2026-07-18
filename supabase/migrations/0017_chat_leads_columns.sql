-- chat_leads on the live database had drifted from 0006_chatbot.sql —
-- missing phone and notes, which lib/chatbot/tools/lead.ts (captureLead)
-- has always tried to write (silently failing until this was found).
-- Additive only, no data loss.
alter table public.chat_leads add column if not exists phone text;
alter table public.chat_leads add column if not exists notes text;
