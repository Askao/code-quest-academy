-- More practice tasks for files: rows so attempts, XP and skill tracking have something to point at.
-- Wording, hints and tests are in src/content/gcse-files.json; every task's reference solution was run
-- against its exact test cases in Pyodide 0.26.4. Idempotent.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp, practice_only) values
('gcse-files-p-11', 'gcse', 'files', 'Write a message', 'See lesson content.', 1, 10, true),
('gcse-files-p-12', 'gcse', 'files', 'Save a name', 'See lesson content.', 1, 10, true),
('gcse-files-p-13', 'gcse', 'files', 'Write three lines', 'See lesson content.', 2, 15, true),
('gcse-files-p-14', 'gcse', 'files', 'Add to a diary', 'See lesson content.', 2, 15, true),
('gcse-files-p-15', 'gcse', 'files', 'Number of scores', 'See lesson content.', 2, 15, true),
('gcse-files-p-16', 'gcse', 'files', 'Total of the file', 'See lesson content.', 3, 20, true),
('gcse-files-p-17', 'gcse', 'files', 'Numbered lines', 'See lesson content.', 3, 20, true),
('gcse-files-p-18', 'gcse', 'files', 'Is the name on the list?', 'See lesson content.', 3, 20, true),
('gcse-files-p-19', 'gcse', 'files', 'High scores table', 'See lesson content.', 4, 30, true),
('gcse-files-p-20', 'gcse', 'files', 'Copy without blanks', 'See lesson content.', 4, 30, true),
('gcse-files-p-s3', 'gcse', 'files', '🌟 Read a shopping file', 'See lesson content.', 5, 40, true),
('gcse-files-p-s4', 'gcse', 'files', '🌟 Update a counter file', 'See lesson content.', 5, 40, true)
on conflict (slug) do nothing;
