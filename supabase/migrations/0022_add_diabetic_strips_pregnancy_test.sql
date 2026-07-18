insert into public.products (slug, name, description, category, price_cents, currency, requires_rx, stock, active, sort_order, image_url)
values
  ('diabetic-test-strips-monitor', 'Blood Glucose Monitor & Test Strips (25 strips)', 'Complete blood glucose monitoring kit with lancing device and 25 test strips.', 'Devices', 2999, 'usd', false, 60, true, 17, 'https://kxdhmzzswssqxfexfpot.supabase.co/storage/v1/object/public/product-images/diabetic-test-strips-monitor.jpg'),
  ('pregnancy-test', 'Early Result Pregnancy Test (2 pack)', 'Fast, private, and over 99% accurate from the day of your missed period.', 'Personal Care', 1099, 'usd', false, 100, true, 18, 'https://kxdhmzzswssqxfexfpot.supabase.co/storage/v1/object/public/product-images/pregnancy-test.jpg')
on conflict (slug) do update set image_url = excluded.image_url;
