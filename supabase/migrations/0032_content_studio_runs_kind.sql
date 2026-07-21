-- content_studio_runs.kind was constrained to ('linkedin', 'carousel') back
-- when only those two pipelines existed. The reels pipeline now needs
-- 'reels' too.
alter table public.content_studio_runs drop constraint content_studio_runs_kind_check;
alter table public.content_studio_runs add constraint content_studio_runs_kind_check
  check (kind in ('linkedin', 'carousel', 'reels'));
