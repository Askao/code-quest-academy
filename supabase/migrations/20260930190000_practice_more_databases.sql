-- SQL practice tasks for databases: rows so attempts, XP and skill tracking have something to point at.
-- Wording, the sample database and the single test case are in src/content/gcse-databases.json;
-- every task's reference query was run against its exact schema in sql.js (the same engine
-- the browser loads from a CDN in sql-runner.ts). Idempotent.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp, practice_only) values
('gcse-databases-p-01', 'gcse', 'databases', 'Just the year 10s', 'See lesson content.', 1, 10, true),
('gcse-databases-p-02', 'gcse', 'databases', 'Everything about the books', 'See lesson content.', 1, 10, true),
('gcse-databases-p-03', 'gcse', 'databases', 'Just the titles', 'See lesson content.', 2, 15, true),
('gcse-databases-p-04', 'gcse', 'databases', 'The cheap ones', 'See lesson content.', 2, 15, true),
('gcse-databases-p-05', 'gcse', 'databases', 'Turing house', 'See lesson content.', 2, 15, true),
('gcse-databases-p-06', 'gcse', 'databases', 'Cheapest first', 'See lesson content.', 2, 20, true),
('gcse-databases-p-07', 'gcse', 'databases', 'Newest first', 'See lesson content.', 3, 20, true),
('gcse-databases-p-08', 'gcse', 'databases', 'Year 10 Turing', 'See lesson content.', 3, 20, true),
('gcse-databases-p-09', 'gcse', 'databases', 'Turing or Hopper', 'See lesson content.', 3, 25, true),
('gcse-databases-p-10', 'gcse', 'databases', 'Well-paid staff', 'See lesson content.', 4, 25, true),
('gcse-databases-p-s1', 'gcse', 'databases', '🌟 IT department, A to Z', 'See lesson content.', 5, 35, true),
('gcse-databases-p-s2', 'gcse', 'databases', '🌟 Recent bargains', 'See lesson content.', 5, 35, true)
on conflict (slug) do nothing;
