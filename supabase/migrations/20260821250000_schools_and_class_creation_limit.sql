-- ===== Schools: this deployment can now serve more than one school =====
-- Same join-code shape as classes already use (class_for_join_code in
-- 20260821130000_link_only_class_joining.sql): a narrow SECURITY DEFINER
-- lookup for resolving a code, everything else is a plain insert/update
-- under normal RLS.
CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  join_code text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- created_by = auth.uid() lets a teacher see the school they just made
-- before their own profiles.school_id is updated to point at it (INSERT
-- ... RETURNING is itself governed by the SELECT policy). A student never
-- has profiles.school_id set directly - their school comes from whichever
-- class they're in, so that needs its own clause too.
CREATE POLICY "schools readable by own members" ON public.schools FOR SELECT TO authenticated
  USING (
    id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.class_members cm JOIN public.classes c ON c.id = cm.class_id
      WHERE cm.student_id = auth.uid() AND c.school_id = schools.id
    )
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "teachers create schools" ON public.schools FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin')));

CREATE OR REPLACE FUNCTION public.school_for_join_code(_code text)
RETURNS TABLE(id uuid, name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name FROM public.schools WHERE join_code = _code
$$;
REVOKE ALL ON FUNCTION public.school_for_join_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.school_for_join_code(text) TO authenticated;

-- Nullable: a teacher can keep using the app without ever setting one up.
ALTER TABLE public.profiles ADD COLUMN school_id uuid REFERENCES public.schools(id);
ALTER TABLE public.classes ADD COLUMN school_id uuid REFERENCES public.schools(id);

-- ===== Class-creation spam limit, enforced at the RLS layer =====
-- Both subqueries read the classes table as of the start of the statement
-- (the row being inserted isn't visible to them yet) - the standard
-- Postgres pattern for a per-user row cap via RLS, no trigger needed.
-- Admins are exempt.
DROP POLICY "teachers create classes" ON public.classes;
CREATE POLICY "teachers create classes" ON public.classes FOR INSERT TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin'))
    AND (
      public.has_role(auth.uid(), 'admin')
      OR (
        (SELECT count(*) FROM public.classes WHERE teacher_id = auth.uid()) < 25
        AND (SELECT COALESCE(MAX(created_at), 'epoch'::timestamptz) FROM public.classes WHERE teacher_id = auth.uid()) < now() - interval '60 seconds'
      )
    )
  );

-- ===== Co-teacher tightening: same school only =====
-- Skips the check for classes with no school_id yet, so existing
-- co-teacher behaviour doesn't regress for teachers who haven't set one up.
CREATE OR REPLACE FUNCTION public.add_class_co_teacher(_class_id uuid, _email text)
RETURNS public.class_co_teachers LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  owner_id uuid;
  class_school_id uuid;
  target_id uuid;
  target_school_id uuid;
  row_result public.class_co_teachers;
BEGIN
  SELECT teacher_id, school_id INTO owner_id, class_school_id FROM public.classes WHERE id = _class_id;
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'Class not found';
  END IF;
  IF NOT (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Only the class owner or an admin can add co-teachers';
  END IF;

  SELECT id, school_id INTO target_id, target_school_id FROM public.profiles WHERE lower(email) = lower(trim(_email));
  IF target_id IS NULL THEN
    RAISE EXCEPTION 'No account found with that email';
  END IF;
  IF target_id = owner_id THEN
    RAISE EXCEPTION 'That teacher already owns this class';
  END IF;
  IF NOT (public.has_role(target_id, 'teacher') OR public.has_role(target_id, 'admin')) THEN
    RAISE EXCEPTION 'That account is not a teacher';
  END IF;
  IF class_school_id IS NOT NULL AND target_school_id IS DISTINCT FROM class_school_id THEN
    RAISE EXCEPTION 'That teacher is at a different school';
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

-- ===== Leaderboard rescoping: "school-wide" now means the caller's own
-- school, not everyone on the deployment =====
CREATE OR REPLACE FUNCTION public.leaderboard_top_xp(_class_id uuid DEFAULT NULL, _track public.track DEFAULT NULL, _limit int DEFAULT 10)
RETURNS TABLE(id uuid, name text, xp int, streak_days int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH caller_school AS (
    SELECT COALESCE(
      (SELECT school_id FROM public.profiles WHERE id = auth.uid()),
      (SELECT c.school_id FROM public.class_members cm JOIN public.classes c ON c.id = cm.class_id
       WHERE cm.student_id = auth.uid() AND c.school_id IS NOT NULL LIMIT 1)
    ) AS school_id
  )
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
    AND (SELECT school_id FROM caller_school) IS NOT NULL
    AND (_track IS NULL OR EXISTS (SELECT 1 FROM public.skills k WHERE k.user_id = p.id AND k.track = _track))
    AND (
      p.school_id = (SELECT school_id FROM caller_school)
      OR EXISTS (
        SELECT 1 FROM public.class_members cm JOIN public.classes c ON c.id = cm.class_id
        WHERE cm.student_id = p.id AND c.school_id = (SELECT school_id FROM caller_school)
      )
    )
  )
  ORDER BY s.xp DESC
  LIMIT LEAST(_limit, 10)
$$;

CREATE OR REPLACE FUNCTION public.leaderboard_most_improved(_class_id uuid DEFAULT NULL, _track public.track DEFAULT NULL, _limit int DEFAULT 10)
RETURNS TABLE(id uuid, name text, xp_gained bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH window_days AS (
    SELECT COALESCE((SELECT c.improved_window_days FROM public.classes c WHERE c.id = _class_id), 7) AS days
  ),
  caller_school AS (
    SELECT COALESCE(
      (SELECT school_id FROM public.profiles WHERE id = auth.uid()),
      (SELECT c.school_id FROM public.class_members cm JOIN public.classes c ON c.id = cm.class_id
       WHERE cm.student_id = auth.uid() AND c.school_id IS NOT NULL LIMIT 1)
    ) AS school_id
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
        AND (SELECT school_id FROM caller_school) IS NOT NULL
        AND (_track IS NULL OR EXISTS (SELECT 1 FROM public.skills k WHERE k.user_id = p.id AND k.track = _track))
        AND (
          p.school_id = (SELECT school_id FROM caller_school)
          OR EXISTS (
            SELECT 1 FROM public.class_members cm JOIN public.classes c ON c.id = cm.class_id
            WHERE cm.student_id = p.id AND c.school_id = (SELECT school_id FROM caller_school)
          )
        )
      )
    )
  GROUP BY p.id, p.full_name
  HAVING SUM(a.xp_awarded) > 0
  ORDER BY xp_gained DESC
  LIMIT LEAST(_limit, 10)
$$;
