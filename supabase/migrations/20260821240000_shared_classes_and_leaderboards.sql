-- ===== Co-teachers: covering a colleague's class =====
-- classes.teacher_id stays the single *owner* (deletion, adding/removing
-- co-teachers). A co-teacher gets the same day-to-day operational access
-- as the owner - homework, lessons, roster, help requests - by piggybacking
-- on is_class_teacher(), which every one of those tables' RLS policies
-- already calls instead of comparing teacher_id directly.
CREATE TABLE public.class_co_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, teacher_id)
);
GRANT SELECT, DELETE ON public.class_co_teachers TO authenticated;
GRANT ALL ON public.class_co_teachers TO service_role;
ALTER TABLE public.class_co_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "co-teachers readable by class teachers" ON public.class_co_teachers FOR SELECT TO authenticated
  USING (public.is_class_teacher(class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
-- Only the owner (or admin) removes a co-teacher directly - adding goes
-- through add_class_co_teacher() below since it needs an email lookup.
CREATE POLICY "owner removes co-teachers" ON public.class_co_teachers FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE OR REPLACE FUNCTION public.is_class_teacher(_class_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.classes WHERE id = _class_id AND teacher_id = _user_id)
     OR EXISTS (SELECT 1 FROM public.class_co_teachers WHERE class_id = _class_id AND teacher_id = _user_id)
$$;

-- Deleting a class (and every student account in it) stays an owner-only
-- action - is_class_teacher() now includes co-teachers, so this can no
-- longer rely on it like it used to.
CREATE OR REPLACE FUNCTION public.delete_class(_class_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (
    EXISTS (SELECT 1 FROM public.classes WHERE id = _class_id AND teacher_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  DELETE FROM auth.users WHERE id IN (
    SELECT student_id FROM public.class_members WHERE class_id = _class_id
  );

  DELETE FROM public.classes WHERE id = _class_id;
END;
$$;

-- So a co-teacher's own "my classes" query actually returns classes they
-- don't own.
DROP POLICY "classes readable by teacher, members, admin" ON public.classes;
CREATE POLICY "classes readable by teacher, members, admin" ON public.classes FOR SELECT TO authenticated
  USING (public.is_class_teacher(id, auth.uid()) OR public.is_class_member(id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

-- Adding a co-teacher needs to resolve a colleague's email to a user id,
-- which the normal profiles RLS won't allow unless they already share a
-- class (can_view_user) - a definer function bypasses that narrowly, for
-- this one lookup, instead of widening profile visibility generally.
CREATE OR REPLACE FUNCTION public.add_class_co_teacher(_class_id uuid, _email text)
RETURNS public.class_co_teachers LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  owner_id uuid;
  target_id uuid;
  row_result public.class_co_teachers;
BEGIN
  SELECT teacher_id INTO owner_id FROM public.classes WHERE id = _class_id;
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'Class not found';
  END IF;
  IF NOT (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Only the class owner or an admin can add co-teachers';
  END IF;

  SELECT id INTO target_id FROM public.profiles WHERE lower(email) = lower(trim(_email));
  IF target_id IS NULL THEN
    RAISE EXCEPTION 'No account found with that email';
  END IF;
  IF target_id = owner_id THEN
    RAISE EXCEPTION 'That teacher already owns this class';
  END IF;
  IF NOT (public.has_role(target_id, 'teacher') OR public.has_role(target_id, 'admin')) THEN
    RAISE EXCEPTION 'That account is not a teacher';
  END IF;

  INSERT INTO public.class_co_teachers (class_id, teacher_id, added_by)
  VALUES (_class_id, target_id, auth.uid())
  ON CONFLICT (class_id, teacher_id) DO NOTHING
  RETURNING * INTO row_result;

  IF row_result.id IS NULL THEN
    RAISE EXCEPTION 'That teacher already has access to this class';
  END IF;

  RETURN row_result;
END;
$$;
REVOKE ALL ON FUNCTION public.add_class_co_teacher(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_class_co_teacher(uuid, text) TO authenticated;

-- ===== Most-improved leaderboard window, set per class at creation =====
ALTER TABLE public.classes ADD COLUMN improved_window_days int NOT NULL DEFAULT 7
  CHECK (improved_window_days IN (7, 14, 30));

-- ===== Leaderboards: school-wide (top 10, split by track) =====
-- Both narrowly return just what a leaderboard needs (name + aggregate
-- numbers), not full row access - can_view_user() deliberately stays
-- class-scoped, so a plain widened RLS policy would also expose every
-- student's individual attempt history school-wide, not just standing.
CREATE OR REPLACE FUNCTION public.leaderboard_top_xp(_class_id uuid DEFAULT NULL, _track public.track DEFAULT NULL, _limit int DEFAULT 10)
RETURNS TABLE(id uuid, name text, xp int, streak_days int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, s.xp, s.streak_days
  FROM public.stats s
  JOIN public.profiles p ON p.id = s.user_id
  WHERE (
    _class_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.class_members cm WHERE cm.class_id = _class_id AND cm.student_id = p.id)
    AND (public.is_class_member(_class_id, auth.uid()) OR public.is_class_teacher(_class_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  )
  OR (
    _class_id IS NULL
    AND (_track IS NULL OR EXISTS (SELECT 1 FROM public.skills k WHERE k.user_id = p.id AND k.track = _track))
  )
  ORDER BY s.xp DESC
  LIMIT LEAST(_limit, 10)
$$;
REVOKE ALL ON FUNCTION public.leaderboard_top_xp(uuid, public.track, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leaderboard_top_xp(uuid, public.track, int) TO authenticated;

CREATE OR REPLACE FUNCTION public.leaderboard_most_improved(_class_id uuid DEFAULT NULL, _track public.track DEFAULT NULL, _limit int DEFAULT 10)
RETURNS TABLE(id uuid, name text, xp_gained bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH window_days AS (
    SELECT COALESCE((SELECT c.improved_window_days FROM public.classes c WHERE c.id = _class_id), 7) AS days
  )
  SELECT p.id, p.full_name, SUM(a.xp_awarded) AS xp_gained
  FROM public.attempts a
  JOIN public.profiles p ON p.id = a.user_id
  CROSS JOIN window_days w
  WHERE a.created_at >= now() - make_interval(days => w.days)
    AND (
      (
        _class_id IS NOT NULL
        AND EXISTS (SELECT 1 FROM public.class_members cm WHERE cm.class_id = _class_id AND cm.student_id = p.id)
        AND (public.is_class_member(_class_id, auth.uid()) OR public.is_class_teacher(_class_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
      )
      OR (
        _class_id IS NULL
        AND (_track IS NULL OR EXISTS (SELECT 1 FROM public.skills k WHERE k.user_id = p.id AND k.track = _track))
      )
    )
  GROUP BY p.id, p.full_name
  HAVING SUM(a.xp_awarded) > 0
  ORDER BY xp_gained DESC
  LIMIT LEAST(_limit, 10)
$$;
REVOKE ALL ON FUNCTION public.leaderboard_most_improved(uuid, public.track, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leaderboard_most_improved(uuid, public.track, int) TO authenticated;
