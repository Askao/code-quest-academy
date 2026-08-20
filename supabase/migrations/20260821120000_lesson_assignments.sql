-- A student who belongs to a class gets a teacher-controlled gate on top of
-- the existing mastery gate (isLessonComplete/isTopicComplete in
-- src/lib/content.ts): a lesson stays locked, even once a student would
-- otherwise be ready for it, until their teacher has assigned it here. A
-- self-signed-up user with no class rows is unaffected - see
-- learn.$lessonSlug.tsx / learn.index.tsx for where this is read.
CREATE TABLE public.lesson_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  lesson_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, lesson_slug)
);
GRANT SELECT, INSERT, DELETE ON public.lesson_assignments TO authenticated;
GRANT ALL ON public.lesson_assignments TO service_role;
ALTER TABLE public.lesson_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lesson assignments readable" ON public.lesson_assignments FOR SELECT TO authenticated
  USING (
    public.is_class_teacher(class_id, auth.uid())
    OR public.is_class_member(class_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "teacher manages lesson assignments" ON public.lesson_assignments FOR ALL TO authenticated
  USING (public.is_class_teacher(class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_class_teacher(class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
