-- More practice tasks for strings: rows so attempts, XP and skill tracking have something to point at.
-- Wording, hints and tests are in src/content/gcse-strings.json; every task's reference solution was run
-- against its exact test cases in Pyodide 0.26.4. Idempotent.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp, practice_only) values
('gcse-strings-p-11', 'gcse', 'strings', 'How long is the word?', 'See lesson content.', 1, 10, true),
('gcse-strings-p-12', 'gcse', 'strings', 'Capital letters', 'See lesson content.', 1, 10, true),
('gcse-strings-p-13', 'gcse', 'strings', 'First three letters', 'See lesson content.', 2, 15, true),
('gcse-strings-p-14', 'gcse', 'strings', 'Which letter?', 'See lesson content.', 2, 15, true),
('gcse-strings-p-15', 'gcse', 'strings', 'Starts with a vowel?', 'See lesson content.', 2, 15, true),
('gcse-strings-p-16', 'gcse', 'strings', 'Count the words with a letter', 'See lesson content.', 3, 20, true),
('gcse-strings-p-17', 'gcse', 'strings', 'Initials', 'See lesson content.', 3, 20, true),
('gcse-strings-p-18', 'gcse', 'strings', 'Password strength', 'See lesson content.', 3, 20, true),
('gcse-strings-p-19', 'gcse', 'strings', 'Swap the case', 'See lesson content.', 4, 30, true),
('gcse-strings-p-20', 'gcse', 'strings', 'Longest word', 'See lesson content.', 4, 30, true),
('gcse-strings-p-s3', 'gcse', 'strings', '🌟 Anagram check', 'See lesson content.', 5, 40, true),
('gcse-strings-p-s4', 'gcse', 'strings', '🌟 Compress the spaces', 'See lesson content.', 5, 40, true)
on conflict (slug) do nothing;
