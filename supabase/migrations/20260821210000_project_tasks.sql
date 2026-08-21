-- Projects: longer, topic-spanning assessment tasks (3-4 per topic,
-- escalating difficulty), modelled on GoCodeIt's "Assessment Point" pages -
-- a bigger, harder program that pulls together everything learned in a
-- topic, browsed as a fixed list rather than randomly picked. Kept
-- architecturally separate the same way homework_only is: pickChallenge()
-- (src/lib/progress.ts) always filters is_project = false for its normal
-- Practice/Boss/Duel/Recap calls, so a project never turns up as a random
-- pick - students reach them only via the dedicated /projects page.
alter table public.challenges add column is_project boolean not null default false;
