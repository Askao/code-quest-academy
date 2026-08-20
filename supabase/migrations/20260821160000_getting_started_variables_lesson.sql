-- Inserts a "Variables — storing a value" lesson into Getting started,
-- between print() and input() - students were being asked to store input()
-- in a variable before variables had ever been properly taught (per
-- teacher feedback). Lesson positions shift: "Getting input from the user"
-- becomes lesson 3 and "Concatenation" becomes lesson 4 (see the updated
-- "lesson" field on their existing tasks in gcse-getting-started.json) -
-- their task slugs are unchanged, so no rename/migration needed for those.
-- Every task solution here was verified against its exact test cases
-- through the real Pyodide runtime before this migration was written.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp) values
('gcse-getting-started-tvars-01', 'gcse', 'getting-started', 'Store and print', 'See lesson content.', 1, 10),
('gcse-getting-started-tvars-02', 'gcse', 'getting-started', 'Store a number', 'See lesson content.', 1, 10),
('gcse-getting-started-tvars-03', 'gcse', 'getting-started', 'Change the value', 'See lesson content.', 2, 15),
('gcse-getting-started-tvars-04', 'gcse', 'getting-started', 'Two variables', 'See lesson content.', 2, 15),
('gcse-getting-started-tvars-stretch', 'gcse', 'getting-started', 'Three in a row', 'See lesson content.', 3, 30);
