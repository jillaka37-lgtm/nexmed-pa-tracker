-- NexMed — RLS policies, admin helper, and signup trigger.

-- ---------------------------------------------------------------------------
-- Helper: is the current user an admin? (security definer to avoid recursion)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Create a profile automatically on signup; auto-promote configured admins.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    case
      when exists (select 1 from public.admin_emails where email = new.email)
      then 'admin'::public.user_role
      else 'client'::public.user_role
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table public.profiles               enable row level security;
alter table public.admin_emails           enable row level security;
alter table public.services               enable row level security;
alter table public.availability_rules     enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.bookings               enable row level security;
alter table public.testimonials           enable row level security;
alter table public.webinars               enable row level security;
alter table public.contact_messages       enable row level security;

-- profiles: read/update own; admin reads all. (Inserts happen via the trigger.)
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid() and role = 'client');
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- admin_emails: admin only.
create policy "admin_emails_admin" on public.admin_emails
  for all using (public.is_admin()) with check (public.is_admin());

-- services: anyone reads active; admin manages all.
create policy "services_public_read" on public.services
  for select using (active or public.is_admin());
create policy "services_admin_all" on public.services
  for all using (public.is_admin()) with check (public.is_admin());

-- availability: anyone reads; admin manages.
create policy "availability_rules_read" on public.availability_rules
  for select using (true);
create policy "availability_rules_admin" on public.availability_rules
  for all using (public.is_admin()) with check (public.is_admin());

create policy "availability_exceptions_read" on public.availability_exceptions
  for select using (true);
create policy "availability_exceptions_admin" on public.availability_exceptions
  for all using (public.is_admin()) with check (public.is_admin());

-- bookings: user reads own; admin reads all. Writes go through server (service role).
create policy "bookings_select_own" on public.bookings
  for select using (user_id = auth.uid() or public.is_admin());
create policy "bookings_admin_all" on public.bookings
  for all using (public.is_admin()) with check (public.is_admin());

-- testimonials: anyone reads approved; admin manages all.
create policy "testimonials_public_read" on public.testimonials
  for select using (approved or public.is_admin());
create policy "testimonials_admin_all" on public.testimonials
  for all using (public.is_admin()) with check (public.is_admin());

-- webinars: anyone reads scheduled/live; admin manages all.
create policy "webinars_public_read" on public.webinars
  for select using (status in ('scheduled', 'live', 'ended') or public.is_admin());
create policy "webinars_admin_all" on public.webinars
  for all using (public.is_admin()) with check (public.is_admin());

-- contact_messages: anyone may submit; only admin reads.
create policy "contact_insert_anyone" on public.contact_messages
  for insert with check (true);
create policy "contact_admin_read" on public.contact_messages
  for select using (public.is_admin());
