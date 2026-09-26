-- More practice tasks for lists: rows so attempts, XP and skill tracking have something to point at.
-- Wording, hints and tests are in src/content/gcse-lists.json; every task's reference solution was run
-- against its exact test cases in Pyodide 0.26.4. Idempotent.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp, practice_only) values
('gcse-lists-p-11', 'gcse', 'lists', 'Build and print a list', 'See lesson content.', 1, 10, true),
('gcse-lists-p-12', 'gcse', 'lists', 'How many items?', 'See lesson content.', 1, 10, true),
('gcse-lists-p-13', 'gcse', 'lists', 'Biggest in the list', 'See lesson content.', 2, 15, true),
('gcse-lists-p-14', 'gcse', 'lists', 'Last one first', 'See lesson content.', 2, 15, true),
('gcse-lists-p-15', 'gcse', 'lists', 'Is it in the list?', 'See lesson content.', 2, 15, true),
('gcse-lists-p-16', 'gcse', 'lists', 'Above average', 'See lesson content.', 3, 20, true),
('gcse-lists-p-17', 'gcse', 'lists', 'Where is it?', 'See lesson content.', 3, 20, true),
('gcse-lists-p-18', 'gcse', 'lists', 'Change every score', 'See lesson content.', 3, 20, true),
('gcse-lists-p-19', 'gcse', 'lists', 'Numbers in order?', 'See lesson content.', 4, 30, true),
('gcse-lists-p-20', 'gcse', 'lists', 'Best and worst', 'See lesson content.', 4, 30, true),
('gcse-lists-p-s3', 'gcse', 'lists', '🌟 Two lists, one total', 'See lesson content.', 5, 40, true),
('gcse-lists-p-s4', 'gcse', 'lists', '🌟 Second smallest', 'See lesson content.', 5, 40, true)
on conflict (slug) do nothing;
