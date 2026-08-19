-- Per-student homework assignments. Homework used to be one shared
-- challenge_ids list identical for every student in the class; this adds a
-- personalized list per student, generated from their own skills.level for
-- the chosen topic. homework.challenge_ids is left in place (default '{}')
-- for backward compatibility with homework rows created before this
-- migration - the app falls back to it when no per-student row exists.
CREATE TABLE public.homework_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id uuid NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (homework_id, student_id)
);
GRANT SELECT, INSERT, DELETE ON public.homework_assignments TO authenticated;
GRANT ALL ON public.homework_assignments TO service_role;
ALTER TABLE public.homework_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "homework assignments readable" ON public.homework_assignments FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.homework h
      WHERE h.id = homework_id AND public.is_class_teacher(h.class_id, auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "teacher manages homework assignments" ON public.homework_assignments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.homework h
      WHERE h.id = homework_id AND public.is_class_teacher(h.class_id, auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.homework h
      WHERE h.id = homework_id AND public.is_class_teacher(h.class_id, auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin')
  );
