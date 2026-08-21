-- Adds the challenge rows for two batches of new lesson content:
-- 1) A reinforcement lesson inserted right after each of three lessons
--    that students found difficult (Selection's "if, else and
--    comparisons", Iteration's "Count-controlled loops" and
--    "Condition-controlled loops") - same topic, new lesson slugs
--    (gcse-selection-4, gcse-iteration-4, gcse-iteration-5), giving more
--    practice before moving on. Existing lesson slugs and their task rows
--    are untouched, so no existing lesson_assignments break.
-- 2) A brand new topic, "combining-techniques" (3 lessons), sitting after
--    Iteration and before Lists in GCSE_TOPICS - deliberately left out of
--    Practice's random topic-picker (see practiceExcluded in game.ts),
--    since it doesn't teach a new skill, just combines the three before
--    it. Still fully reachable via /learn like any other topic.
-- Every task's solution was run against its exact test cases through the
-- real Pyodide runtime before this migration was written.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp) values
('gcse-selection-r1-01', 'gcse', 'selection', 'Even or odd', 'See lesson content.', 1, 10),
('gcse-selection-r1-02', 'gcse', 'selection', 'Enough money', 'See lesson content.', 1, 10),
('gcse-selection-r1-03', 'gcse', 'selection', 'Warmer, cooler or the same', 'See lesson content.', 2, 15),
('gcse-selection-r1-04', 'gcse', 'selection', 'Correct password', 'See lesson content.', 2, 15),
('gcse-selection-r1-stretch', 'gcse', 'selection', 'Closest to the target', 'See lesson content.', 5, 40),
('gcse-iteration-r1-01', 'gcse', 'iteration', 'Numbers 1 to N', 'See lesson content.', 1, 10),
('gcse-iteration-r1-02', 'gcse', 'iteration', 'Sum of multiples of 3', 'See lesson content.', 2, 15),
('gcse-iteration-r1-03', 'gcse', 'iteration', 'Times table, four rows', 'See lesson content.', 2, 15),
('gcse-iteration-r1-04', 'gcse', 'iteration', 'Count values above a limit', 'See lesson content.', 2, 20),
('gcse-iteration-r1-stretch', 'gcse', 'iteration', 'Sum of squares', 'See lesson content.', 5, 40),
('gcse-iteration-r2-01', 'gcse', 'iteration', 'Total until -1', 'See lesson content.', 1, 10),
('gcse-iteration-r2-02', 'gcse', 'iteration', 'Validated age', 'See lesson content.', 2, 15),
('gcse-iteration-r2-03', 'gcse', 'iteration', 'Guessing game', 'See lesson content.', 2, 20),
('gcse-iteration-r2-04', 'gcse', 'iteration', 'Keep asking for a positive number', 'See lesson content.', 3, 20),
('gcse-iteration-r2-stretch', 'gcse', 'iteration', 'Total until negative', 'See lesson content.', 5, 40),
('gcse-combining-techniques-t1-01', 'gcse', 'combining-techniques', 'Classify each number', 'See lesson content.', 1, 10),
('gcse-combining-techniques-t1-02', 'gcse', 'combining-techniques', 'Pass or fail each student', 'See lesson content.', 1, 10),
('gcse-combining-techniques-t1-03', 'gcse', 'combining-techniques', 'Count how many pass', 'See lesson content.', 2, 20),
('gcse-combining-techniques-t1-04', 'gcse', 'combining-techniques', 'Warn about low stock', 'See lesson content.', 2, 20),
('gcse-combining-techniques-t1-stretch', 'gcse', 'combining-techniques', 'Grade each score', 'See lesson content.', 5, 40),
('gcse-combining-techniques-t2-01', 'gcse', 'combining-techniques', 'Total and count above 50', 'See lesson content.', 2, 20),
('gcse-combining-techniques-t2-02', 'gcse', 'combining-techniques', 'Bonus points', 'See lesson content.', 3, 25),
('gcse-combining-techniques-t2-03', 'gcse', 'combining-techniques', 'Passes and fails separately', 'See lesson content.', 2, 20),
('gcse-combining-techniques-t2-04', 'gcse', 'combining-techniques', 'Highest of the positives', 'See lesson content.', 3, 25),
('gcse-combining-techniques-t2-stretch', 'gcse', 'combining-techniques', 'Three trackers', 'See lesson content.', 5, 40),
('gcse-combining-techniques-t3-01', 'gcse', 'combining-techniques', 'Validated attendance register', 'See lesson content.', 3, 25),
('gcse-combining-techniques-t3-02', 'gcse', 'combining-techniques', 'Multi-part average with grade', 'See lesson content.', 3, 30),
('gcse-combining-techniques-t3-03', 'gcse', 'combining-techniques', 'Longest streak of passes', 'See lesson content.', 4, 30),
('gcse-combining-techniques-t3-stretch', 'gcse', 'combining-techniques', 'Delivery cost with validation', 'See lesson content.', 5, 40)
on conflict (slug) do nothing;
