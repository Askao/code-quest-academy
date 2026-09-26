-- A teacher's SUMMARY of how their class is using revision papers: how many each
-- student has made and handed in, the marks they gave themselves, a per-topic
-- breakdown, and when they last revised. Deliberately no questions and no
-- answers - the papers themselves stay private to the student (the row-level
-- policies on revision_* are unchanged). Students are told on the Revise page.
--
-- One row per current member of the class, including students who have never
-- made a paper (those show zeros and a null last_active), so a teacher can see
-- who hasn't started. Anyone who is neither the class's teacher nor an admin
-- gets no rows.
CREATE OR REPLACE FUNCTION public.class_revision_summary(_class_id uuid) RETURNS TABLE (
  student_id uuid,
  papers_made int,
  papers_handed_in int,
  marks_awarded int,
  marks_available int,
  last_active timestamptz,
  topics jsonb
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH allowed AS (
    SELECT (public.is_class_teacher(_class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')) AS ok
  ),
  members AS (
    SELECT cm.student_id AS sid
    FROM public.class_members cm, allowed
    WHERE cm.class_id = _class_id AND allowed.ok
  ),
  papers AS (
    SELECT p.student_id AS sid,
           count(*)::int AS made,
           count(p.submitted_at)::int AS handed_in,
           max(coalesce(p.submitted_at, p.started_at, p.created_at)) AS last_active
    FROM public.revision_papers p
    JOIN members m ON m.sid = p.student_id
    GROUP BY p.student_id
  ),
  scored AS (
    SELECT p.student_id AS sid, q.topic,
           sum(a.marks_awarded)::int AS awarded,
           sum(q.marks)::int AS available
    FROM public.revision_papers p
    JOIN members m ON m.sid = p.student_id
    JOIN public.revision_answers a ON a.paper_id = p.id AND a.marked
    JOIN public.assessment_questions q ON q.id = a.question_id
    GROUP BY p.student_id, q.topic
  ),
  totals AS (
    SELECT sid,
           sum(awarded)::int AS awarded,
           sum(available)::int AS available,
           jsonb_agg(jsonb_build_object('topic', topic, 'awarded', awarded, 'available', available) ORDER BY topic) AS topics
    FROM scored
    GROUP BY sid
  )
  SELECT m.sid,
         coalesce(pp.made, 0),
         coalesce(pp.handed_in, 0),
         coalesce(t.awarded, 0),
         coalesce(t.available, 0),
         pp.last_active,
         coalesce(t.topics, '[]'::jsonb)
  FROM members m
  LEFT JOIN papers pp ON pp.sid = m.sid
  LEFT JOIN totals t ON t.sid = m.sid
$$;
REVOKE ALL ON FUNCTION public.class_revision_summary(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.class_revision_summary(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
