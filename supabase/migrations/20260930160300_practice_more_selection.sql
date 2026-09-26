-- More practice tasks for selection: rows so attempts, XP and skill tracking have something to point at.
-- Wording, hints and tests are in src/content/gcse-selection.json; every task's reference solution was run
-- against its exact test cases in Pyodide 0.26.4. Idempotent.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp, practice_only) values
('gcse-selection-p-11', 'gcse', 'selection', 'Old enough to drive?', 'See lesson content.', 1, 10, true),
('gcse-selection-p-12', 'gcse', 'selection', 'Same or different?', 'See lesson content.', 1, 10, true),
('gcse-selection-p-13', 'gcse', 'selection', 'The bigger number', 'See lesson content.', 2, 15, true),
('gcse-selection-p-14', 'gcse', 'selection', 'What to wear', 'See lesson content.', 2, 15, true),
('gcse-selection-p-15', 'gcse', 'selection', 'Exam result band', 'See lesson content.', 2, 15, true),
('gcse-selection-p-16', 'gcse', 'selection', 'Leap year', 'See lesson content.', 3, 20, true),
('gcse-selection-p-17', 'gcse', 'selection', 'Bus fare', 'See lesson content.', 3, 20, true),
('gcse-selection-p-18', 'gcse', 'selection', 'Login check', 'See lesson content.', 3, 20, true),
('gcse-selection-p-19', 'gcse', 'selection', 'Largest of three', 'See lesson content.', 3, 20, true),
('gcse-selection-p-20', 'gcse', 'selection', 'Parcel postage', 'See lesson content.', 4, 30, true),
('gcse-selection-p-s3', 'gcse', 'selection', '🌟 Is the shop open?', 'See lesson content.', 5, 40, true),
('gcse-selection-p-s4', 'gcse', 'selection', '🌟 Which quadrant?', 'See lesson content.', 5, 40, true)
on conflict (slug) do nothing;
