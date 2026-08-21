-- Separates the homework task pool from lessons/Practice/Recap entirely,
-- rather than relying only on incidental exclusion via lesson membership -
-- pickChallenge() (src/lib/progress.ts) now always filters homework_only =
-- false for its normal calls, and the "set homework" flow filters the
-- opposite. Existing 150 tasks default to false (untouched); new
-- homework-only content (src/content/*.json's "homeworkTasks" arrays) is
-- seeded with true in a follow-up migration.
alter table public.challenges add column homework_only boolean not null default false;
