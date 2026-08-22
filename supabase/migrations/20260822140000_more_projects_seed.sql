-- Extends Projects to the 7 remaining eligible topics (per
-- 20260821220000_iteration_projects_seed.sql's own note: "the same pattern
-- seeds the remaining 8 GCSE topics" - files is excluded here, and
-- getting-started/databases are left out too: getting-started has too
-- little material yet to pull together, and databases runs on sql.js, not
-- this Python-only project format).
--
-- Each topic gets one project split into three separately-gradeable parts
-- (group/part - see tasksInGroup in content.ts and the auto-advance-to-
-- next-part logic in play.$slug.tsx), same shape as the existing
-- gcse-fundamentals-t4-big1a/b Cinema Booking pair: a "big program" built
-- and marked bit by bit, not all in one submission. group/part live only
-- in src/content/*.json - the database doesn't need to know about them,
-- only that each part is its own is_project = true challenge row.
--
-- Every scenario here is original, not drawn from any well-known puzzle.
-- Every part's test cases were run against the real Pyodide runtime before
-- this migration was written.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp, is_project) values
('gcse-sequencing-proj1a', 'gcse', 'sequencing', 'Bakery order receipt — Part A', 'See lesson content.', 2, 30, true),
('gcse-sequencing-proj1b', 'gcse', 'sequencing', 'Bakery order receipt — Part B', 'See lesson content.', 3, 35, true),
('gcse-sequencing-proj1c', 'gcse', 'sequencing', 'Bakery order receipt — Part C', 'See lesson content.', 4, 40, true),
('gcse-fundamentals-proj1a', 'gcse', 'fundamentals', 'Currency exchange kiosk — Part A', 'See lesson content.', 2, 30, true),
('gcse-fundamentals-proj1b', 'gcse', 'fundamentals', 'Currency exchange kiosk — Part B', 'See lesson content.', 3, 35, true),
('gcse-fundamentals-proj1c', 'gcse', 'fundamentals', 'Currency exchange kiosk — Part C', 'See lesson content.', 4, 40, true),
('gcse-selection-proj1a', 'gcse', 'selection', 'Parcel delivery estimator — Part A', 'See lesson content.', 2, 30, true),
('gcse-selection-proj1b', 'gcse', 'selection', 'Parcel delivery estimator — Part B', 'See lesson content.', 3, 35, true),
('gcse-selection-proj1c', 'gcse', 'selection', 'Parcel delivery estimator — Part C', 'See lesson content.', 4, 40, true),
('gcse-combining-techniques-proj1a', 'gcse', 'combining-techniques', 'Class attendance tracker — Part A', 'See lesson content.', 3, 30, true),
('gcse-combining-techniques-proj1b', 'gcse', 'combining-techniques', 'Class attendance tracker — Part B', 'See lesson content.', 4, 40, true),
('gcse-combining-techniques-proj1c', 'gcse', 'combining-techniques', 'Class attendance tracker — Part C', 'See lesson content.', 5, 50, true),
('gcse-lists-proj1a', 'gcse', 'lists', 'Exam marks analyser — Part A', 'See lesson content.', 3, 30, true),
('gcse-lists-proj1b', 'gcse', 'lists', 'Exam marks analyser — Part B', 'See lesson content.', 4, 40, true),
('gcse-lists-proj1c', 'gcse', 'lists', 'Exam marks analyser — Part C', 'See lesson content.', 5, 50, true),
('gcse-strings-proj1a', 'gcse', 'strings', 'Password strength checker — Part A', 'See lesson content.', 3, 30, true),
('gcse-strings-proj1b', 'gcse', 'strings', 'Password strength checker — Part B', 'See lesson content.', 4, 40, true),
('gcse-strings-proj1c', 'gcse', 'strings', 'Password strength checker — Part C', 'See lesson content.', 5, 50, true),
('gcse-functions-proj1a', 'gcse', 'functions', 'Shape area calculator — Part A', 'See lesson content.', 3, 30, true),
('gcse-functions-proj1b', 'gcse', 'functions', 'Shape area calculator — Part B', 'See lesson content.', 4, 40, true),
('gcse-functions-proj1c', 'gcse', 'functions', 'Shape area calculator — Part C', 'See lesson content.', 5, 50, true)
on conflict (slug) do nothing;
