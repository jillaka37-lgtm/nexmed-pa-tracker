-- Adds carousel/social structure to content_pieces (already the table used
-- by the LinkedIn pipeline) rather than a separate social_posts table —
-- content_pieces already has the right shape (platform enum includes
-- 'carousel'/'reels', brief_id, status, score). slides/hashtags/extras are
-- jsonb so format-specific fields don't produce always-empty columns for
-- the platforms that don't use them.

alter table public.content_pieces add column if not exists slides jsonb not null default '[]';
alter table public.content_pieces add column if not exists hashtags jsonb not null default '[]';
alter table public.content_pieces add column if not exists extras jsonb not null default '{}';

-- Locks the data-shape contract in the database, not just in TypeScript:
-- a carousel must have 5-8 slides; linkedin/reels must have none (their
-- content lives in `body`/`extras`, not `slides`).
alter table public.content_pieces add constraint content_pieces_slides_shape check (
  (platform = 'carousel' and jsonb_array_length(slides) between 5 and 8)
  or (platform in ('linkedin', 'reels') and jsonb_array_length(slides) = 0)
);
