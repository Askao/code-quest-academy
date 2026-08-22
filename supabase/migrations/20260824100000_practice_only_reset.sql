-- Extends reset_progress (20260822120000) to support a third scope:
-- practice-only. The existing function already has two modes - whole
-- topic (_lesson_slug and _task_slugs both null) and single lesson
-- (_lesson_slug + _task_slugs given, which also clears that lesson's one
-- quiz_attempts row). Practice tasks don't belong to a lesson at all, so
-- neither mode fit: whole-topic would also wipe lesson/homework/project
-- attempts and the skill level, which practice completion shouldn't touch;
-- lesson-scoped required a lesson_slug that doesn't exist for practice.
--
-- The fix: key the branch on _task_slugs alone. When slugs are given,
-- delete just those attempts, and only touch quiz_attempts if a
-- lesson_slug also came along (still exactly the old lesson-scoped
-- behaviour when both are passed). Practice's reset call passes
-- taskSlugs with no lessonSlug, so it lands in this branch and clears
-- only those attempts - no quiz_attempts, no skill row.
CREATE OR REPLACE FUNCTION public.reset_progress(
  _user_id uuid,
  _track public.track,
  _topic text,
  _lesson_slug text DEFAULT NULL,
  _task_slugs text[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    auth.uid() = _user_id
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.class_members cm
      WHERE cm.student_id = _user_id
        AND public.is_class_teacher(cm.class_id, auth.uid())
    )
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF _task_slugs IS NOT NULL THEN
    DELETE FROM public.attempts a
    USING public.challenges c
    WHERE a.challenge_id = c.id
      AND a.user_id = _user_id
      AND c.slug = ANY(_task_slugs);

    IF _lesson_slug IS NOT NULL THEN
      DELETE FROM public.quiz_attempts
      WHERE user_id = _user_id
        AND lesson_slug = _lesson_slug;
    END IF;
  ELSE
    DELETE FROM public.attempts a
    USING public.challenges c
    WHERE a.challenge_id = c.id
      AND a.user_id = _user_id
      AND c.track = _track
      AND c.topic = _topic;

    DELETE FROM public.quiz_attempts
    WHERE user_id = _user_id
      AND lesson_slug LIKE (_track::text || '-' || _topic || '-%');

    DELETE FROM public.skills
    WHERE user_id = _user_id
      AND track = _track
      AND topic = _topic;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_progress(uuid, public.track, text, text, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_progress(uuid, public.track, text, text, text[]) TO authenticated;
