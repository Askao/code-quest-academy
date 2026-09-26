-- More practice tasks for iteration: rows so attempts, XP and skill tracking have something to point at.
-- Wording, hints and tests are in src/content/gcse-iteration.json; every task's reference solution was run
-- against its exact test cases in Pyodide 0.26.4. Idempotent.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp, practice_only) values
('gcse-iteration-p-11', 'gcse', 'iteration', 'Count up', 'See lesson content.', 1, 10, true),
('gcse-iteration-p-12', 'gcse', 'iteration', 'A row of stars', 'See lesson content.', 1, 10, true),
('gcse-iteration-p-13', 'gcse', 'iteration', 'Total of the numbers', 'See lesson content.', 2, 15, true),
('gcse-iteration-p-14', 'gcse', 'iteration', 'Countdown in fives', 'See lesson content.', 2, 15, true),
('gcse-iteration-p-15', 'gcse', 'iteration', 'Guess the word', 'See lesson content.', 2, 15, true),
('gcse-iteration-p-16', 'gcse', 'iteration', 'Average until zero', 'See lesson content.', 3, 20, true),
('gcse-iteration-p-17', 'gcse', 'iteration', 'Squares list', 'See lesson content.', 3, 20, true),
('gcse-iteration-p-18', 'gcse', 'iteration', 'Sum of the digits', 'See lesson content.', 3, 20, true),
('gcse-iteration-p-19', 'gcse', 'iteration', 'Powers of two', 'See lesson content.', 4, 30, true),
('gcse-iteration-p-20', 'gcse', 'iteration', 'Running total', 'See lesson content.', 4, 30, true),
('gcse-iteration-p-s3', 'gcse', 'iteration', '🌟 Steps to reach 1', 'See lesson content.', 5, 40, true),
('gcse-iteration-p-s4', 'gcse', 'iteration', '🌟 Reverse the digits', 'See lesson content.', 5, 40, true)
on conflict (slug) do nothing;
