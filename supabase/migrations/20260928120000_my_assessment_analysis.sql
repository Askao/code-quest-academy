-- A student's results across every assessment that has been marked AND had
-- its results released to them, with each question's topic - what the
-- dashboard's "My results" box analyses. Students can't read the question
-- bank directly (it's teacher-only), and my_assessment_result() returns one
-- attempt at a time without topics, so this is the one door for the whole
-- picture.
--
-- Only released, marked work is returned - the same rule my_assessment_result()
-- applies - and only the caller's own. It exposes the question text, the marks
-- and the teacher's comments a student can already see on their result page,
-- and never the mark scheme.
CREATE OR REPLACE FUNCTION public.my_assessment_analysis() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(s.item ORDER BY s.marked_at DESC), '[]'::jsonb)
  FROM (
    SELECT
      t.marked_at,
      jsonb_build_object(
        'assessment_id', a.id,
        'title', a.title,
        'board', a.board,
        'marked_at', t.marked_at,
        'total_marks', COALESCE((
          SELECT sum(q.marks) FROM public.assessment_items i
          JOIN public.assessment_questions q ON q.id = i.question_id
          WHERE i.assessment_id = a.id
        ), 0),
        'marks_awarded', COALESCE((
          SELECT sum(ans.marks_awarded) FROM public.assessment_answers ans
          WHERE ans.attempt_id = t.id
        ), 0),
        'questions', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'position', i.position,
            'question_id', q.id,
            'topic', q.topic,
            'ability', q.ability,
            'marks', q.marks,
            'marks_awarded', COALESCE(ans.marks_awarded, 0),
            'question', q.question,
            'comment', COALESCE(ans.teacher_comment, '')
          ) ORDER BY i.position)
          FROM public.assessment_items i
          JOIN public.assessment_questions q ON q.id = i.question_id
          LEFT JOIN public.assessment_answers ans
            ON ans.attempt_id = t.id AND ans.question_id = q.id
          WHERE i.assessment_id = a.id
        ), '[]'::jsonb)
      ) AS item
    FROM public.assessment_attempts t
    JOIN public.assessments a ON a.id = t.assessment_id
    WHERE t.student_id = auth.uid()
      AND t.marked_at IS NOT NULL
      AND a.results_released
  ) s
$$;
REVOKE ALL ON FUNCTION public.my_assessment_analysis() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_assessment_analysis() TO authenticated;
