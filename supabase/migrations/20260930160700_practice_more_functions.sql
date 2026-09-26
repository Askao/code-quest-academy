-- More practice tasks for functions: rows so attempts, XP and skill tracking have something to point at.
-- Wording, hints and tests are in src/content/gcse-functions.json; every task's reference solution was run
-- against its exact test cases in Pyodide 0.26.4. Idempotent.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp, practice_only) values
('gcse-functions-p-11', 'gcse', 'functions', 'Say goodbye', 'See lesson content.', 1, 10, true),
('gcse-functions-p-12', 'gcse', 'functions', 'Add two numbers', 'See lesson content.', 1, 10, true),
('gcse-functions-p-13', 'gcse', 'functions', 'Is it positive?', 'See lesson content.', 2, 15, true),
('gcse-functions-p-14', 'gcse', 'functions', 'Rectangle area function', 'See lesson content.', 2, 15, true),
('gcse-functions-p-15', 'gcse', 'functions', 'Print a row of stars', 'See lesson content.', 2, 15, true),
('gcse-functions-p-16', 'gcse', 'functions', 'Grade from a mark', 'See lesson content.', 3, 20, true),
('gcse-functions-p-17', 'gcse', 'functions', 'Count the vowels', 'See lesson content.', 3, 20, true),
('gcse-functions-p-18', 'gcse', 'functions', 'Average of a list', 'See lesson content.', 3, 20, true),
('gcse-functions-p-19', 'gcse', 'functions', 'Is it prime?', 'See lesson content.', 4, 30, true),
('gcse-functions-p-20', 'gcse', 'functions', 'Two functions together', 'See lesson content.', 4, 30, true),
('gcse-functions-p-s3', 'gcse', 'functions', '🌟 Ticket price calculator', 'See lesson content.', 5, 40, true),
('gcse-functions-p-s4', 'gcse', 'functions', '🌟 Digit sum function', 'See lesson content.', 5, 40, true)
on conflict (slug) do nothing;
