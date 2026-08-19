-- Fundamentals topic (data types, variables, casting, input/output) - the
-- new prerequisite topic ahead of Sequencing. Display content (title,
-- brief, starter code, hints, tests, difficulty, xp) is authored in
-- src/content/gcse-fundamentals.json and merged in at render time by
-- withContent() in src/lib/content.ts - these rows only need to exist so
-- attempts/XP/skill tracking has something to point at, and so `topic`
-- (used directly by pickChallenge()'s DB query) is correct.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp) values
('gcse-fundamentals-t1-01', 'gcse', 'fundamentals', 'Store and print', 'See lesson content.', 1, 10),
('gcse-fundamentals-t1-02', 'gcse', 'fundamentals', 'Update a variable', 'See lesson content.', 1, 10),
('gcse-fundamentals-t1-03', 'gcse', 'fundamentals', 'Two variables', 'See lesson content.', 1, 10),
('gcse-fundamentals-t1-04', 'gcse', 'fundamentals', 'Overwrite a variable', 'See lesson content.', 2, 15),
('gcse-fundamentals-t2-01', 'gcse', 'fundamentals', 'Name that type', 'See lesson content.', 1, 15),
('gcse-fundamentals-t2-02', 'gcse', 'fundamentals', 'Pick the right type', 'See lesson content.', 2, 15),
('gcse-fundamentals-t2-03', 'gcse', 'fundamentals', 'Boolean check', 'See lesson content.', 2, 20),
('gcse-fundamentals-t2-04', 'gcse', 'fundamentals', 'A single character', 'See lesson content.', 2, 20),
('gcse-fundamentals-t3-01', 'gcse', 'fundamentals', 'Age next year', 'See lesson content.', 2, 20),
('gcse-fundamentals-t3-02', 'gcse', 'fundamentals', 'Product price', 'See lesson content.', 3, 25),
('gcse-fundamentals-t3-03', 'gcse', 'fundamentals', 'Joining text and numbers', 'See lesson content.', 3, 25),
('gcse-fundamentals-t4-01', 'gcse', 'fundamentals', 'Validated-looking receipt line', 'See lesson content.', 4, 30),
('gcse-fundamentals-t4-02', 'gcse', 'fundamentals', 'Type-safe area calculator', 'See lesson content.', 4, 35),
('gcse-fundamentals-t4-big1a', 'gcse', 'fundamentals', 'Cinema booking system Part A', 'See lesson content.', 3, 25),
('gcse-fundamentals-t4-big1b', 'gcse', 'fundamentals', 'Cinema booking system Part B', 'See lesson content.', 4, 30)
on conflict (slug) do update set track = excluded.track, topic = excluded.topic;

-- Mini-quiz attempts (multiple choice, auto-marked). One row per full
-- attempt at a lesson's quiz, not per-question - gating just needs "did
-- they clear the pass threshold", not per-question history.
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_slug text NOT NULL,
  score int NOT NULL,
  total int NOT NULL,
  passed boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz attempts readable" ON public.quiz_attempts FOR SELECT TO authenticated
  USING (public.can_view_user(auth.uid(), user_id));
CREATE POLICY "own quiz attempts insert" ON public.quiz_attempts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
