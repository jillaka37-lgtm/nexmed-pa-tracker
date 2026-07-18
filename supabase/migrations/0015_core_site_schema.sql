-- Adds NexMed's core site tables that were missing from the live database
-- this project's NEXT_PUBLIC_SUPABASE_URL points to (kxdhmzzswssqxfexfpot).
-- profiles/user_role/admin_emails already exist there in a different,
-- working form (role is plain text, no admin_emails auto-promotion) —
-- those are intentionally NOT recreated or altered here. See conversation/
-- incident notes for how this drift was discovered.

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
-- Availability
-- ---------------------------------------------------------------------------
create table public.availability_rules (
  id           uuid primary key default gen_random_uuid(),
  weekday      smallint not null check (weekday between 0 and 6),
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
  is_closed  boolean not null default true,
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
-- Webinars
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

-- ---------------------------------------------------------------------------
-- Prescription refills
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Shop: products, orders, order items
-- ---------------------------------------------------------------------------
create type public.order_status as enum (
  'pending_payment', 'paid', 'fulfilled', 'cancelled'
);

create table public.products (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  description  text not null default '',
  category     text not null default 'General',
  price_cents  integer not null default 0,
  currency     text not null default 'usd',
  image_url    text,
  requires_rx  boolean not null default false,
  stock        integer not null default 0,
  active       boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create table public.orders (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users (id) on delete set null,
  email                 text,
  status                public.order_status not null default 'pending_payment',
  amount_cents          integer not null default 0,
  currency              text not null default 'usd',
  stripe_session_id     text,
  stripe_payment_intent text,
  shipping_address      text,
  created_at            timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id);
create index orders_session_idx on public.orders (stripe_session_id);

create table public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete cascade,
  product_id        uuid references public.products (id) on delete set null,
  name              text not null,
  unit_amount_cents integer not null,
  quantity          integer not null default 1 check (quantity > 0)
);

create index order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.services               enable row level security;
alter table public.availability_rules     enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.bookings               enable row level security;
alter table public.testimonials           enable row level security;
alter table public.webinars               enable row level security;
alter table public.contact_messages       enable row level security;
alter table public.prescription_refills   enable row level security;
alter table public.products               enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_items            enable row level security;

create policy "services_public_read" on public.services
  for select using (active or public.is_admin());
create policy "services_admin_all" on public.services
  for all using (public.is_admin()) with check (public.is_admin());

create policy "availability_rules_read" on public.availability_rules
  for select using (true);
create policy "availability_rules_admin" on public.availability_rules
  for all using (public.is_admin()) with check (public.is_admin());

create policy "availability_exceptions_read" on public.availability_exceptions
  for select using (true);
create policy "availability_exceptions_admin" on public.availability_exceptions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "bookings_read_own" on public.bookings
  for select using (auth.uid() = user_id or public.is_admin());
create policy "bookings_admin_all" on public.bookings
  for all using (public.is_admin()) with check (public.is_admin());

create policy "testimonials_public_read" on public.testimonials
  for select using (approved or public.is_admin());
create policy "testimonials_admin_all" on public.testimonials
  for all using (public.is_admin()) with check (public.is_admin());

create policy "webinars_public_read" on public.webinars
  for select using (true);
create policy "webinars_admin_all" on public.webinars
  for all using (public.is_admin()) with check (public.is_admin());

create policy "contact_messages_insert_anyone" on public.contact_messages
  for insert with check (true);
create policy "contact_messages_admin_all" on public.contact_messages
  for select using (public.is_admin());
create policy "contact_messages_admin_manage" on public.contact_messages
  for all using (public.is_admin()) with check (public.is_admin());

create policy "refills_insert_anyone" on public.prescription_refills
  for insert with check (true);
create policy "refills_read_own" on public.prescription_refills
  for select using (auth.uid() = user_id);
create policy "refills_admin_all" on public.prescription_refills
  for all using (public.is_admin()) with check (public.is_admin());

create policy "products_read_active" on public.products
  for select using (active or public.is_admin());
create policy "products_admin_all" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "orders_read_own" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "order_items_read_own" on public.order_items
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------------------
insert into public.services (slug, title, description, duration_min, price_cents, currency, active, sort_order)
values (
  'initial-consultation',
  'Initial AI-Assisted Consultation',
  'A focused 30-minute 1:1 session combining AI-prepared health insights with personal, expert guidance. We review your goals, answer your questions, and leave you with a clear, actionable plan.',
  30, 9900, 'usd', true, 1
) on conflict (slug) do nothing;

insert into public.availability_rules (weekday, start_time, end_time, slot_minutes, active)
values
  (1, '09:00', '17:00', 30, true),
  (2, '09:00', '17:00', 30, true),
  (3, '09:00', '17:00', 30, true),
  (4, '09:00', '17:00', 30, true),
  (5, '09:00', '17:00', 30, true);

insert into public.testimonials (name, role, content, rating, approved, sort_order)
values
  ('Sarah M.', 'Caregiver', 'The consultation felt genuinely personal. I left with a clear plan and finally understood my options — no jargon, just real guidance.', 5, true, 1),
  ('David L.', 'Health-conscious professional', 'Booking and paying took two minutes, and the session was worth every penny. The AI-prepared summary afterward was a brilliant touch.', 5, true, 2),
  ('Priya R.', 'Patient', 'Warm, knowledgeable and never rushed. This is what healthcare guidance should feel like.', 5, true, 3);

insert into public.products (slug, name, description, category, price_cents, currency, requires_rx, stock, active, sort_order)
values
  ('pain-relief-500', 'Pain Relief 500mg (24 tablets)', 'Fast-acting relief for headaches, aches, and pains.', 'Pain & Fever', 799, 'usd', false, 100, true, 1),
  ('allergy-relief', 'Allergy Relief 10mg (30 tablets)', 'Non-drowsy antihistamine for hay fever and allergies.', 'Allergy', 1199, 'usd', false, 80, true, 2),
  ('vitamin-d3', 'Vitamin D3 1000 IU (90 capsules)', 'Daily support for bones, teeth, and immune health.', 'Vitamins', 1499, 'usd', false, 120, true, 3),
  ('cold-flu-relief', 'Cold & Flu Relief Sachets (10 pack)', 'Warming blackcurrant sachets to ease cold and flu symptoms.', 'Cold & Flu', 899, 'usd', false, 90, true, 4),
  ('digital-thermometer', 'Digital Thermometer', 'Fast, accurate temperature readings for the whole family.', 'Devices', 1299, 'usd', false, 40, true, 5),
  ('hand-sanitizer', 'Hand Sanitizer Gel (250ml)', 'Kills 99.9% of germs; with moisturizing aloe vera.', 'Personal Care', 499, 'usd', false, 150, true, 6),
  ('omega-3-fish-oil', 'Omega-3 Fish Oil 1000mg (60 capsules)', 'High-strength fish oil for heart, brain, and joint health.', 'Vitamins', 1899, 'usd', false, 100, true, 7),
  ('vitamin-c-1000', 'Vitamin C 1000mg (60 tablets)', 'Immune-boosting antioxidant with sustained release formula.', 'Vitamins', 1299, 'usd', false, 120, true, 8),
  ('multivitamin-daily', 'Daily Multivitamin (30 tablets)', 'Complete A-Z formula covering all essential vitamins and minerals.', 'Vitamins', 1699, 'usd', false, 100, true, 9),
  ('blood-pressure-monitor', 'Digital Blood Pressure Monitor', 'Clinically validated arm cuff monitor with memory for 60 readings.', 'Devices', 3499, 'usd', false, 30, true, 10),
  ('pulse-oximeter', 'Finger Pulse Oximeter', 'Instant SpO₂ and pulse rate readings. Compact and easy to use.', 'Devices', 1999, 'usd', false, 50, true, 11),
  ('first-aid-kit', 'First Aid Kit (85 pieces)', 'Comprehensive kit for home and travel — bandages, antiseptic, gloves and more.', 'Personal Care', 2499, 'usd', false, 60, true, 12),
  ('sunscreen-spf50', 'Moisturizing Sunscreen SPF 50 (100ml)', 'Broad-spectrum UVA/UVB protection with hydrating formula. Water-resistant.', 'Personal Care', 1599, 'usd', false, 80, true, 13),
  ('antacid-tablets', 'Antacid Chewable Tablets (48 tablets)', 'Fast relief from heartburn, indigestion, and acid reflux.', 'Digestive Health', 799, 'usd', false, 90, true, 14),
  ('probiotic-capsules', 'Probiotic 10 Billion CFU (30 capsules)', 'Multi-strain formula for gut balance, digestion, and immune support.', 'Digestive Health', 2199, 'usd', false, 70, true, 15),
  ('sleep-aid', 'Natural Sleep Aid 25mg (30 tablets)', 'Non-habit-forming formula with melatonin for restful sleep.', 'Sleep & Relaxation', 1299, 'usd', false, 80, true, 16)
on conflict (slug) do nothing;
