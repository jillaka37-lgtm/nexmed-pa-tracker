delete from public.products where slug = 'diabetic-test-strips-monitor';

insert into public.products (slug, name, description, category, price_cents, currency, requires_rx, stock, active, sort_order, image_url)
values
  ('diabetic-test-strips', 'Blood Glucose Test Strips (25 strips)', 'Compatible test strips for accurate at-home blood glucose readings.', 'Devices', 1499, 'usd', false, 100, true, 17, 'https://kxdhmzzswssqxfexfpot.supabase.co/storage/v1/object/public/product-images/diabetic-test-strips.jpg'),
  ('blood-glucose-monitor', 'Blood Glucose Monitor Kit', 'Glucometer with lancing device, carrying case, and log book.', 'Devices', 2499, 'usd', false, 50, true, 18, 'https://kxdhmzzswssqxfexfpot.supabase.co/storage/v1/object/public/product-images/blood-glucose-monitor.jpg')
on conflict (slug) do update set image_url = excluded.image_url;

update public.products set sort_order = 19 where slug = 'pregnancy-test';
