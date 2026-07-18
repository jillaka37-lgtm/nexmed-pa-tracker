insert into public.products (slug, name, description, category, price_cents, currency, requires_rx, stock, active, sort_order)
values ('flonase-nasal-spray', 'Flonase Nasal Spray (120 sprays)', '24-hour relief from nasal allergy symptoms — sneezing, congestion, and itchy, watery eyes.', 'Allergy', 1699, 'usd', false, 90, true, 19)
on conflict (slug) do nothing;
