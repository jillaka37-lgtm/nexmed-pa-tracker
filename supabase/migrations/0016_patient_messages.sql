-- Simple inbox: one flat thread per patient between them and pharmacy staff.
create type public.message_sender as enum ('patient', 'staff');

create table public.patient_messages (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  sender_role        public.message_sender not null,
  body               text not null,
  created_by         uuid references auth.users(id) on delete set null,
  read_by_patient_at timestamptz,
  read_by_staff_at   timestamptz,
  created_at         timestamptz not null default now()
);

create index patient_messages_user_idx on public.patient_messages(user_id, created_at);

alter table public.patient_messages enable row level security;

create policy "patients read own messages" on public.patient_messages
  for select using (auth.uid() = user_id or public.is_admin());
create policy "patients send own messages" on public.patient_messages
  for insert with check (
    (auth.uid() = user_id and sender_role = 'patient')
    or public.is_admin()
  );
create policy "patients update own read receipt" on public.patient_messages
  for update using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());
