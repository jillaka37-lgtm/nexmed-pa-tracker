-- CRM: companies, contacts, leads, a deals pipeline, and an activity
-- timeline. Admin/staff-only, mirrors the shared-visibility pattern used
-- for services/availability (not the per-creator isolation used for
-- pa_cases) since the sales pipeline is a shared team view.
--
-- NOTE on history: when this was first written, contact_messages didn't
-- exist yet and chat_leads was missing phone/notes on the live database —
-- both have since been fixed (see 0015_core_site_schema.sql and
-- 0017_chat_leads_columns.sql). This migration still only sources leads
-- from chat_leads; wiring contact_messages in as a second source is a
-- follow-up, not done here.

create table public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  industry    text,
  phone       text,
  notes       text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Contacts — the primary CRM entity (individual customers/leads)
-- ---------------------------------------------------------------------------
create type public.contact_source as enum ('contact_form', 'chatbot', 'manual');

create table public.contacts (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid references public.companies(id) on delete set null,
  full_name   text not null,
  email       text,
  phone       text,
  source      public.contact_source not null default 'manual',
  notes       text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index contacts_company_idx on public.contacts(company_id);
create index contacts_email_idx on public.contacts(email);

-- ---------------------------------------------------------------------------
-- Leads — raw inbound interest, unified from chat_leads plus manual entry.
-- Converting a lead creates/links a contact.
-- ---------------------------------------------------------------------------
create type public.lead_status as enum ('new', 'contacted', 'qualified', 'converted', 'lost');

create table public.leads (
  id                      uuid primary key default gen_random_uuid(),
  source                  public.contact_source not null,
  name                    text,
  email                   text,
  phone                   text,
  message                 text,
  status                  public.lead_status not null default 'new',
  contact_id              uuid references public.contacts(id) on delete set null,
  ai_score                smallint check (ai_score between 0 and 100),
  ai_score_rationale      text,
  ai_scored_at            timestamptz,
  source_chat_lead_id     uuid references public.chat_leads(id) on delete set null,
  created_at              timestamptz not null default now()
);

create index leads_status_idx on public.leads(status);
create index leads_contact_idx on public.leads(contact_id);
create unique index leads_chat_lead_idx on public.leads(source_chat_lead_id) where source_chat_lead_id is not null;

-- Pull existing chat_leads into the new table once.
insert into public.leads (source, name, email, phone, message, source_chat_lead_id, created_at)
select 'chatbot', cl.name, cl.email, cl.phone, cl.notes, cl.id, cl.created_at
from public.chat_leads cl
where cl.name is not null or cl.email is not null or cl.phone is not null
on conflict do nothing;

-- Keep it in sync going forward.
create or replace function public.crm_lead_from_chat_lead()
returns trigger language plpgsql as $$
begin
  if new.name is not null or new.email is not null or new.phone is not null then
    insert into public.leads (source, name, email, phone, message, source_chat_lead_id, created_at)
    values ('chatbot', new.name, new.email, new.phone, new.notes, new.id, new.created_at);
  end if;
  return new;
end;
$$;

create trigger chat_leads_to_lead
  after insert on public.chat_leads
  for each row execute function public.crm_lead_from_chat_lead();

alter function public.crm_lead_from_chat_lead() set search_path = public;

-- ---------------------------------------------------------------------------
-- Pipeline stages — config-driven, not an enum, so staff can reorder/rename.
-- ---------------------------------------------------------------------------
create table public.deal_stages (
  key       text primary key,
  label     text not null,
  position  integer not null,
  is_won    boolean not null default false,
  is_lost   boolean not null default false
);

insert into public.deal_stages (key, label, position, is_won, is_lost) values
  ('new',        'New',              1, false, false),
  ('contacted',  'Contacted',        2, false, false),
  ('qualified',  'Qualified',        3, false, false),
  ('proposal',   'Proposal Sent',    4, false, false),
  ('won',        'Won',              5, true,  false),
  ('lost',       'Lost',             6, false, true);

-- ---------------------------------------------------------------------------
-- Deals
-- ---------------------------------------------------------------------------
create type public.deal_status as enum ('open', 'won', 'lost');

create table public.deals (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  contact_id      uuid not null references public.contacts(id) on delete cascade,
  company_id      uuid references public.companies(id) on delete set null,
  stage_key       text not null references public.deal_stages(key) default 'new',
  status          public.deal_status not null default 'open',
  amount_cents    integer not null default 0,
  expected_close  date,
  lost_reason     text,
  stage_entered_at timestamptz not null default now(),
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index deals_stage_idx on public.deals(stage_key);
create index deals_contact_idx on public.deals(contact_id);

-- ---------------------------------------------------------------------------
-- Activities — timeline entries attached to a contact and/or a deal
-- ---------------------------------------------------------------------------
create type public.activity_type as enum ('call', 'meeting', 'note', 'task', 'stage_change');

create table public.activities (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid references public.contacts(id) on delete cascade,
  deal_id     uuid references public.deals(id) on delete cascade,
  type        public.activity_type not null,
  title       text not null,
  body        text,
  due_at      timestamptz,
  done_at     timestamptz,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  check (contact_id is not null or deal_id is not null)
);

create index activities_contact_idx on public.activities(contact_id, created_at);
create index activities_deal_idx on public.activities(deal_id, created_at);
create index activities_due_idx on public.activities(due_at) where done_at is null;

-- ---------------------------------------------------------------------------
-- Row Level Security — shared team visibility for all authenticated admins,
-- same shape as services/availability policies in 0002_rls.sql.
-- ---------------------------------------------------------------------------
alter table public.companies   enable row level security;
alter table public.contacts    enable row level security;
alter table public.leads       enable row level security;
alter table public.deal_stages enable row level security;
alter table public.deals       enable row level security;
alter table public.activities  enable row level security;

create policy "admins manage companies" on public.companies
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage contacts" on public.contacts
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage leads" on public.leads
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins read deal_stages" on public.deal_stages
  for select using (public.is_admin());
create policy "admins manage deals" on public.deals
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage activities" on public.activities
  for all using (public.is_admin()) with check (public.is_admin());
