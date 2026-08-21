-- Admins and teachers shouldn't rank on leaderboards - noticed while
-- testing that a student promoted to teacher (via the admin Users table)
-- kept showing up, because their old class_members row was never cleaned
-- up. Filtering by role here is more robust than relying on membership
-- cleanup: it holds regardless of how a staff account ended up with a
-- class_members row.
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
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role IN ('teacher', 'admin')
  )
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
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role IN ('teacher', 'admin')
    )
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
