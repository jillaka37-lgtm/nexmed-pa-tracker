update public.products set image_url = 'https://kxdhmzzswssqxfexfpot.supabase.co/storage/v1/object/public/product-images/flonase-nasal-spray.jpg' where slug = 'flonase-nasal-spray';

update public.products set image_url = 'https://kxdhmzzswssqxfexfpot.supabase.co/storage/v1/object/public/product-images/pain-relief-500.jpg' where slug = 'pain-relief-500';

insert into public.products (slug, name, description, category, price_cents, currency, requires_rx, stock, active, sort_order, image_url)
values ('otc-eye-drops', 'OTC Lubricating Eye Drops (15ml)', 'Fast relief for dry, itchy, or irritated eyes. Preservative-free formula.', 'Allergy', 999, 'usd', false, 100, true, 20, 'https://kxdhmzzswssqxfexfpot.supabase.co/storage/v1/object/public/product-images/otc-eye-drops.jpg')
on conflict (slug) do update set image_url = excluded.image_url;
