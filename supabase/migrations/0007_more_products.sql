-- Add more products to the NexMed shop
insert into public.products (slug, name, description, category, price_cents, currency, requires_rx, stock, active, sort_order)
values
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
