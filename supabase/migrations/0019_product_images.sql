-- The shop products seeded in 0015_core_site_schema.sql never had
-- image_url set (neither did the original 0005/0007 migrations they were
-- copied from), so every product card fell back to a generic category
-- icon. Backfilling real photos here.

update public.products set image_url = 'https://images.pexels.com/photos/11361813/pexels-photo-11361813.jpeg?auto=compress&cs=tinysrgb&w=600' where slug = 'pain-relief-500';
update public.products set image_url = 'https://images.pexels.com/photos/6865182/pexels-photo-6865182.jpeg?auto=compress&cs=tinysrgb&w=600' where slug = 'allergy-relief';
update public.products set image_url = 'https://images.pexels.com/photos/17820718/pexels-photo-17820718.jpeg?auto=compress&cs=tinysrgb&w=600' where slug = 'vitamin-d3';
update public.products set image_url = 'https://images.pexels.com/photos/3873140/pexels-photo-3873140.jpeg?auto=compress&cs=tinysrgb&w=600' where slug = 'cold-flu-relief';
update public.products set image_url = 'https://images.pexels.com/photos/5995227/pexels-photo-5995227.jpeg?auto=compress&cs=tinysrgb&w=600' where slug = 'digital-thermometer';
update public.products set image_url = 'https://images.pexels.com/photos/5322196/pexels-photo-5322196.jpeg?auto=compress&cs=tinysrgb&w=600' where slug = 'hand-sanitizer';
update public.products set image_url = 'https://images.pexels.com/photos/7615570/pexels-photo-7615570.jpeg?auto=compress&cs=tinysrgb&w=600' where slug = 'omega-3-fish-oil';
update public.products set image_url = 'https://images.pexels.com/photos/3923160/pexels-photo-3923160.jpeg?auto=compress&cs=tinysrgb&w=600' where slug = 'vitamin-c-1000';
update public.products set image_url = 'https://images.pexels.com/photos/7615558/pexels-photo-7615558.jpeg?auto=compress&cs=tinysrgb&w=600' where slug = 'multivitamin-daily';
update public.products set image_url = 'https://images.pexels.com/photos/8670204/pexels-photo-8670204.jpeg?auto=compress&cs=tinysrgb&w=600' where slug = 'blood-pressure-monitor';
update public.products set image_url = 'https://images.pexels.com/photos/8352131/pexels-photo-8352131.jpeg?auto=compress&cs=tinysrgb&w=600' where slug = 'pulse-oximeter';
update public.products set image_url = 'https://images.pexels.com/photos/31852746/pexels-photo-31852746.jpeg?auto=compress&cs=tinysrgb&w=600' where slug = 'first-aid-kit';
update public.products set image_url = 'https://images.pexels.com/photos/13697764/pexels-photo-13697764.jpeg?auto=compress&cs=tinysrgb&w=600' where slug = 'sunscreen-spf50';
update public.products set image_url = 'https://images.pexels.com/photos/5207322/pexels-photo-5207322.jpeg?auto=compress&cs=tinysrgb&w=600' where slug = 'antacid-tablets';
update public.products set image_url = 'https://images.pexels.com/photos/3850700/pexels-photo-3850700.jpeg?auto=compress&cs=tinysrgb&w=600' where slug = 'probiotic-capsules';
update public.products set image_url = 'https://images.pexels.com/photos/30801239/pexels-photo-30801239.jpeg?auto=compress&cs=tinysrgb&w=600' where slug = 'sleep-aid';
