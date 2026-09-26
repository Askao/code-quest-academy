-- More practice tasks for sequencing: rows so attempts, XP and skill tracking have something to point at.
-- Wording, hints and tests are in src/content/gcse-sequencing.json; every task's reference solution was run
-- against its exact test cases in Pyodide 0.26.4. Idempotent.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp, practice_only) values
('gcse-sequencing-p-11', 'gcse', 'sequencing', 'Cube it', 'See lesson content.', 1, 10, true),
('gcse-sequencing-p-12', 'gcse', 'sequencing', 'The remainder', 'See lesson content.', 1, 10, true),
('gcse-sequencing-p-13', 'gcse', 'sequencing', 'Whole-number division', 'See lesson content.', 2, 15, true),
('gcse-sequencing-p-14', 'gcse', 'sequencing', 'Perimeter of a rectangle', 'See lesson content.', 2, 15, true),
('gcse-sequencing-p-15', 'gcse', 'sequencing', 'Bill with a fixed tip', 'See lesson content.', 2, 15, true),
('gcse-sequencing-p-16', 'gcse', 'sequencing', 'Days into weeks', 'See lesson content.', 3, 20, true),
('gcse-sequencing-p-17', 'gcse', 'sequencing', 'Average speed', 'See lesson content.', 3, 20, true),
('gcse-sequencing-p-18', 'gcse', 'sequencing', 'Tens and units', 'See lesson content.', 3, 20, true),
('gcse-sequencing-p-19', 'gcse', 'sequencing', 'Discount, then VAT', 'See lesson content.', 3, 20, true),
('gcse-sequencing-p-20', 'gcse', 'sequencing', 'Sum of three squares', 'See lesson content.', 4, 30, true),
('gcse-sequencing-p-s3', 'gcse', 'sequencing', '🌟 Sharing sweets', 'See lesson content.', 5, 40, true),
('gcse-sequencing-p-s4', 'gcse', 'sequencing', '🌟 Diagonal of a rectangle', 'See lesson content.', 5, 40, true)
on conflict (slug) do nothing;
