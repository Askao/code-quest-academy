-- Seeds the pilot batch of Projects (see 20260821210000_project_tasks.sql)
-- for the Iteration topic - 4 tasks of escalating difficulty authored in
-- src/content/gcse-iteration.json's "projectTasks" array, each a longer
-- program combining validated input loops, running totals, and multi-branch
-- classification rather than a single quick drill. Every solution was run
-- against its exact test cases through the real Pyodide runtime before this
-- migration was written. Once reviewed, the same pattern seeds the
-- remaining 8 GCSE topics.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp, is_project) values
('gcse-iteration-project-01', 'gcse', 'iteration', 'Class Average Report', 'See lesson content.', 2, 40, true),
('gcse-iteration-project-02', 'gcse', 'iteration', 'Savings Goal Tracker', 'See lesson content.', 3, 60, true),
('gcse-iteration-project-03', 'gcse', 'iteration', 'Exam Results Summary', 'See lesson content.', 4, 80, true),
('gcse-iteration-project-04', 'gcse', 'iteration', 'Delivery Route Summary', 'See lesson content.', 5, 100, true)
on conflict (slug) do nothing;
