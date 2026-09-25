-- Homework for students who join a class after it was set.
--
-- Until now a homework's per-student task lists (homework_assignments) were
-- generated once, in the teacher's browser, for whoever was on the roster at
-- that moment. A student who joined later had no row, so the homework page
-- fell back to the legacy shared list - empty - and they saw a homework with
-- 0 tasks. To build a list for them later we need to remember what the
-- teacher chose, so the homework row now keeps its task pool, the topics it
-- was drawn from (empty = all, which is what decides a student's level), and
-- how many tasks each student gets.
ALTER TABLE public.homework
  ADD COLUMN IF NOT EXISTS pool_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS topics text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS task_count int;

-- Homework set before this migration didn't record its pool. Reconstruct the
-- best available approximation - every task any student in the class was
-- given for it - so late joiners on existing homework work too.
UPDATE public.homework h
SET pool_ids = COALESCE((
      SELECT array_agg(DISTINCT c)
      FROM public.homework_assignments a, unnest(a.challenge_ids) AS c
      WHERE a.homework_id = h.id
    ), '{}'),
    task_count = (
      SELECT max(cardinality(a.challenge_ids))
      FROM public.homework_assignments a
      WHERE a.homework_id = h.id
    )
WHERE cardinality(h.pool_ids) = 0;

-- A student building their own list for a homework they joined late.
-- Students can't insert into homework_assignments directly (only teachers
-- can), so this is the one door, and it checks everything the client could
-- otherwise get wrong or bend: the caller is in the class, the tasks all
-- come from that homework's pool, the list isn't longer than the teacher
-- asked for, and it can't be empty (an empty list would read as "0/0 done").
-- An existing assignment is never overwritten.
CREATE OR REPLACE FUNCTION public.claim_homework_assignment(
  _homework_id uuid,
  _challenge_ids uuid[]
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  h public.homework%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;
  SELECT * INTO h FROM public.homework WHERE id = _homework_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Homework not found';
  END IF;
  IF NOT public.is_class_member(h.class_id, auth.uid()) THEN
    RAISE EXCEPTION 'You are not in this class';
  END IF;
  IF _challenge_ids IS NULL OR cardinality(_challenge_ids) = 0 THEN
    RAISE EXCEPTION 'Nothing to assign';
  END IF;
  IF cardinality(h.pool_ids) = 0 THEN
    RAISE EXCEPTION 'This homework has no task pool';
  END IF;
  IF cardinality(_challenge_ids) > COALESCE(h.task_count, 12) THEN
    RAISE EXCEPTION 'Too many tasks for this homework';
  END IF;
  IF NOT (_challenge_ids <@ h.pool_ids) THEN
    RAISE EXCEPTION 'Those tasks are not part of this homework';
  END IF;
  INSERT INTO public.homework_assignments (homework_id, student_id, challenge_ids)
  VALUES (_homework_id, auth.uid(), _challenge_ids)
  ON CONFLICT (homework_id, student_id) DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_homework_assignment(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_homework_assignment(uuid, uuid[]) TO authenticated;
