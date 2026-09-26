-- More practice tasks for getting-started: rows so attempts, XP and skill tracking have something to point at.
-- Wording, hints and tests are in src/content/gcse-getting-started.json; every task's reference solution was run
-- against its exact test cases in Pyodide 0.26.4. Idempotent.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp, practice_only) values
('gcse-getting-started-p-11', 'gcse', 'getting-started', 'Say hello', 'See lesson content.', 1, 10, true),
('gcse-getting-started-p-12', 'gcse', 'getting-started', 'Two names', 'See lesson content.', 1, 10, true),
('gcse-getting-started-p-13', 'gcse', 'getting-started', 'My favourite colour', 'See lesson content.', 1, 10, true),
('gcse-getting-started-p-14', 'gcse', 'getting-started', 'Name badge', 'See lesson content.', 2, 15, true),
('gcse-getting-started-p-15', 'gcse', 'getting-started', 'School email address', 'See lesson content.', 2, 15, true),
('gcse-getting-started-p-16', 'gcse', 'getting-started', 'Shout it', 'See lesson content.', 2, 15, true),
('gcse-getting-started-p-17', 'gcse', 'getting-started', 'Score line', 'See lesson content.', 2, 15, true),
('gcse-getting-started-p-18', 'gcse', 'getting-started', 'Weather report', 'See lesson content.', 3, 20, true),
('gcse-getting-started-p-19', 'gcse', 'getting-started', 'Pet card', 'See lesson content.', 3, 20, true),
('gcse-getting-started-p-20', 'gcse', 'getting-started', 'Story starter', 'See lesson content.', 3, 20, true),
('gcse-getting-started-p-s3', 'gcse', 'getting-started', '🌟 Certificate', 'See lesson content.', 5, 40, true),
('gcse-getting-started-p-s4', 'gcse', 'getting-started', '🌟 Address book entry', 'See lesson content.', 5, 40, true)
on conflict (slug) do nothing;
