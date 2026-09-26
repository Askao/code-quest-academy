-- New GCSE topic: "robust-programs" (Robust programs) - OCR J277 section 2.3:
-- defensive design and input validation, authentication, maintainability,
-- testing and error types, and choosing test data. Five lessons.
--
-- Lesson notes, worked examples, quiz questions and every task's wording, hints
-- and test cases are authored in src/content/gcse-robust-programs.json and
-- merged in at render time; this migration only seeds the identity/metadata
-- row for each of the 25 lesson tasks so attempts, XP and skill tracking have
-- something to point at. Every task's reference solution was run against its
-- exact test cases in the real Pyodide engine (0.26.4) before this was written,
-- and every buggy starter was checked to fail.
--
-- Sits after "searching-sorting" and before "databases" in GCSE_TOPICS (see
-- game.ts). Idempotent.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp) values
('gcse-robust-programs-t1-01', 'gcse', 'robust-programs', 'Presence check', 'See lesson content.', 1, 10),
('gcse-robust-programs-t1-02', 'gcse', 'robust-programs', 'Range check on a mark', 'See lesson content.', 2, 15),
('gcse-robust-programs-t1-03', 'gcse', 'robust-programs', 'Length check on a password', 'See lesson content.', 2, 15),
('gcse-robust-programs-t1-04', 'gcse', 'robust-programs', 'Type check: is it a whole number?', 'See lesson content.', 2, 15),
('gcse-robust-programs-t1-05', 'gcse', 'robust-programs', 'Ask again until it is valid', 'See lesson content.', 3, 25),
('gcse-robust-programs-t1-stretch', 'gcse', 'robust-programs', 'Order quantity checker', 'See lesson content.', 5, 40),
('gcse-robust-programs-t2-01', 'gcse', 'robust-programs', 'Check the password', 'See lesson content.', 1, 10),
('gcse-robust-programs-t2-02', 'gcse', 'robust-programs', 'Username and password', 'See lesson content.', 2, 15),
('gcse-robust-programs-t2-03', 'gcse', 'robust-programs', 'Three attempts', 'See lesson content.', 3, 25),
('gcse-robust-programs-t2-04', 'gcse', 'robust-programs', 'Attempts left', 'See lesson content.', 3, 25),
('gcse-robust-programs-t2-stretch', 'gcse', 'robust-programs', 'Choose a new password', 'See lesson content.', 5, 40),
('gcse-robust-programs-t3-01', 'gcse', 'robust-programs', 'Write a validation function', 'See lesson content.', 2, 15),
('gcse-robust-programs-t3-02', 'gcse', 'robust-programs', 'Reuse the same check', 'See lesson content.', 3, 25),
('gcse-robust-programs-t3-03', 'gcse', 'robust-programs', 'Change it in one place', 'See lesson content.', 3, 25),
('gcse-robust-programs-t3-stretch', 'gcse', 'robust-programs', 'Shape calculator with subprograms', 'See lesson content.', 5, 40),
('gcse-robust-programs-t4-01', 'gcse', 'robust-programs', 'Fix the syntax error', 'See lesson content.', 2, 15),
('gcse-robust-programs-t4-02', 'gcse', 'robust-programs', 'Fix the logic error: the average', 'See lesson content.', 2, 15),
('gcse-robust-programs-t4-03', 'gcse', 'robust-programs', 'Fix the logic error: one short', 'See lesson content.', 3, 25),
('gcse-robust-programs-t4-04', 'gcse', 'robust-programs', 'Fix the logic error: voting age', 'See lesson content.', 3, 25),
('gcse-robust-programs-t4-stretch', 'gcse', 'robust-programs', 'Two errors in one program', 'See lesson content.', 5, 40),
('gcse-robust-programs-t5-01', 'gcse', 'robust-programs', 'Normal, boundary or invalid?', 'See lesson content.', 2, 15),
('gcse-robust-programs-t5-02', 'gcse', 'robust-programs', 'Include erroneous data', 'See lesson content.', 3, 25),
('gcse-robust-programs-t5-03', 'gcse', 'robust-programs', 'Boundary values for a range', 'See lesson content.', 3, 25),
('gcse-robust-programs-t5-04', 'gcse', 'robust-programs', 'Mark a test: pass or fail?', 'See lesson content.', 3, 25),
('gcse-robust-programs-t5-stretch', 'gcse', 'robust-programs', 'Test report summary', 'See lesson content.', 5, 40)
on conflict (slug) do nothing;
