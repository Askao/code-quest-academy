-- "Becoming a student" (a class_members row - the sole signal driving the
-- teacher-paced lesson gate) should only happen via a link a teacher shares
-- from their class page, not as a generic self-service action any logged-in
-- user can do to themselves later. 20260820120000_allow_class_lookup_by_join_code.sql
-- widened classes SELECT to all authenticated users purely to support the
-- dashboard's self-service join box, which is being removed - revert to the
-- original, narrower policy.
DROP POLICY "classes readable by authenticated" ON public.classes;
CREATE POLICY "classes readable by teacher, members, admin" ON public.classes FOR SELECT TO authenticated
  USING (teacher_id = auth.uid() OR public.is_class_member(id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

-- Lets the join-link landing page greet an unauthenticated visitor by class
-- name without reopening general class browsing: you can only resolve a
-- class you already have the exact code for, not enumerate them. Also
-- returns id: the join flow needs it to insert class_members right after
-- sign-up, before the new user passes the (now-narrower) classes SELECT
-- policy as a member - an id is an opaque key, not sensitive, so including
-- it here doesn't reopen the enumeration this function exists to prevent.
CREATE OR REPLACE FUNCTION public.class_for_join_code(_code text)
RETURNS TABLE(id uuid, name text, track public.track) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, track FROM public.classes WHERE join_code = _code
$$;
REVOKE ALL ON FUNCTION public.class_for_join_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.class_for_join_code(text) TO anon, authenticated;

-- Deleting a class deletes its students' accounts outright, not just their
-- class_members row. Every table hanging off a student's auth.users row
-- (profiles, user_roles, skills, stats, attempts, quiz_attempts,
-- class_members, homework_assignments, ide_programs, duels) is already
-- ON DELETE CASCADE, so deleting auth.users rows is sufficient.
CREATE OR REPLACE FUNCTION public.delete_class(_class_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.is_class_teacher(_class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  DELETE FROM auth.users WHERE id IN (
    SELECT student_id FROM public.class_members WHERE class_id = _class_id
  );

  DELETE FROM public.classes WHERE id = _class_id;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_class(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_class(uuid) TO authenticated;
