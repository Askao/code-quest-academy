-- The 15 stretch tasks added across the 5 GCSE lesson topics only got their
-- display content authored in src/content/*.json - the underlying
-- public.challenges rows they need to exist (so play.$slug.tsx has
-- something to load and overlay withContent() onto, same as every other
-- task) were never inserted. Every stretch task has been stuck on "Loading
-- challenge..." forever since it shipped. Same shape as the fundamentals
-- seed migration: only slug/track/topic/title/difficulty/xp matter here,
-- everything else is overlaid from the JSON at render time.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp) values
('gcse-fundamentals-t1-stretch', 'gcse', 'fundamentals', 'Swap two variables', 'See lesson content.', 5, 40),
('gcse-fundamentals-t2-stretch', 'gcse', 'fundamentals', 'Same value, three types', 'See lesson content.', 5, 40),
('gcse-fundamentals-t3-stretch', 'gcse', 'fundamentals', 'Split the bill', 'See lesson content.', 5, 40),
('gcse-sequencing-t1-stretch', 'gcse', 'sequencing', 'Name, reversed', 'See lesson content.', 5, 40),
('gcse-sequencing-t2-stretch', 'gcse', 'sequencing', 'Tip, total and share', 'See lesson content.', 5, 40),
('gcse-sequencing-t3-stretch', 'gcse', 'sequencing', 'Simple loan estimate', 'See lesson content.', 5, 40),
('gcse-selection-t1-stretch', 'gcse', 'selection', 'Largest of three', 'See lesson content.', 5, 40),
('gcse-selection-t2-stretch', 'gcse', 'selection', 'VIP eligibility', 'See lesson content.', 5, 40),
('gcse-selection-t3-stretch', 'gcse', 'selection', 'Exam retake eligibility', 'See lesson content.', 5, 40),
('gcse-iteration-t1-stretch', 'gcse', 'iteration', 'Star triangle', 'See lesson content.', 5, 40),
('gcse-iteration-t2-stretch', 'gcse', 'iteration', 'Count the even numbers', 'See lesson content.', 5, 40),
('gcse-iteration-t3-stretch', 'gcse', 'iteration', 'Temperature range', 'See lesson content.', 5, 40),
('gcse-lists-t1-stretch', 'gcse', 'lists', 'Middle word', 'See lesson content.', 5, 40),
('gcse-lists-t2-stretch', 'gcse', 'lists', 'Second highest', 'See lesson content.', 5, 40),
('gcse-lists-t3-stretch', 'gcse', 'lists', 'Class test averages', 'See lesson content.', 5, 40)
on conflict (slug) do update set track = excluded.track, topic = excluded.topic;
