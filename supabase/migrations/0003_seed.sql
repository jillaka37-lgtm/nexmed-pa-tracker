-- NexMed — seed data.

-- >>> IMPORTANT: replace this with YOUR login email so your account becomes
-- >>> admin automatically the first time you sign in.
insert into public.admin_emails (email) values
  ('you@example.com')
on conflict (email) do nothing;

-- Initial consultation service (price editable later in the admin dashboard).
insert into public.services (slug, title, description, duration_min, price_cents, currency, active, sort_order)
values (
  'initial-consultation',
  'Initial AI-Assisted Consultation',
  'A focused 30-minute 1:1 session combining AI-prepared health insights with personal, expert guidance. We review your goals, answer your questions, and leave you with a clear, actionable plan.',
  30,
  9900,
  'usd',
  true,
  1
)
on conflict (slug) do nothing;

-- Default weekly availability: Monday–Friday, 09:00–17:00, 30-minute slots.
insert into public.availability_rules (weekday, start_time, end_time, slot_minutes, active)
values
  (1, '09:00', '17:00', 30, true),
  (2, '09:00', '17:00', 30, true),
  (3, '09:00', '17:00', 30, true),
  (4, '09:00', '17:00', 30, true),
  (5, '09:00', '17:00', 30, true);

-- Sample testimonials (approved so they display).
insert into public.testimonials (name, role, content, rating, approved, sort_order)
values
  ('Sarah M.', 'Caregiver', 'The consultation felt genuinely personal. I left with a clear plan and finally understood my options — no jargon, just real guidance.', 5, true, 1),
  ('David L.', 'Health-conscious professional', 'Booking and paying took two minutes, and the session was worth every penny. The AI-prepared summary afterward was a brilliant touch.', 5, true, 2),
  ('Priya R.', 'Patient', 'Warm, knowledgeable and never rushed. This is what healthcare guidance should feel like.', 5, true, 3);
