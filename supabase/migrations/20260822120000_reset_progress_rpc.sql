-- Lets a teacher reset a student's progress on a topic (every task attempt,
-- every lesson quiz in it, and the topic's skill level - a genuine "start
-- this topic over") or on a single lesson (just that lesson's task
-- attempts and its one quiz attempt - the skill level, being a topic-wide
-- signal, is left alone). Also usable by a user on their own account
-- (e.g. a teacher who's been using Practice mode themselves).
--
-- attempts/skills/quiz_attempts have no DELETE policy at all today (RLS
-- default-denies), including for the owning user - this is the first
-- delete path onto any of them, so it goes through one narrow,
-- SECURITY DEFINER function rather than opening a blanket delete policy.
--
-- Lesson-level task slugs aren't derivable in SQL: which lesson a task
-- belongs to only exists in the repo's content JSON (challenges has
-- track/topic but not a lesson number), so the caller passes the exact
-- slug list for a lesson-scoped reset. A topic-scoped reset doesn't need
-- that - challenges.track/topic cover it directly, and quiz_attempts.lesson_slug
-- follows the app's fixed "<track>-<topic>-<n>" convention (see content.ts),
-- so a LIKE pattern catches every lesson in the topic without the caller
-- having to enumerate them.
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

  IF _lesson_slug IS NULL THEN
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
  ELSE
    DELETE FROM public.attempts a
    USING public.challenges c
    WHERE a.challenge_id = c.id
      AND a.user_id = _user_id
      AND c.slug = ANY(_task_slugs);

    DELETE FROM public.quiz_attempts
    WHERE user_id = _user_id
      AND lesson_slug = _lesson_slug;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_progress(uuid, public.track, text, text, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_progress(uuid, public.track, text, text, text[]) TO authenticated;
