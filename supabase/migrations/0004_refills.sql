-- NexMed — prescription refill requests
-- Patients submit a request to refill/order a prescription; the pharmacy
-- reviews it and follows up. This is a request intake, not an online checkout.

create type public.refill_status as enum (
  'received', 'processing', 'ready', 'completed', 'cancelled'
);

create type public.fulfilment_method as enum ('pickup', 'delivery');

create table public.prescription_refills (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users (id) on delete set null,
  full_name          text not null,
  email              text not null,
  phone              text not null,
  date_of_birth      date,
  medication_name    text not null,
  prescription_number text,
  dosage             text,
  current_pharmacy   text,
  fulfilment         public.fulfilment_method not null default 'pickup',
  delivery_address   text,
  notes              text,
  status             public.refill_status not null default 'received',
  created_at         timestamptz not null default now()
);

create index refills_user_idx on public.prescription_refills (user_id);
create index refills_status_idx on public.prescription_refills (status);

alter table public.prescription_refills enable row level security;

-- Anyone may submit a refill request; signed-in users can read their own;
-- admin reads and manages all.
create policy "refills_insert_anyone" on public.prescription_refills
  for insert with check (true);

create policy "refills_read_own" on public.prescription_refills
  for select using (auth.uid() = user_id);

create policy "refills_admin_all" on public.prescription_refills
  for all using (public.is_admin()) with check (public.is_admin());
