-- A teacher-facing way to unenroll one student from their own class, without
-- needing admin access. admin_set_student_class (20260929120000) already
-- covers this for an admin working from /admin, but is admin-only by design
-- ("Admins only") and isn't something a plain teacher can call. This is the
-- narrower, teacher-scoped version: it only ever touches the one (class,
-- student) row asked for, never a student's other class memberships, and
-- only class_members - homework, attempts, skills and every other trace of
-- the student's work stay exactly as they are, same as admin_set_student_class.
CREATE OR REPLACE FUNCTION public.remove_student_from_class(_student_id uuid, _class_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.is_class_teacher(_class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Only that class''s teacher, a co-teacher, or an admin can remove a student from it';
  END IF;

  DELETE FROM public.class_members
  WHERE class_id = _class_id AND student_id = _student_id;
END;
$$;
REVOKE ALL ON FUNCTION public.remove_student_from_class(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_student_from_class(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
