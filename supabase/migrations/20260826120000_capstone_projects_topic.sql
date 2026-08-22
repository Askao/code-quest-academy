-- New GCSE topic: "Capstone Projects" - no lessons of its own, just 6
-- multi-part projects (3 parts each) that combine multiple techniques
-- (lists, functions, strings, files, selection) into genuinely harder,
-- longer builds than anything else on the platform. Reached from the
-- Projects section on /practice once the Functions/Subprograms project
-- (gcse-functions-bigproj1) is fully complete - a real prerequisite-skill
-- checkpoint rather than a lesson, see the special-cased unlock check in
-- practice.tsx.
--
-- Display content (title, brief, starter, hints, tests, difficulty, xp) is
-- authored in src/content/gcse-capstone.json and merged in at render time
-- by withContent() - same pattern as every other project. These rows only
-- need to exist so attempts/XP/skill tracking has something to point at.
-- Test cases were verified against the real Pyodide engine before this
-- migration was written.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp, is_project) values
('gcse-capstone-lib-a', 'gcse', 'capstone', 'Library catalogue system — Part A: the catalogue', 'See lesson content.', 3, 50, true),
('gcse-capstone-lib-b', 'gcse', 'capstone', 'Library catalogue system — Part B: searching', 'See lesson content.', 4, 65, true),
('gcse-capstone-lib-c', 'gcse', 'capstone', 'Library catalogue system — Part C: copies available', 'See lesson content.', 5, 80, true),

('gcse-capstone-pwd-a', 'gcse', 'capstone', 'Password manager — Part A: strength check', 'See lesson content.', 3, 50, true),
('gcse-capstone-pwd-b', 'gcse', 'capstone', 'Password manager — Part B: a summary count', 'See lesson content.', 4, 65, true),
('gcse-capstone-pwd-c', 'gcse', 'capstone', 'Password manager — Part C: look up a site', 'See lesson content.', 5, 80, true),

('gcse-capstone-quiz-a', 'gcse', 'capstone', 'Quiz score tracker — Part A: the average', 'See lesson content.', 3, 50, true),
('gcse-capstone-quiz-b', 'gcse', 'capstone', 'Quiz score tracker — Part B: saving to a file', 'See lesson content.', 4, 65, true),
('gcse-capstone-quiz-c', 'gcse', 'capstone', 'Quiz score tracker — Part C: pass or fail', 'See lesson content.', 5, 80, true),

('gcse-capstone-inv-a', 'gcse', 'capstone', 'Adventure inventory — Part A: starting items', 'See lesson content.', 3, 50, true),
('gcse-capstone-inv-b', 'gcse', 'capstone', 'Adventure inventory — Part B: using an item', 'See lesson content.', 4, 65, true),
('gcse-capstone-inv-c', 'gcse', 'capstone', 'Adventure inventory — Part C: carry weight', 'See lesson content.', 5, 80, true),

('gcse-capstone-seat-a', 'gcse', 'capstone', 'Class seating planner — Part A: an empty grid', 'See lesson content.', 3, 50, true),
('gcse-capstone-seat-b', 'gcse', 'capstone', 'Class seating planner — Part B: assigning a seat', 'See lesson content.', 4, 65, true),
('gcse-capstone-seat-c', 'gcse', 'capstone', 'Class seating planner — Part C: checking a seat', 'See lesson content.', 5, 80, true),

('gcse-capstone-budget-a', 'gcse', 'capstone', 'Budget tracker — Part A: total by category', 'See lesson content.', 3, 50, true),
('gcse-capstone-budget-b', 'gcse', 'capstone', 'Budget tracker — Part B: a summary file', 'See lesson content.', 4, 65, true),
('gcse-capstone-budget-c', 'gcse', 'capstone', 'Budget tracker — Part C: biggest spend', 'See lesson content.', 5, 80, true)
on conflict (slug) do nothing;
