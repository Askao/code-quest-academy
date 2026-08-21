-- Bug found during a full manual test pass: co-teachers (both explicit
-- class_co_teachers invites and automatic same-school access, added
-- 20260821240000/20260821260000) could open a class page at all - classes
-- SELECT and is_class_teacher() both already accounted for them - but the
-- roster showed "No students yet" even when the class had real students,
-- because can_view_user() (which gates profiles/skills/stats/attempts)
-- still checked the raw classes.teacher_id column instead of
-- is_class_teacher(), so only the literal owner could ever see a
-- student's data. Same bug in the reverse direction: a student could only
-- see their literal owning teacher's profile, not a co-teacher's.
CREATE OR REPLACE FUNCTION public.can_view_user(_viewer uuid, _target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _viewer = _target
     OR public.has_role(_viewer, 'admin')
     OR EXISTS (
          SELECT 1 FROM public.class_members cm
          JOIN public.classes c ON c.id = cm.class_id
          WHERE cm.student_id = _target AND public.is_class_teacher(c.id, _viewer))
     OR EXISTS (
          SELECT 1 FROM public.class_members a
          JOIN public.class_members b ON a.class_id = b.class_id
          WHERE a.student_id = _viewer AND b.student_id = _target)
     OR EXISTS (
          SELECT 1 FROM public.classes c
          JOIN public.class_members cm ON cm.class_id = c.id
          WHERE public.is_class_teacher(c.id, _target) AND cm.student_id = _viewer)
     OR EXISTS (
          SELECT 1 FROM public.profiles pv
          JOIN public.profiles pt ON pt.school_id = pv.school_id
          WHERE pv.id = _viewer AND pt.id = _target AND pv.school_id IS NOT NULL)
$$;
