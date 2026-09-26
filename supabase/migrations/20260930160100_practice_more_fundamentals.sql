-- More practice tasks for fundamentals: rows so attempts, XP and skill tracking have something to point at.
-- Wording, hints and tests are in src/content/gcse-fundamentals.json; every task's reference solution was run
-- against its exact test cases in Pyodide 0.26.4. Idempotent.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp, practice_only) values
('gcse-fundamentals-p-11', 'gcse', 'fundamentals', 'Age next year', 'See lesson content.', 1, 10, true),
('gcse-fundamentals-p-12', 'gcse', 'fundamentals', 'Rectangle area', 'See lesson content.', 1, 10, true),
('gcse-fundamentals-p-13', 'gcse', 'fundamentals', 'Price with VAT', 'See lesson content.', 2, 15, true),
('gcse-fundamentals-p-14', 'gcse', 'fundamentals', 'Pounds to pence', 'See lesson content.', 2, 15, true),
('gcse-fundamentals-p-15', 'gcse', 'fundamentals', 'Total minutes', 'See lesson content.', 2, 15, true),
('gcse-fundamentals-p-16', 'gcse', 'fundamentals', 'Circle area', 'See lesson content.', 3, 20, true),
('gcse-fundamentals-p-17', 'gcse', 'fundamentals', 'Test percentage', 'See lesson content.', 3, 20, true),
('gcse-fundamentals-p-18', 'gcse', 'fundamentals', 'Joined or added?', 'See lesson content.', 3, 20, true),
('gcse-fundamentals-p-19', 'gcse', 'fundamentals', 'Total and mean of three', 'See lesson content.', 3, 20, true),
('gcse-fundamentals-p-20', 'gcse', 'fundamentals', 'Body mass index', 'See lesson content.', 4, 30, true),
('gcse-fundamentals-p-s3', 'gcse', 'fundamentals', '🌟 Growing savings', 'See lesson content.', 5, 40, true),
('gcse-fundamentals-p-s4', 'gcse', 'fundamentals', '🌟 Currency exchange with a fee', 'See lesson content.', 5, 40, true)
on conflict (slug) do nothing;
