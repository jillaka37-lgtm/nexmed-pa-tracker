-- NexMed — online shop: products, orders, order items.
-- NOTE: selling medication online is regulated. Rx products are flagged
-- (requires_rx) and should be pharmacist-reviewed before fulfilment.

create type public.order_status as enum (
  'pending_payment', 'paid', 'fulfilled', 'cancelled'
);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
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
-- RLS
-- ---------------------------------------------------------------------------
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Products: anyone reads active products; admin manages all.
create policy "products_read_active" on public.products
  for select using (active or public.is_admin());
create policy "products_admin_all" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- Orders & items: writes happen via the service-role client after Stripe.
-- Users may read their own; admin reads all.
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
-- Seed — sample over-the-counter products
-- ---------------------------------------------------------------------------
insert into public.products (slug, name, description, category, price_cents, currency, requires_rx, stock, active, sort_order)
values
  ('pain-relief-500', 'Pain Relief 500mg (24 tablets)', 'Fast-acting relief for headaches, aches, and pains.', 'Pain & Fever', 799, 'usd', false, 100, true, 1),
  ('allergy-relief', 'Allergy Relief 10mg (30 tablets)', 'Non-drowsy antihistamine for hay fever and allergies.', 'Allergy', 1199, 'usd', false, 80, true, 2),
  ('vitamin-d3', 'Vitamin D3 1000 IU (90 capsules)', 'Daily support for bones, teeth, and immune health.', 'Vitamins', 1499, 'usd', false, 120, true, 3),
  ('cold-flu-relief', 'Cold & Flu Relief Sachets (10 pack)', 'Warming blackcurrant sachets to ease cold and flu symptoms.', 'Cold & Flu', 899, 'usd', false, 90, true, 4),
  ('digital-thermometer', 'Digital Thermometer', 'Fast, accurate temperature readings for the whole family.', 'Devices', 1299, 'usd', false, 40, true, 5),
  ('hand-sanitizer', 'Hand Sanitizer Gel (250ml)', 'Kills 99.9% of germs; with moisturizing aloe vera.', 'Personal Care', 499, 'usd', false, 150, true, 6)
on conflict (slug) do nothing;
