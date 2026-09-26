-- More practice tasks for combining-techniques: rows so attempts, XP and skill tracking have something to point at.
-- Wording, hints and tests are in src/content/gcse-combining-techniques.json; every task's reference solution was run
-- against its exact test cases in Pyodide 0.26.4. Idempotent.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp, practice_only) values
('gcse-combining-techniques-p-06', 'gcse', 'combining-techniques', 'Count the passes', 'See lesson content.', 2, 15, true),
('gcse-combining-techniques-p-07', 'gcse', 'combining-techniques', 'Fizz and buzz', 'See lesson content.', 2, 15, true),
('gcse-combining-techniques-p-08', 'gcse', 'combining-techniques', 'Pass, merit or fail count', 'See lesson content.', 3, 20, true),
('gcse-combining-techniques-p-09', 'gcse', 'combining-techniques', 'Stop on the word stop', 'See lesson content.', 3, 20, true),
('gcse-combining-techniques-p-10', 'gcse', 'combining-techniques', 'Times table check', 'See lesson content.', 3, 20, true),
('gcse-combining-techniques-p-11', 'gcse', 'combining-techniques', 'Vowels and consonants', 'See lesson content.', 3, 20, true),
('gcse-combining-techniques-p-12', 'gcse', 'combining-techniques', 'Bank balance', 'See lesson content.', 4, 30, true),
('gcse-combining-techniques-p-13', 'gcse', 'combining-techniques', 'Positive, negative and zero', 'See lesson content.', 4, 30, true),
('gcse-combining-techniques-p-s1', 'gcse', 'combining-techniques', '🌟 Guessing game', 'See lesson content.', 5, 40, true),
('gcse-combining-techniques-p-s2', 'gcse', 'combining-techniques', '🌟 Word statistics', 'See lesson content.', 5, 40, true)
on conflict (slug) do nothing;
