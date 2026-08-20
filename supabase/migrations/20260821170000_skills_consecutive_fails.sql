-- Tracks a per-topic fail streak so recordAttempt() (src/lib/progress.ts)
-- can react to repeated failure with a bigger difficulty drop than a single
-- fail warrants, rather than only ever nudging skill level down by a flat
-- amount regardless of how many times in a row a student has struggled.
alter table public.skills add column consecutive_fails integer not null default 0;
