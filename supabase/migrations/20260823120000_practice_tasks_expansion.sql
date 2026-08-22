-- Doubles the practice-task pool for every GCSE topic (5 -> 10, sequencing
-- 8 -> 10) so Practice's "Find a specific task" list has real variety and
-- a genuine spread of difficulty (previously every topic capped out around
-- difficulty 3 - none had a difficulty 4 or 5 practice task at all).
--
-- Display content (title, brief, starter, hints, tests, difficulty, xp) is
-- authored in src/content/*.json's "practiceTasks" arrays and merged in at
-- render time by withContent() - same pattern as every other task type.
-- These rows only need to exist so attempts/XP/skill tracking has
-- something to point at. Test cases were verified against the real
-- Pyodide engine before this migration was written.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp, practice_only) values
('gcse-getting-started-p-06', 'gcse', 'getting-started', 'Full address label', 'See lesson content.', 3, 20, true),
('gcse-getting-started-p-07', 'gcse', 'getting-started', 'Two-part story', 'See lesson content.', 3, 20, true),
('gcse-getting-started-p-08', 'gcse', 'getting-started', 'Business card', 'See lesson content.', 4, 25, true),
('gcse-getting-started-p-09', 'gcse', 'getting-started', 'Movie ticket', 'See lesson content.', 4, 25, true),
('gcse-getting-started-p-10', 'gcse', 'getting-started', 'Package receipt', 'See lesson content.', 5, 30, true),

('gcse-fundamentals-p-06', 'gcse', 'fundamentals', 'Total after tip', 'See lesson content.', 3, 20, true),
('gcse-fundamentals-p-07', 'gcse', 'fundamentals', 'Product of three', 'See lesson content.', 3, 20, true),
('gcse-fundamentals-p-08', 'gcse', 'fundamentals', 'Average height', 'See lesson content.', 4, 25, true),
('gcse-fundamentals-p-09', 'gcse', 'fundamentals', 'Fuel tank check', 'See lesson content.', 4, 25, true),
('gcse-fundamentals-p-10', 'gcse', 'fundamentals', 'Membership receipt', 'See lesson content.', 5, 30, true),

('gcse-sequencing-p-09', 'gcse', 'sequencing', 'Discounted price', 'See lesson content.', 3, 25, true),
('gcse-sequencing-p-10', 'gcse', 'sequencing', 'Petrol station queue time', 'See lesson content.', 5, 40, true),

('gcse-selection-p-06', 'gcse', 'selection', 'Grade classifier', 'See lesson content.', 2, 15, true),
('gcse-selection-p-07', 'gcse', 'selection', 'Even, odd or zero', 'See lesson content.', 3, 20, true),
('gcse-selection-p-08', 'gcse', 'selection', 'Triangle classifier', 'See lesson content.', 4, 25, true),
('gcse-selection-p-09', 'gcse', 'selection', 'Loyalty discount tier', 'See lesson content.', 4, 25, true),
('gcse-selection-p-10', 'gcse', 'selection', 'Exam grade boundaries with resit flag', 'See lesson content.', 5, 30, true),

('gcse-iteration-p-06', 'gcse', 'iteration', 'Sum 1 to N', 'See lesson content.', 2, 15, true),
('gcse-iteration-p-07', 'gcse', 'iteration', 'Largest of N numbers', 'See lesson content.', 3, 20, true),
('gcse-iteration-p-08', 'gcse', 'iteration', 'Countdown by twos', 'See lesson content.', 3, 20, true),
('gcse-iteration-p-09', 'gcse', 'iteration', 'Times table', 'See lesson content.', 4, 25, true),
('gcse-iteration-p-10', 'gcse', 'iteration', 'FizzBuzz range', 'See lesson content.', 5, 30, true),

('gcse-lists-p-06', 'gcse', 'lists', 'Sum of a list', 'See lesson content.', 2, 15, true),
('gcse-lists-p-07', 'gcse', 'lists', 'First and last item', 'See lesson content.', 3, 20, true),
('gcse-lists-p-08', 'gcse', 'lists', 'Even numbers only', 'See lesson content.', 3, 20, true),
('gcse-lists-p-09', 'gcse', 'lists', 'Remove duplicates, keep order', 'See lesson content.', 4, 25, true),
('gcse-lists-p-10', 'gcse', 'lists', 'Grade lookup by index', 'See lesson content.', 5, 30, true),

('gcse-strings-p-06', 'gcse', 'strings', 'Remove spaces', 'See lesson content.', 2, 15, true),
('gcse-strings-p-07', 'gcse', 'strings', 'Title case manually', 'See lesson content.', 3, 20, true),
('gcse-strings-p-08', 'gcse', 'strings', 'Count words', 'See lesson content.', 3, 20, true),
('gcse-strings-p-09', 'gcse', 'strings', 'Vowel counter', 'See lesson content.', 4, 25, true),
('gcse-strings-p-10', 'gcse', 'strings', 'Caesar shift by one', 'See lesson content.', 5, 30, true),

('gcse-functions-p-06', 'gcse', 'functions', 'Square function', 'See lesson content.', 2, 15, true),
('gcse-functions-p-07', 'gcse', 'functions', 'Min of three', 'See lesson content.', 3, 20, true),
('gcse-functions-p-08', 'gcse', 'functions', 'Convert temperature function', 'See lesson content.', 3, 20, true),
('gcse-functions-p-09', 'gcse', 'functions', 'Area and perimeter', 'See lesson content.', 4, 25, true),
('gcse-functions-p-10', 'gcse', 'functions', 'Grade function with bonus', 'See lesson content.', 5, 30, true),

('gcse-files-p-06', 'gcse', 'files', 'Overwrite protection', 'See lesson content.', 2, 20, true),
('gcse-files-p-07', 'gcse', 'files', 'Count words in a file', 'See lesson content.', 3, 25, true),
('gcse-files-p-08', 'gcse', 'files', 'Find the longest line', 'See lesson content.', 4, 25, true),
('gcse-files-p-09', 'gcse', 'files', 'Filter and rewrite', 'See lesson content.', 4, 30, true),
('gcse-files-p-10', 'gcse', 'files', 'Merge two files', 'See lesson content.', 5, 35, true)
on conflict (slug) do nothing;
