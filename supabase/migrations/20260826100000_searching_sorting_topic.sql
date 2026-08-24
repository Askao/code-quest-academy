-- New GCSE topic: "searching-sorting" (Searching & Sorting) - linear search,
-- binary search, bubble sort, insertion sort, merge sort, weighted heavily
-- toward linear search per the teacher's brief ("mostly linear search
-- though. Keep it basic with a lot of theory"). Lesson notes, worked
-- examples and 15 quiz questions are authored in
-- src/content/gcse-searching-sorting.json; this migration only needs to
-- seed the identity/metadata rows for the topic's 17 lesson tasks so
-- attempts/xp/skill tracking has something to point at.
--
-- Sits after "files" and before "databases" in GCSE_TOPICS (see game.ts).
-- Every task's reference solution was run against its exact test cases
-- through the real Pyodide runtime before this migration was written.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp) values
('gcse-searching-sorting-t1-01', 'gcse', 'searching-sorting', 'Is it in the list?', 'See lesson content.', 1, 10),
('gcse-searching-sorting-t1-02', 'gcse', 'searching-sorting', 'Find the position', 'See lesson content.', 2, 15),
('gcse-searching-sorting-t1-03', 'gcse', 'searching-sorting', 'Count the comparisons', 'See lesson content.', 2, 20),
('gcse-searching-sorting-t1-04', 'gcse', 'searching-sorting', 'First match only', 'See lesson content.', 3, 25),

('gcse-searching-sorting-t2-01', 'gcse', 'searching-sorting', 'Trace the checks', 'See lesson content.', 2, 20),
('gcse-searching-sorting-t2-02', 'gcse', 'searching-sorting', 'Best or worst case?', 'See lesson content.', 3, 25),
('gcse-searching-sorting-t2-03', 'gcse', 'searching-sorting', 'Count all occurrences', 'See lesson content.', 3, 30),
('gcse-searching-sorting-t2-04', 'gcse', 'searching-sorting', 'Case-insensitive name search', 'See lesson content.', 4, 35),

('gcse-searching-sorting-t3-01', 'gcse', 'searching-sorting', 'Binary search - found or not', 'See lesson content.', 2, 15),
('gcse-searching-sorting-t3-02', 'gcse', 'searching-sorting', 'Binary search - find the position', 'See lesson content.', 3, 20),
('gcse-searching-sorting-t3-03', 'gcse', 'searching-sorting', 'Count the halvings', 'See lesson content.', 3, 25),

('gcse-searching-sorting-t4-01', 'gcse', 'searching-sorting', 'Bubble sort', 'See lesson content.', 2, 15),
('gcse-searching-sorting-t4-02', 'gcse', 'searching-sorting', 'Count the swaps', 'See lesson content.', 3, 20),
('gcse-searching-sorting-t4-03', 'gcse', 'searching-sorting', 'Insertion sort', 'See lesson content.', 2, 15),
('gcse-searching-sorting-t4-04', 'gcse', 'searching-sorting', 'Trace an insertion sort', 'See lesson content.', 3, 25),

('gcse-searching-sorting-t5-01', 'gcse', 'searching-sorting', 'Merge two sorted lists', 'See lesson content.', 2, 15),
('gcse-searching-sorting-t5-02', 'gcse', 'searching-sorting', 'Splitting in half', 'See lesson content.', 2, 20)
on conflict (slug) do nothing;
