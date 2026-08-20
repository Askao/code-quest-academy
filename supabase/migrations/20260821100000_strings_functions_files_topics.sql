-- Lesson paths for the three remaining GCSE topics: Strings, Subprograms
-- (topic key "functions") and File handling. Display content (title,
-- brief, starter code, hints, tests, difficulty, xp) is authored in
-- src/content/gcse-strings.json, gcse-functions.json and gcse-files.json
-- and merged in at render time by withContent() in src/lib/content.ts -
-- same pattern as the Fundamentals topic. These rows only need to exist so
-- attempts/XP/skill tracking has something to point at, and so `topic`
-- (used directly by pickChallenge()'s and setHomework()'s DB queries) is
-- correct. Every task solution here was run against its exact test cases
-- through the real Pyodide runtime before this migration was written.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp) values
-- Strings
('gcse-strings-t1-01', 'gcse', 'strings', 'First letter', 'See lesson content.', 1, 10),
('gcse-strings-t1-02', 'gcse', 'strings', 'Last letter', 'See lesson content.', 1, 10),
('gcse-strings-t1-03', 'gcse', 'strings', 'String length', 'See lesson content.', 1, 10),
('gcse-strings-t1-04', 'gcse', 'strings', 'First three letters', 'See lesson content.', 2, 15),
('gcse-strings-t1-stretch', 'gcse', 'strings', 'Middle letter', 'See lesson content.', 5, 40),
('gcse-strings-t2-01', 'gcse', 'strings', 'Shout it', 'See lesson content.', 1, 15),
('gcse-strings-t2-02', 'gcse', 'strings', 'Clean whitespace', 'See lesson content.', 2, 15),
('gcse-strings-t2-03', 'gcse', 'strings', 'Replace a word', 'See lesson content.', 2, 20),
('gcse-strings-t2-04', 'gcse', 'strings', 'Contains check', 'See lesson content.', 2, 20),
('gcse-strings-t2-stretch', 'gcse', 'strings', 'Title case by hand', 'See lesson content.', 5, 40),
('gcse-strings-t3-01', 'gcse', 'strings', 'Username length check', 'See lesson content.', 3, 25),
('gcse-strings-t3-02', 'gcse', 'strings', 'Count a letter', 'See lesson content.', 3, 25),
('gcse-strings-t3-03', 'gcse', 'strings', 'First and last match', 'See lesson content.', 3, 25),
('gcse-strings-t4-01', 'gcse', 'strings', 'Initials', 'See lesson content.', 4, 30),
('gcse-strings-t4-02', 'gcse', 'strings', 'Simple password checker', 'See lesson content.', 5, 40),
('gcse-strings-t3-stretch', 'gcse', 'strings', 'Anagram check', 'See lesson content.', 5, 40),
-- Subprograms (functions)
('gcse-functions-t1-01', 'gcse', 'functions', 'Write a function', 'See lesson content.', 1, 10),
('gcse-functions-t1-02', 'gcse', 'functions', 'Add two numbers', 'See lesson content.', 1, 10),
('gcse-functions-t1-03', 'gcse', 'functions', 'Greet by name', 'See lesson content.', 1, 10),
('gcse-functions-t1-04', 'gcse', 'functions', 'Use the result in a calculation', 'See lesson content.', 2, 15),
('gcse-functions-t1-stretch', 'gcse', 'functions', 'One function calling another', 'See lesson content.', 5, 40),
('gcse-functions-t2-01', 'gcse', 'functions', 'Rectangle area', 'See lesson content.', 2, 15),
('gcse-functions-t2-02', 'gcse', 'functions', 'Default parameter', 'See lesson content.', 2, 15),
('gcse-functions-t2-03', 'gcse', 'functions', 'Capture the return value', 'See lesson content.', 2, 20),
('gcse-functions-t2-04', 'gcse', 'functions', 'Three parameters', 'See lesson content.', 3, 20),
('gcse-functions-t2-stretch', 'gcse', 'functions', 'Choosing which arguments to pass', 'See lesson content.', 5, 40),
('gcse-functions-t3-01', 'gcse', 'functions', 'Is even function', 'See lesson content.', 3, 25),
('gcse-functions-t3-02', 'gcse', 'functions', 'Prime checker', 'See lesson content.', 4, 30),
('gcse-functions-t3-03', 'gcse', 'functions', 'One function using another', 'See lesson content.', 4, 30),
('gcse-functions-t4-01', 'gcse', 'functions', 'Temperature converter function', 'See lesson content.', 4, 35),
('gcse-functions-t4-02', 'gcse', 'functions', 'Procedure vs function', 'See lesson content.', 5, 40),
('gcse-functions-t3-stretch', 'gcse', 'functions', 'Grade calculator built from functions', 'See lesson content.', 5, 40),
-- File handling
('gcse-files-t1-01', 'gcse', 'files', 'Write to a file', 'See lesson content.', 1, 10),
('gcse-files-t1-02', 'gcse', 'files', 'Append, don''t overwrite', 'See lesson content.', 2, 15),
('gcse-files-t1-03', 'gcse', 'files', 'Overwrite check', 'See lesson content.', 2, 15),
('gcse-files-t1-04', 'gcse', 'files', 'Read line by line', 'See lesson content.', 2, 15),
('gcse-files-t1-stretch', 'gcse', 'files', 'Round-trip character count', 'See lesson content.', 5, 40),
('gcse-files-t2-01', 'gcse', 'files', 'Save and total', 'See lesson content.', 2, 15),
('gcse-files-t2-02', 'gcse', 'files', 'Count lines with with', 'See lesson content.', 2, 15),
('gcse-files-t2-03', 'gcse', 'files', 'Strip before comparing', 'See lesson content.', 3, 20),
('gcse-files-t2-04', 'gcse', 'files', 'Read a specific line', 'See lesson content.', 3, 20),
('gcse-files-t2-stretch', 'gcse', 'files', 'Average from a file', 'See lesson content.', 5, 40),
('gcse-files-t3-01', 'gcse', 'files', 'Search a saved file', 'See lesson content.', 3, 25),
('gcse-files-t3-02', 'gcse', 'files', 'Highest saved score', 'See lesson content.', 3, 25),
('gcse-files-t3-03', 'gcse', 'files', 'Count matching lines', 'See lesson content.', 4, 30),
('gcse-files-t4-01', 'gcse', 'files', 'Class register report', 'See lesson content.', 4, 35),
('gcse-files-t4-02', 'gcse', 'files', 'Word frequency in a saved file', 'See lesson content.', 5, 40),
('gcse-files-t3-stretch', 'gcse', 'files', 'Merge two files', 'See lesson content.', 5, 40)
on conflict (slug) do update set track = excluded.track, topic = excluded.topic;
