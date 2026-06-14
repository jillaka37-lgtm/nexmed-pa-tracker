-- NexMed — core schema
-- Single-consultant booking platform: profiles, services, availability, bookings.

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('client', 'admin');

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text,
  phone       text,
  role        public.user_role not null default 'client',
  created_at  timestamptz not null default now()
);

-- Emails listed here are auto-promoted to admin on signup. Seeded in 0003.
create table public.admin_emails (
  email text primary key
);

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------
create table public.services (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  description  text not null default '',
  duration_min integer not null default 30,
  price_cents  integer not null default 0,
  currency     text not null default 'usd',
  active       boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Availability — weekly recurring rules + one-off exceptions (admin managed)
-- ---------------------------------------------------------------------------
create table public.availability_rules (
  id           uuid primary key default gen_random_uuid(),
  weekday      smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time   time not null,
  end_time     time not null,
  slot_minutes integer not null default 30,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  check (end_time > start_time)
);

create table public.availability_exceptions (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  is_closed  boolean not null default true, -- true = day off; false = special open hours
  start_time time,
  end_time   time,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
create type public.booking_status as enum (
  'pending_payment', 'confirmed', 'cancelled', 'completed'
);

create table public.bookings (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users (id) on delete cascade,
  service_id            uuid references public.services (id) on delete set null,
  start_at              timestamptz not null,
  end_at                timestamptz not null,
  status                public.booking_status not null default 'pending_payment',
  amount_cents          integer not null default 0,
  currency              text not null default 'usd',
  stripe_session_id     text,
  stripe_payment_intent text,
  meeting_link          text,
  notes                 text,
  created_at            timestamptz not null default now(),
  check (end_at > start_at)
);

create index bookings_user_idx on public.bookings (user_id);
create index bookings_start_idx on public.bookings (start_at);
create index bookings_session_idx on public.bookings (stripe_session_id);

-- Prevent two active bookings from overlapping (single consultant).
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (tstzrange(start_at, end_at) with &&)
  where (status in ('pending_payment', 'confirmed'));

-- ---------------------------------------------------------------------------
-- Testimonials
-- ---------------------------------------------------------------------------
create table public.testimonials (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text,
  content    text not null,
  avatar_url text,
  rating     smallint not null default 5 check (rating between 1 and 5),
  approved   boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Webinars (future feature — schema ready, no UI yet)
-- ---------------------------------------------------------------------------
create type public.webinar_status as enum ('draft', 'scheduled', 'live', 'ended');

create table public.webinars (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text not null default '',
  scheduled_at timestamptz,
  duration_min integer not null default 60,
  capacity     integer,
  join_url     text,
  status       public.webinar_status not null default 'draft',
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Contact messages
-- ---------------------------------------------------------------------------
create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  message    text not null,
  created_at timestamptz not null default now()
);
