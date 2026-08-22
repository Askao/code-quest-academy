-- Completes the practice-task rollout started in 20260822130000 (which
-- piloted just Sequencing). Seeds practice_only=true rows for the
-- remaining 9 GCSE topics so Practice's "Find a specific task" list and
-- pickChallenge(practiceOnly: true) have a dedicated pool everywhere,
-- instead of relying on the ordinary-pool fallback.
--
-- Display content (title, brief, starter, hints, tests, difficulty, xp) is
-- authored in src/content/*.json's "practiceTasks" arrays and merged in at
-- render time by withContent() - same pattern as every other task type.
-- These rows only need to exist so attempts/XP/skill tracking has
-- something to point at. Test cases were verified against the real
-- Pyodide engine before this migration was written.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp, practice_only) values
('gcse-getting-started-p-01', 'gcse', 'getting-started', 'Print your name twice', 'See lesson content.', 1, 10, true),
('gcse-getting-started-p-02', 'gcse', 'getting-started', 'Echo a number', 'See lesson content.', 1, 10, true),
('gcse-getting-started-p-03', 'gcse', 'getting-started', 'Greeting card', 'See lesson content.', 2, 15, true),
('gcse-getting-started-p-04', 'gcse', 'getting-started', 'Two-line label', 'See lesson content.', 2, 15, true),
('gcse-getting-started-p-05', 'gcse', 'getting-started', 'Introduce yourself', 'See lesson content.', 3, 20, true),

('gcse-fundamentals-p-01', 'gcse', 'fundamentals', 'Pet''s age', 'See lesson content.', 1, 10, true),
('gcse-fundamentals-p-02', 'gcse', 'fundamentals', 'Book price', 'See lesson content.', 1, 10, true),
('gcse-fundamentals-p-03', 'gcse', 'fundamentals', 'Two totals', 'See lesson content.', 2, 15, true),
('gcse-fundamentals-p-04', 'gcse', 'fundamentals', 'Temperature swing', 'See lesson content.', 2, 15, true),
('gcse-fundamentals-p-05', 'gcse', 'fundamentals', 'Trip cost per person', 'See lesson content.', 3, 25, true),

('gcse-selection-p-01', 'gcse', 'selection', 'Voting age checker', 'See lesson content.', 1, 10, true),
('gcse-selection-p-02', 'gcse', 'selection', 'Positive or negative', 'See lesson content.', 1, 10, true),
('gcse-selection-p-03', 'gcse', 'selection', 'Speed camera', 'See lesson content.', 2, 15, true),
('gcse-selection-p-04', 'gcse', 'selection', 'Cinema age rating', 'See lesson content.', 3, 25, true),
('gcse-selection-p-05', 'gcse', 'selection', 'Data allowance', 'See lesson content.', 3, 25, true),

('gcse-iteration-p-01', 'gcse', 'iteration', 'Countdown', 'See lesson content.', 1, 10, true),
('gcse-iteration-p-02', 'gcse', 'iteration', 'Sum of even numbers', 'See lesson content.', 2, 15, true),
('gcse-iteration-p-03', 'gcse', 'iteration', 'Repeat a greeting', 'See lesson content.', 2, 15, true),
('gcse-iteration-p-04', 'gcse', 'iteration', 'Countdown to liftoff', 'See lesson content.', 2, 15, true),
('gcse-iteration-p-05', 'gcse', 'iteration', 'Multiples up to a limit', 'See lesson content.', 3, 25, true),

('gcse-combining-techniques-p-01', 'gcse', 'combining-techniques', 'Count positives', 'See lesson content.', 2, 15, true),
('gcse-combining-techniques-p-02', 'gcse', 'combining-techniques', 'Shoe size check', 'See lesson content.', 2, 15, true),
('gcse-combining-techniques-p-03', 'gcse', 'combining-techniques', 'Highest even number', 'See lesson content.', 3, 25, true),
('gcse-combining-techniques-p-04', 'gcse', 'combining-techniques', 'Count and total odd numbers', 'See lesson content.', 3, 25, true),
('gcse-combining-techniques-p-05', 'gcse', 'combining-techniques', 'Bus occupancy', 'See lesson content.', 4, 30, true),

('gcse-lists-p-01', 'gcse', 'lists', 'Reverse print', 'See lesson content.', 2, 15, true),
('gcse-lists-p-02', 'gcse', 'lists', 'Shopping list total', 'See lesson content.', 2, 15, true),
('gcse-lists-p-03', 'gcse', 'lists', 'Count matches', 'See lesson content.', 2, 20, true),
('gcse-lists-p-04', 'gcse', 'lists', 'Second highest', 'See lesson content.', 3, 25, true),
('gcse-lists-p-05', 'gcse', 'lists', 'Unique count', 'See lesson content.', 3, 30, true),

('gcse-strings-p-01', 'gcse', 'strings', 'First and last letter', 'See lesson content.', 1, 10, true),
('gcse-strings-p-02', 'gcse', 'strings', 'Shout it', 'See lesson content.', 1, 10, true),
('gcse-strings-p-03', 'gcse', 'strings', 'Count a letter', 'See lesson content.', 2, 15, true),
('gcse-strings-p-04', 'gcse', 'strings', 'Reverse a word', 'See lesson content.', 2, 20, true),
('gcse-strings-p-05', 'gcse', 'strings', 'Palindrome check', 'See lesson content.', 3, 25, true),

('gcse-functions-p-01', 'gcse', 'functions', 'Greet function', 'See lesson content.', 1, 10, true),
('gcse-functions-p-02', 'gcse', 'functions', 'Double function', 'See lesson content.', 1, 10, true),
('gcse-functions-p-03', 'gcse', 'functions', 'Is even function', 'See lesson content.', 2, 15, true),
('gcse-functions-p-04', 'gcse', 'functions', 'Max of two', 'See lesson content.', 2, 15, true),
('gcse-functions-p-05', 'gcse', 'functions', 'Total with VAT', 'See lesson content.', 3, 25, true),

('gcse-files-p-01', 'gcse', 'files', 'Save a high score', 'See lesson content.', 1, 15, true),
('gcse-files-p-02', 'gcse', 'files', 'Append a log entry', 'See lesson content.', 2, 20, true),
('gcse-files-p-03', 'gcse', 'files', 'Count lines', 'See lesson content.', 2, 20, true),
('gcse-files-p-04', 'gcse', 'files', 'Average from a file', 'See lesson content.', 3, 30, true),
('gcse-files-p-05', 'gcse', 'files', 'Guest list check-in', 'See lesson content.', 3, 30, true)
on conflict (slug) do nothing;
