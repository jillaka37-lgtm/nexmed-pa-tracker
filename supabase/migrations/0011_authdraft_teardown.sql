-- Removes AuthDraft (superseded by PA Tracker, see 0012_pa_tracker.sql).
-- Historical migrations 0009/0010 are left in place; this is a forward
-- teardown, not a revert. is_admin() is kept — PA Tracker's RLS reuses it.

drop policy if exists "shared prior_auth_drafts are publicly readable" on public.prior_auth_drafts;
drop policy if exists "staff manage own prior_auth_drafts" on public.prior_auth_drafts;
drop policy if exists "admins manage prior_auth_views" on public.prior_auth_views;
drop policy if exists "admins manage prior_auth_usage" on public.prior_auth_usage;
drop policy if exists "staff manage own ai_log" on public.ai_log;
drop policy if exists "staff manage own audit_log" on public.audit_log;

-- Confirmed via repo-wide grep: ai_log and audit_log are used only by
-- AuthDraft's lib/prior-auth/audit.ts, despite 0009's comment calling them
-- pre-existing chatbot scaffolding — safe to drop outright.
drop table if exists public.prior_auth_views;
drop table if exists public.prior_auth_drafts;
drop table if exists public.prior_auth_usage;
drop table if exists public.ai_log;
drop table if exists public.audit_log;

drop function if exists public.increment_prior_auth_usage(uuid, date);
