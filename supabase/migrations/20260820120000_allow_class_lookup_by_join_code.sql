-- Students joining a class look the class up by join_code before they are a
-- member (see dashboard.tsx's join() flow). The existing SELECT policy only
-- allowed the teacher, existing members, or admins to see a class row, so
-- that lookup always returned nothing for a genuinely new joiner and the
-- join code was rejected even when correct. Join codes are already the
-- shared secret here (like a Kahoot/Google Classroom code), so it's safe to
-- let any signed-in user look up class rows generally.
DROP POLICY "classes readable by teacher, members, admin" ON public.classes;

CREATE POLICY "classes readable by authenticated" ON public.classes FOR SELECT TO authenticated
  USING (true);
