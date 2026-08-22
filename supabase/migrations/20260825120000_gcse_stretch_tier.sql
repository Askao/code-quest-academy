-- The GCSE "stretch tier": 2 harder, longer practice tasks per topic (3
-- for sequencing, which already had one pre-existing stretch row) for a
-- student who's cleared the core practice pool early - part of the
-- "Three-Year Runway" plan (item 4). difficulty stays capped at 5 (the
-- challenges table's CHECK constraint doesn't allow higher), so these are
-- distinguished by title (a leading star emoji) and the stretch flag in
-- content, not a higher number - genuinely more involved tasks, not just
-- relabelled difficulty-5 ones.
--
-- Excluded from every "is this topic's practice done" calculation (the
-- COMPLETED badge, the reset gate, roster/dashboard completion counts -
-- see corePracticeTasksForTopic in content.ts) so this extension content
-- never blocks a status that's meant to mean "finished the core pool".
--
-- Display content (title, brief, starter, hints, tests, difficulty, xp) is
-- authored in src/content/*.json's "practiceTasks" arrays and merged in at
-- render time by withContent(). These rows only need to exist so
-- attempts/XP/skill tracking has something to point at. Test cases were
-- verified against the real Pyodide engine before this migration was
-- written.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp, practice_only) values
('gcse-getting-started-p-s1', 'gcse', 'getting-started', '🌟 Full shipping label', 'See lesson content.', 5, 35, true),
('gcse-getting-started-p-s2', 'gcse', 'getting-started', '🌟 Event invitation', 'See lesson content.', 5, 35, true),

('gcse-fundamentals-p-s1', 'gcse', 'fundamentals', '🌟 Restaurant bill split', 'See lesson content.', 5, 35, true),
('gcse-fundamentals-p-s2', 'gcse', 'fundamentals', '🌟 Unit price comparison', 'See lesson content.', 5, 35, true),

('gcse-sequencing-p-s1', 'gcse', 'sequencing', '🌟 Change given', 'See lesson content.', 5, 40, true),
('gcse-sequencing-p-s2', 'gcse', 'sequencing', '🌟 Movie night cost, split evenly', 'See lesson content.', 5, 40, true),

('gcse-selection-p-s1', 'gcse', 'selection', '🌟 Insurance premium calculator', 'See lesson content.', 5, 40, true),
('gcse-selection-p-s2', 'gcse', 'selection', '🌟 Banded tax calculator', 'See lesson content.', 5, 40, true),

('gcse-iteration-p-s1', 'gcse', 'iteration', '🌟 Prime checker', 'See lesson content.', 5, 40, true),
('gcse-iteration-p-s2', 'gcse', 'iteration', '🌟 Shrinking triangle', 'See lesson content.', 5, 40, true),

('gcse-lists-p-s1', 'gcse', 'lists', '🌟 Merge two lists', 'See lesson content.', 5, 40, true),
('gcse-lists-p-s2', 'gcse', 'lists', '🌟 Rotate a list', 'See lesson content.', 5, 40, true),

('gcse-strings-p-s1', 'gcse', 'strings', '🌟 Run-length encoding', 'See lesson content.', 5, 40, true),
('gcse-strings-p-s2', 'gcse', 'strings', '🌟 Palindrome sentence', 'See lesson content.', 5, 40, true),

('gcse-functions-p-s1', 'gcse', 'functions', '🌟 Factorial with validation', 'See lesson content.', 5, 40, true),
('gcse-functions-p-s2', 'gcse', 'functions', '🌟 Temperature converter suite', 'See lesson content.', 5, 40, true),

('gcse-files-p-s1', 'gcse', 'files', '🌟 Word frequency in a file', 'See lesson content.', 5, 40, true),
('gcse-files-p-s2', 'gcse', 'files', '🌟 Score report with average', 'See lesson content.', 5, 40, true)
on conflict (slug) do nothing;
