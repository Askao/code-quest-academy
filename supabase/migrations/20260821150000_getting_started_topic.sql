-- New first GCSE topic, "Getting started" (topic key getting-started),
-- inserted before Fundamentals in GCSE_TOPICS (src/lib/game.ts): using the
-- IDE, print(), input(), and string concatenation with +. Display content
-- lives in src/content/gcse-getting-started.json and is merged in at render
-- time by withContent() - same pattern as every other topic. These rows
-- only need to exist so attempts/XP/skill tracking has something to point
-- at. Every task solution here was hand-verified against its exact test
-- cases before this migration was written.
--
-- Note: this re-locks "Data types & variables" for any student already
-- partway through it, since it's no longer the first topic - matches the
-- one-time reset already flagged for the lesson-assignment gate change.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp) values
('gcse-getting-started-t1-01', 'gcse', 'getting-started', 'Print a greeting', 'See lesson content.', 1, 10),
('gcse-getting-started-t1-02', 'gcse', 'getting-started', 'Two lines', 'See lesson content.', 1, 10),
('gcse-getting-started-t1-03', 'gcse', 'getting-started', 'Text then a number', 'See lesson content.', 1, 10),
('gcse-getting-started-t1-04', 'gcse', 'getting-started', 'Three lines', 'See lesson content.', 2, 15),
('gcse-getting-started-t1-stretch', 'gcse', 'getting-started', 'Robot introduction', 'See lesson content.', 3, 30),
('gcse-getting-started-t2-01', 'gcse', 'getting-started', 'Echo it back', 'See lesson content.', 1, 10),
('gcse-getting-started-t2-02', 'gcse', 'getting-started', 'Store and show', 'See lesson content.', 1, 10),
('gcse-getting-started-t2-03', 'gcse', 'getting-started', 'Two answers', 'See lesson content.', 2, 15),
('gcse-getting-started-t2-04', 'gcse', 'getting-started', 'Say it twice', 'See lesson content.', 2, 15),
('gcse-getting-started-t2-stretch', 'gcse', 'getting-started', 'Swap the order', 'See lesson content.', 3, 30),
('gcse-getting-started-t3-01', 'gcse', 'getting-started', 'Join two words', 'See lesson content.', 1, 10),
('gcse-getting-started-t3-02', 'gcse', 'getting-started', 'Add a space', 'See lesson content.', 1, 10),
('gcse-getting-started-t3-03', 'gcse', 'getting-started', 'Greet the user', 'See lesson content.', 2, 15),
('gcse-getting-started-t3-04', 'gcse', 'getting-started', 'Build a sentence', 'See lesson content.', 2, 20),
('gcse-getting-started-t3-stretch', 'gcse', 'getting-started', 'Three-part message', 'See lesson content.', 3, 30);
