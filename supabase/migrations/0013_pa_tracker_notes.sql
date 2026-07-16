-- Notes are pa_case_events rows with action = 'note_added' — no new table.
-- This index makes filtering the timeline down to "notes only" cheap.
create index pa_case_events_notes_idx on public.pa_case_events(case_id, created_at)
  where action = 'note_added';
