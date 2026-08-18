CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  track public.track NOT NULL,
  topic text NOT NULL,
  order_index int NOT NULL DEFAULT 1,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  worked_example text NOT NULL DEFAULT '',
  worked_example_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons readable" ON public.lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff manage lessons" ON public.lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'));

ALTER TABLE public.challenges
  ADD COLUMN wording_tier int NOT NULL DEFAULT 1 CHECK (wording_tier BETWEEN 1 AND 4),
  ADD COLUMN lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  ADD COLUMN lesson_order int NOT NULL DEFAULT 1;

CREATE INDEX challenges_topic_idx ON public.challenges (track, topic, wording_tier, difficulty);
CREATE INDEX challenges_lesson_idx ON public.challenges (lesson_id, lesson_order);

ALTER TABLE public.skills
  ADD COLUMN wording_tier numeric NOT NULL DEFAULT 1;