-- Care-coordination CRM: added alongside the existing sales CRM (leads/
-- contacts/companies/deals), not replacing it. "Patients" reuses the real
-- registered users (profiles where role='client') rather than duplicating
-- identity — patient_profiles holds the clinical/preference extension.

create table public.patient_profiles (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  date_of_birth        date,
  allergies            text,
  conditions           text,
  preferred_pharmacy   text,
  insurance_provider   text,
  insurance_member_id  text,
  notes                text,
  updated_at           timestamptz not null default now()
);

create table public.prescribers (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  specialty     text,
  clinic_name   text,
  phone         text,
  email         text,
  fax           text,
  notes         text,
  created_at    timestamptz not null default now()
);

create table public.insurance_companies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone         text,
  claims_email  text,
  notes         text,
  created_at    timestamptz not null default now()
);

create table public.pharmacy_contacts (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  role_title    text,
  organization  text,
  phone         text,
  email         text,
  notes         text,
  created_at    timestamptz not null default now()
);

-- Powers Tasks & Follow-ups, Notes, and Reminders as filtered views of one
-- table, mirroring the sales CRM's activities table pattern.
create type public.patient_activity_type as enum ('note', 'task', 'reminder');

create table public.patient_activities (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        public.patient_activity_type not null,
  title       text not null,
  body        text,
  due_at      timestamptz,
  remind_at   timestamptz,
  done_at     timestamptz,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index patient_activities_user_idx on public.patient_activities(user_id, created_at);
create index patient_activities_type_idx on public.patient_activities(type);
create index patient_activities_due_idx on public.patient_activities(due_at) where type = 'task' and done_at is null;
create index patient_activities_remind_idx on public.patient_activities(remind_at) where type = 'reminder' and done_at is null;

alter table public.patient_profiles     enable row level security;
alter table public.prescribers          enable row level security;
alter table public.insurance_companies  enable row level security;
alter table public.pharmacy_contacts    enable row level security;
alter table public.patient_activities   enable row level security;

create policy "admins manage patient_profiles" on public.patient_profiles
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage prescribers" on public.prescribers
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage insurance_companies" on public.insurance_companies
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage pharmacy_contacts" on public.pharmacy_contacts
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage patient_activities" on public.patient_activities
  for all using (public.is_admin()) with check (public.is_admin());
