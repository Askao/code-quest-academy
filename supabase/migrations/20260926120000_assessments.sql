-- Assessments: timed, teacher-marked papers built from a bank of exam-style
-- questions (OCR / AQA wording), set per class like homework but with no
-- automatic marking. The teacher marks each answer against the question's
-- mark scheme, point by point (YES awards the point's marks, NO doesn't).
--
-- Who can see what is the point of most of this file:
--   * The question bank and mark schemes are readable by teachers only.
--     Students never query them - they get a paper through
--     assessment_paper(), and only once they've started their attempt, so a
--     student can't read the questions early or find the mark scheme.
--   * Students can't write attempts or answers directly either. The timer
--     is enforced in the functions below, where the student can't bend it.
--   * Only the class's teachers (owner / co-teacher / same school - whatever
--     is_class_teacher() says) can set, view and mark an assessment.

-- ============================================================ question bank
CREATE TABLE public.assessment_questions (
  id text PRIMARY KEY,
  track public.track NOT NULL DEFAULT 'gcse',
  board text NOT NULL CHECK (board IN ('ocr', 'aqa')),
  topic text NOT NULL,
  marks int NOT NULL CHECK (marks BETWEEN 1 AND 12),
  -- 1 = accessible, 2 = core, 3 = stretch. Marks rise with demand, as in a
  -- real paper: a recall question is 1-2 marks, extended code 6-8.
  ability int NOT NULL CHECK (ability BETWEEN 1 AND 3),
  answer_format text NOT NULL DEFAULT 'text' CHECK (answer_format IN ('text', 'code')),
  question text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assessment_questions_lookup ON public.assessment_questions (track, board, topic);

CREATE TABLE public.assessment_mark_points (
  question_id text NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  position int NOT NULL,
  text text NOT NULL,
  marks int NOT NULL DEFAULT 1 CHECK (marks > 0),
  -- "Accept ...", "Do not accept ..." notes the marker needs alongside the point.
  guidance text NOT NULL DEFAULT '',
  PRIMARY KEY (question_id, position)
);

GRANT SELECT ON public.assessment_questions, public.assessment_mark_points TO authenticated;
GRANT ALL ON public.assessment_questions, public.assessment_mark_points TO service_role;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_mark_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teachers read question bank" ON public.assessment_questions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "teachers read mark schemes" ON public.assessment_mark_points FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- ============================================================ assessments
CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  instructions text NOT NULL DEFAULT '',
  board text NOT NULL CHECK (board IN ('ocr', 'aqa')),
  topics text[] NOT NULL DEFAULT '{}',
  time_limit_minutes int NOT NULL CHECK (time_limit_minutes BETWEEN 5 AND 240),
  -- Denormalised when the paper is built so students (who can't read the
  -- question tables) can still be told "12 questions, 40 marks".
  question_count int NOT NULL DEFAULT 0,
  total_marks int NOT NULL DEFAULT 0,
  -- The window in which a student may START. Someone who has started can
  -- always finish their time even if the window closes meanwhile.
  opens_at timestamptz,
  closes_at timestamptz,
  results_released boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assessments_class ON public.assessments (class_id);

-- The fixed paper: the same questions, in the same order, for every student.
CREATE TABLE public.assessment_items (
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  position int NOT NULL,
  question_id text NOT NULL REFERENCES public.assessment_questions(id),
  PRIMARY KEY (assessment_id, position),
  UNIQUE (assessment_id, question_id)
);

CREATE TABLE public.assessment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  marked_at timestamptz,
  UNIQUE (assessment_id, student_id)
);
CREATE INDEX assessment_attempts_student ON public.assessment_attempts (student_id);

CREATE TABLE public.assessment_answers (
  attempt_id uuid NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  question_id text NOT NULL REFERENCES public.assessment_questions(id),
  answer text NOT NULL DEFAULT '',
  teacher_comment text NOT NULL DEFAULT '',
  -- The question's score after marking, already capped at its marks (so an
  -- "any 2 from 4" scheme can't award 4).
  marks_awarded int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (attempt_id, question_id)
);

-- One row per mark-scheme point the teacher has ruled on. `marks` is copied
-- from the point at the time, so later edits to the question bank can't
-- silently change marking that's already been done.
CREATE TABLE public.assessment_marks (
  attempt_id uuid NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  position int NOT NULL,
  awarded boolean NOT NULL,
  marks int NOT NULL,
  PRIMARY KEY (attempt_id, question_id, position)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.assessment_items TO authenticated;
GRANT SELECT ON public.assessment_attempts, public.assessment_answers, public.assessment_marks TO authenticated;
GRANT ALL ON public.assessments, public.assessment_items, public.assessment_attempts,
  public.assessment_answers, public.assessment_marks TO service_role;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_marks ENABLE ROW LEVEL SECURITY;

-- Students see the assessments set for their classes (title, time, window -
-- never the questions); teachers see and manage their classes'.
CREATE POLICY "assessments readable" ON public.assessments FOR SELECT TO authenticated
  USING (
    public.is_class_teacher(class_id, auth.uid())
    OR public.is_class_member(class_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "teachers set assessments" ON public.assessments FOR INSERT TO authenticated
  WITH CHECK (public.is_class_teacher(class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "teachers update assessments" ON public.assessments FOR UPDATE TO authenticated
  USING (public.is_class_teacher(class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_class_teacher(class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "teachers delete assessments" ON public.assessments FOR DELETE TO authenticated
  USING (public.is_class_teacher(class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "teachers read paper" ON public.assessment_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id
    AND (public.is_class_teacher(a.class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "teachers build paper" ON public.assessment_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id
    AND (public.is_class_teacher(a.class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "teachers edit paper" ON public.assessment_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id
    AND (public.is_class_teacher(a.class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY "attempts readable" ON public.assessment_attempts FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id
      AND (public.is_class_teacher(a.class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')))
  );
CREATE POLICY "teachers read answers" ON public.assessment_answers FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assessment_attempts t JOIN public.assessments a ON a.id = t.assessment_id
    WHERE t.id = attempt_id
      AND (public.is_class_teacher(a.class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "teachers read marks" ON public.assessment_marks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assessment_attempts t JOIN public.assessments a ON a.id = t.assessment_id
    WHERE t.id = attempt_id
      AND (public.is_class_teacher(a.class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))));

-- ============================================================ timer rules
-- How long after the deadline a save / submit is still accepted, so the
-- final autosave and the automatic submit at 0:00 aren't lost to latency.
CREATE OR REPLACE FUNCTION public.assessment_grace() RETURNS interval
LANGUAGE sql IMMUTABLE AS $$ SELECT interval '45 seconds' $$;

CREATE OR REPLACE FUNCTION public.assessment_deadline(_attempt_id uuid) RETURNS timestamptz
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.started_at + make_interval(mins => a.time_limit_minutes)
  FROM public.assessment_attempts t JOIN public.assessments a ON a.id = t.assessment_id
  WHERE t.id = _attempt_id
$$;
REVOKE ALL ON FUNCTION public.assessment_deadline(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assessment_deadline(uuid) TO authenticated;

-- ============================================================ student side
-- Begin (or resume) an attempt. Starting is what starts the clock. A second
-- call returns the existing attempt with its original start time - the timer
-- can't be reset by reloading or by starting again.
CREATE OR REPLACE FUNCTION public.start_assessment(_assessment_id uuid)
RETURNS TABLE (attempt_id uuid, started_at timestamptz, deadline timestamptz, submitted_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a public.assessments%ROWTYPE;
  t public.assessment_attempts%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO a FROM public.assessments WHERE id = _assessment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Assessment not found'; END IF;
  IF NOT public.is_class_member(a.class_id, auth.uid()) THEN
    RAISE EXCEPTION 'You are not in this class';
  END IF;

  SELECT * INTO t FROM public.assessment_attempts
    WHERE assessment_id = _assessment_id AND student_id = auth.uid();
  IF NOT FOUND THEN
    IF a.opens_at IS NOT NULL AND now() < a.opens_at THEN
      RAISE EXCEPTION 'This assessment has not opened yet';
    END IF;
    IF a.closes_at IS NOT NULL AND now() > a.closes_at THEN
      RAISE EXCEPTION 'This assessment has closed';
    END IF;
    IF a.question_count = 0 THEN
      RAISE EXCEPTION 'This assessment has no questions';
    END IF;
    INSERT INTO public.assessment_attempts (assessment_id, student_id)
      VALUES (_assessment_id, auth.uid()) RETURNING * INTO t;
  END IF;

  RETURN QUERY SELECT t.id, t.started_at,
    t.started_at + make_interval(mins => a.time_limit_minutes), t.submitted_at;
END;
$$;
REVOKE ALL ON FUNCTION public.start_assessment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_assessment(uuid) TO authenticated;

-- The student's paper: the questions (never the mark scheme) and whatever
-- they've saved so far. Only for their own attempt.
CREATE OR REPLACE FUNCTION public.assessment_paper(_attempt_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.assessment_attempts%ROWTYPE;
  a public.assessments%ROWTYPE;
BEGIN
  SELECT * INTO t FROM public.assessment_attempts WHERE id = _attempt_id AND student_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Attempt not found'; END IF;
  SELECT * INTO a FROM public.assessments WHERE id = t.assessment_id;
  RETURN jsonb_build_object(
    'title', a.title,
    'instructions', a.instructions,
    'board', a.board,
    'time_limit_minutes', a.time_limit_minutes,
    'total_marks', a.total_marks,
    'started_at', t.started_at,
    'deadline', t.started_at + make_interval(mins => a.time_limit_minutes),
    'submitted_at', t.submitted_at,
    -- The server's clock, so the student's countdown follows it and not a
    -- device clock that's wrong (which would give too much or too little time).
    'server_now', now(),
    'questions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'position', i.position,
        'question_id', q.id,
        'marks', q.marks,
        'answer_format', q.answer_format,
        'question', q.question,
        'answer', COALESCE(ans.answer, '')
      ) ORDER BY i.position)
      FROM public.assessment_items i
      JOIN public.assessment_questions q ON q.id = i.question_id
      LEFT JOIN public.assessment_answers ans ON ans.attempt_id = t.id AND ans.question_id = q.id
      WHERE i.assessment_id = a.id
    ), '[]'::jsonb)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.assessment_paper(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assessment_paper(uuid) TO authenticated;

-- Autosave one answer. Refused once submitted or after the time is up (plus
-- a short grace for the final autosave in flight).
CREATE OR REPLACE FUNCTION public.save_assessment_answer(_attempt_id uuid, _question_id text, _answer text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.assessment_attempts%ROWTYPE;
BEGIN
  SELECT * INTO t FROM public.assessment_attempts WHERE id = _attempt_id AND student_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Attempt not found'; END IF;
  IF t.submitted_at IS NOT NULL THEN RAISE EXCEPTION 'This assessment has already been submitted'; END IF;
  IF now() > public.assessment_deadline(t.id) + public.assessment_grace() THEN
    RAISE EXCEPTION 'Time is up';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.assessment_items WHERE assessment_id = t.assessment_id AND question_id = _question_id) THEN
    RAISE EXCEPTION 'That question is not part of this assessment';
  END IF;
  IF length(_answer) > 20000 THEN RAISE EXCEPTION 'Answer is too long'; END IF;
  INSERT INTO public.assessment_answers (attempt_id, question_id, answer, updated_at)
    VALUES (_attempt_id, _question_id, _answer, now())
  ON CONFLICT (attempt_id, question_id) DO UPDATE SET answer = EXCLUDED.answer, updated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION public.save_assessment_answer(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_assessment_answer(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_assessment(_attempt_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.assessment_attempts SET submitted_at = now()
  WHERE id = _attempt_id AND student_id = auth.uid() AND submitted_at IS NULL;
  IF NOT FOUND AND NOT EXISTS (
    SELECT 1 FROM public.assessment_attempts WHERE id = _attempt_id AND student_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_assessment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_assessment(uuid) TO authenticated;

-- What a student sees of their own marked work: per question, marks out of
-- marks and the teacher's comment - once the teacher has marked it AND
-- released results. Never the mark scheme.
CREATE OR REPLACE FUNCTION public.my_assessment_result(_attempt_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.assessment_attempts%ROWTYPE;
  a public.assessments%ROWTYPE;
BEGIN
  SELECT * INTO t FROM public.assessment_attempts WHERE id = _attempt_id AND student_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Attempt not found'; END IF;
  SELECT * INTO a FROM public.assessments WHERE id = t.assessment_id;
  IF NOT a.results_released OR t.marked_at IS NULL THEN
    RETURN jsonb_build_object('available', false);
  END IF;
  RETURN jsonb_build_object(
    'available', true,
    'total_marks', a.total_marks,
    'marks_awarded', COALESCE((SELECT sum(marks_awarded) FROM public.assessment_answers WHERE attempt_id = t.id), 0),
    'questions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'position', i.position,
        'question', q.question,
        'marks', q.marks,
        'answer', COALESCE(ans.answer, ''),
        'marks_awarded', COALESCE(ans.marks_awarded, 0),
        'comment', COALESCE(ans.teacher_comment, '')
      ) ORDER BY i.position)
      FROM public.assessment_items i
      JOIN public.assessment_questions q ON q.id = i.question_id
      LEFT JOIN public.assessment_answers ans ON ans.attempt_id = t.id AND ans.question_id = q.id
      WHERE i.assessment_id = a.id
    ), '[]'::jsonb)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.my_assessment_result(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_assessment_result(uuid) TO authenticated;

-- ============================================================ teacher side
-- Record the teacher's YES/NO for each mark-scheme point of one answer.
-- `_points` is [{"position": 1, "awarded": true}, ...]; a point not listed
-- counts as NO. The question's score is the sum of awarded points' marks,
-- capped at the question's marks. Only once the attempt is finished (handed
-- in, or its time has run out) - never while the student is still writing.
CREATE OR REPLACE FUNCTION public.mark_assessment_answer(
  _attempt_id uuid, _question_id text, _points jsonb, _comment text
) RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.assessment_attempts%ROWTYPE;
  a public.assessments%ROWTYPE;
  q public.assessment_questions%ROWTYPE;
  earned int;
BEGIN
  SELECT * INTO t FROM public.assessment_attempts WHERE id = _attempt_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Attempt not found'; END IF;
  SELECT * INTO a FROM public.assessments WHERE id = t.assessment_id;
  IF NOT (public.is_class_teacher(a.class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Only this class''s teachers can mark it';
  END IF;
  IF t.submitted_at IS NULL AND now() <= public.assessment_deadline(t.id) + public.assessment_grace() THEN
    RAISE EXCEPTION 'The student is still working on this assessment';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.assessment_items WHERE assessment_id = a.id AND question_id = _question_id) THEN
    RAISE EXCEPTION 'That question is not part of this assessment';
  END IF;
  SELECT * INTO q FROM public.assessment_questions WHERE id = _question_id;

  DELETE FROM public.assessment_marks WHERE attempt_id = _attempt_id AND question_id = _question_id;
  INSERT INTO public.assessment_marks (attempt_id, question_id, position, awarded, marks)
  SELECT _attempt_id, p.question_id, p.position,
         COALESCE((SELECT (e->>'awarded')::boolean FROM jsonb_array_elements(COALESCE(_points, '[]'::jsonb)) e
                   WHERE (e->>'position')::int = p.position LIMIT 1), false),
         p.marks
  FROM public.assessment_mark_points p WHERE p.question_id = _question_id;

  SELECT COALESCE(sum(marks), 0) INTO earned FROM public.assessment_marks
    WHERE attempt_id = _attempt_id AND question_id = _question_id AND awarded;
  earned := LEAST(earned, q.marks);

  -- A student who left it blank has no answer row yet; marking still needs one.
  INSERT INTO public.assessment_answers (attempt_id, question_id, answer, teacher_comment, marks_awarded)
    VALUES (_attempt_id, _question_id, '', COALESCE(_comment, ''), earned)
  ON CONFLICT (attempt_id, question_id)
    DO UPDATE SET teacher_comment = COALESCE(_comment, ''), marks_awarded = earned;
  RETURN earned;
END;
$$;
REVOKE ALL ON FUNCTION public.mark_assessment_answer(uuid, text, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_assessment_answer(uuid, text, jsonb, text) TO authenticated;

-- Mark an attempt as fully marked (or reopen it).
CREATE OR REPLACE FUNCTION public.set_assessment_marked(_attempt_id uuid, _marked boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.assessment_attempts%ROWTYPE;
  a public.assessments%ROWTYPE;
BEGIN
  SELECT * INTO t FROM public.assessment_attempts WHERE id = _attempt_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Attempt not found'; END IF;
  SELECT * INTO a FROM public.assessments WHERE id = t.assessment_id;
  IF NOT (public.is_class_teacher(a.class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Only this class''s teachers can mark it';
  END IF;
  UPDATE public.assessment_attempts SET marked_at = CASE WHEN _marked THEN now() ELSE NULL END
    WHERE id = _attempt_id;
END;
$$;
REVOKE ALL ON FUNCTION public.set_assessment_marked(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_assessment_marked(uuid, boolean) TO authenticated;
