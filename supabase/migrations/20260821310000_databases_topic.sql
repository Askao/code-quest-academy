-- Databases & SQL - the one topic AQA's GCSE spec has that OCR's doesn't
-- (see the "board" column added in 20260821300000_aqa_board_support.sql).
-- Display content (title, brief, starter SQL, hints, tests, difficulty,
-- xp) is authored in src/content/gcse-databases.json and merged in at
-- render time by withContent() in src/lib/content.ts - same pattern as
-- every other GCSE topic. These rows only need to exist so
-- attempts/XP/skill tracking has something to point at.
--
-- Unlike the other topic-seed migrations in this repo, these test cases
-- were checked by hand-tracing the sample data against each query, not by
-- running them through the real sql.js runtime (no live browser session
-- available while writing this) - please run through this lesson path for
-- real once it's live and flag anything that doesn't check out.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp) values
('gcse-databases-t1-01', 'gcse', 'databases', 'Select everything', 'See lesson content.', 1, 10),
('gcse-databases-t1-02', 'gcse', 'databases', 'Just the names', 'See lesson content.', 1, 10),
('gcse-databases-t1-03', 'gcse', 'databases', 'Two columns', 'See lesson content.', 2, 15),
('gcse-databases-t1-stretch', 'gcse', 'databases', 'Column order matters', 'See lesson content.', 3, 30),
('gcse-databases-t2-01', 'gcse', 'databases', 'Filter by year', 'See lesson content.', 2, 15),
('gcse-databases-t2-02', 'gcse', 'databases', 'Filter by text', 'See lesson content.', 2, 15),
('gcse-databases-t2-03', 'gcse', 'databases', 'Older than', 'See lesson content.', 2, 15),
('gcse-databases-t2-04', 'gcse', 'databases', 'Alphabetical order', 'See lesson content.', 2, 15),
('gcse-databases-t2-stretch', 'gcse', 'databases', 'Year 11 register', 'See lesson content.', 3, 30);
