-- Being in the same school as a class now grants the same operational
-- access an explicitly-added co-teacher gets, automatically - no invite
-- needed. Every RLS policy that means "the teacher of this class"
-- (homework, lesson_assignments, class_members, duels,
-- homework_help_requests) already calls this one function, so this one
-- change is enough to extend access everywhere correctly, same as the
-- co_teachers table did.
CREATE OR REPLACE FUNCTION public.is_class_teacher(_class_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.classes WHERE id = _class_id AND teacher_id = _user_id)
     OR EXISTS (SELECT 1 FROM public.class_co_teachers WHERE class_id = _class_id AND teacher_id = _user_id)
     OR EXISTS (
          SELECT 1 FROM public.classes c
          JOIN public.profiles p ON p.id = _user_id
          WHERE c.id = _class_id AND c.school_id IS NOT NULL AND c.school_id = p.school_id
        )
$$;

-- Two teachers now often need to see each other's name (the "Teachers on
-- this class" list, or just being colleagues at the same school) without
-- sharing a class - can_view_user() didn't have a clause for that at all
-- before (co-teachers technically couldn't see each other's profile
-- either, since neither is the other's "student").
CREATE OR REPLACE FUNCTION public.can_view_user(_viewer uuid, _target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _viewer = _target
     OR public.has_role(_viewer, 'admin')
     OR EXISTS (
          SELECT 1 FROM public.class_members cm
          JOIN public.classes c ON c.id = cm.class_id
          WHERE cm.student_id = _target AND c.teacher_id = _viewer)
     OR EXISTS (
          SELECT 1 FROM public.class_members a
          JOIN public.class_members b ON a.class_id = b.class_id
          WHERE a.student_id = _viewer AND b.student_id = _target)
     OR EXISTS (
          SELECT 1 FROM public.classes c
          JOIN public.class_members cm ON cm.class_id = c.id
          WHERE c.teacher_id = _target AND cm.student_id = _viewer)
     OR EXISTS (
          SELECT 1 FROM public.profiles pv
          JOIN public.profiles pt ON pt.school_id = pv.school_id
          WHERE pv.id = _viewer AND pt.id = _target AND pv.school_id IS NOT NULL)
$$;
