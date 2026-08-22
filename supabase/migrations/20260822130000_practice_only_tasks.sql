-- Separates Practice's task pool from lessons entirely, same shape as the
-- existing homework_only split (20260821190000): pickChallenge()
-- (src/lib/progress.ts) now supports a practiceOnly flag that restricts to
-- challenges.practice_only = true, falling back to the ordinary pool for
-- any topic that has no dedicated practice tasks authored yet - so this
-- rolls out topic by topic without ever leaving Practice empty for the
-- others in the meantime.
--
-- Display content (title, brief, starter, hints, tests, difficulty, xp) is
-- authored in src/content/*.json's new "practiceTasks" arrays and merged
-- in at render time by withContent() - same pattern as every other task
-- type. These rows only need to exist so attempts/XP/skill tracking has
-- something to point at. Test cases were verified against the real
-- Pyodide engine before this migration was written.
alter table public.challenges add column practice_only boolean not null default false;

insert into public.challenges (slug, track, topic, title, brief, difficulty, xp, practice_only) values
('gcse-sequencing-p-01', 'gcse', 'sequencing', 'Add three numbers', 'See lesson content.', 1, 10, true),
('gcse-sequencing-p-02', 'gcse', 'sequencing', 'Subtract the tax', 'See lesson content.', 1, 10, true),
('gcse-sequencing-p-03', 'gcse', 'sequencing', 'Texts and cost', 'See lesson content.', 2, 15, true),
('gcse-sequencing-p-04', 'gcse', 'sequencing', 'Average of four scores', 'See lesson content.', 2, 15, true),
('gcse-sequencing-p-05', 'gcse', 'sequencing', 'Fuel cost for a trip', 'See lesson content.', 3, 25, true),
('gcse-sequencing-p-06', 'gcse', 'sequencing', 'Splitting babysitting money', 'See lesson content.', 3, 25, true),
('gcse-sequencing-p-07', 'gcse', 'sequencing', 'Bake sale', 'See lesson content.', 4, 30, true),
('gcse-sequencing-p-08', 'gcse', 'sequencing', 'Road trip time', 'See lesson content.', 5, 40, true);
