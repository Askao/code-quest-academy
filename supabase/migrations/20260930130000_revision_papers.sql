-- Revision papers: a student builds their own exam-style paper from the
-- assessment question bank, sits it, marks it themselves against the mark
-- scheme, and the results are saved. Papers lean on questions the student has
-- got wrong before (in a teacher-marked assessment or an earlier revision
-- paper), so revision goes where the marks were lost.
--
-- The bank and mark schemes are teacher-only tables (see the assessments
-- migration), and stay that way. Students reach them only through the
-- functions below, which enforce:
--   * a paper is built on the server, so the student can't hand-pick the
--     questions that reveal a mark scheme
--   * the mark scheme is shown only AFTER the paper is submitted - marking
--     honestly means committing to an answer first
--   * questions from a teacher-set assessment that hasn't had its results
--     released yet are never offered, so revision can't be used to read the
--     mark scheme of a live assessment
--   * a student sees only their own papers.
-- Teachers have no access to revision papers: it's the student's own practice.

-- ============================================================ tables
CREATE TABLE public.revision_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  board text NOT NULL CHECK (board IN ('ocr', 'aqa')),
  topics text[] NOT NULL DEFAULT '{}',
  focus text NOT NULL DEFAULT 'smart' CHECK (focus IN ('smart', 'weak', 'new')),
  -- Optional practice timer. Self-paced revision, so it is shown to the
  -- student but not enforced by the server.
  time_limit_minutes int CHECK (time_limit_minutes BETWEEN 5 AND 240),
  question_count int NOT NULL DEFAULT 0,
  total_marks int NOT NULL DEFAULT 0,
  -- How many questions are repeats of ones they lost marks on before.
  weak_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  submitted_at timestamptz,
  marked_at timestamptz
);
CREATE INDEX revision_papers_student ON public.revision_papers (student_id, created_at DESC);

CREATE TABLE public.revision_items (
  paper_id uuid NOT NULL REFERENCES public.revision_papers(id) ON DELETE CASCADE,
  position int NOT NULL,
  question_id text NOT NULL REFERENCES public.assessment_questions(id),
  was_weak boolean NOT NULL DEFAULT false,
  PRIMARY KEY (paper_id, position),
  UNIQUE (paper_id, question_id)
);

CREATE TABLE public.revision_answers (
  paper_id uuid NOT NULL REFERENCES public.revision_papers(id) ON DELETE CASCADE,
  question_id text NOT NULL REFERENCES public.assessment_questions(id),
  answer text NOT NULL DEFAULT '',
  marked boolean NOT NULL DEFAULT false,
  -- The student's own score, already capped at the question's marks.
  marks_awarded int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (paper_id, question_id)
);

CREATE TABLE public.revision_marks (
  paper_id uuid NOT NULL REFERENCES public.revision_papers(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  position int NOT NULL,
  awarded boolean NOT NULL,
  marks int NOT NULL,
  PRIMARY KEY (paper_id, question_id, position)
);

GRANT SELECT, DELETE ON public.revision_papers TO authenticated;
GRANT SELECT ON public.revision_items, public.revision_answers, public.revision_marks TO authenticated;
GRANT ALL ON public.revision_papers, public.revision_items, public.revision_answers, public.revision_marks TO service_role;
ALTER TABLE public.revision_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_marks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own revision papers" ON public.revision_papers FOR SELECT TO authenticated
  USING (student_id = auth.uid());
CREATE POLICY "delete own revision papers" ON public.revision_papers FOR DELETE TO authenticated
  USING (student_id = auth.uid());
CREATE POLICY "own revision items" ON public.revision_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.revision_papers p WHERE p.id = paper_id AND p.student_id = auth.uid()));
CREATE POLICY "own revision answers" ON public.revision_answers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.revision_papers p WHERE p.id = paper_id AND p.student_id = auth.uid()));
CREATE POLICY "own revision marks" ON public.revision_marks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.revision_papers p WHERE p.id = paper_id AND p.student_id = auth.uid()));

-- ============================================================ history
-- How the caller did the last time they met each question: the fraction of the
-- marks they got, from released teacher-marked assessments and from their own
-- self-marked revision papers. One row per question (the most recent result).
CREATE OR REPLACE FUNCTION public.revision_history() RETURNS TABLE (
  question_id text, fraction numeric, seen_at timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT ON (r.question_id) r.question_id, r.fraction, r.seen_at
  FROM (
    SELECT ans.question_id,
           LEAST(1, GREATEST(0, ans.marks_awarded::numeric / q.marks)) AS fraction,
           t.marked_at AS seen_at
    FROM public.assessment_attempts t
    JOIN public.assessments a ON a.id = t.assessment_id AND a.results_released
    JOIN public.assessment_answers ans ON ans.attempt_id = t.id
    JOIN public.assessment_questions q ON q.id = ans.question_id
    WHERE t.student_id = auth.uid() AND t.marked_at IS NOT NULL
    UNION ALL
    SELECT ans.question_id,
           LEAST(1, GREATEST(0, ans.marks_awarded::numeric / q.marks)),
           ans.updated_at
    FROM public.revision_papers p
    JOIN public.revision_answers ans ON ans.paper_id = p.id AND ans.marked
    JOIN public.assessment_questions q ON q.id = ans.question_id
    WHERE p.student_id = auth.uid()
  ) r
  ORDER BY r.question_id, r.seen_at DESC
$$;
REVOKE ALL ON FUNCTION public.revision_history() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revision_history() TO authenticated;

-- Questions a revision paper must not offer: any that is part of an
-- assessment set for one of the caller's classes whose results are not yet
-- released (it may be live, or awaiting marking).
CREATE OR REPLACE FUNCTION public.revision_embargoed(_question_id text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.assessment_items i
    JOIN public.assessments a ON a.id = i.assessment_id
    WHERE i.question_id = _question_id
      AND NOT a.results_released
      AND public.is_class_member(a.class_id, auth.uid())
  )
$$;
REVOKE ALL ON FUNCTION public.revision_embargoed(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revision_embargoed(text) TO authenticated;

-- What the builder shows: per topic for a board, how many questions there
-- are, how many the caller lost marks on last time, and how many they have
-- never seen.
CREATE OR REPLACE FUNCTION public.revision_topics(_board text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'topic', s.topic, 'available', s.available, 'missed', s.missed, 'unseen', s.unseen
  ) ORDER BY s.topic), '[]'::jsonb)
  FROM (
    SELECT q.topic,
           count(*) AS available,
           count(*) FILTER (WHERE h.fraction < 1) AS missed,
           count(*) FILTER (WHERE h.question_id IS NULL) AS unseen
    FROM public.assessment_questions q
    LEFT JOIN public.revision_history() h ON h.question_id = q.id
    WHERE q.track = 'gcse' AND q.board = _board
      AND NOT public.revision_embargoed(q.id)
    GROUP BY q.topic
  ) s
$$;
REVOKE ALL ON FUNCTION public.revision_topics(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revision_topics(text) TO authenticated;

-- ============================================================ building
-- Build a paper for the caller. `_focus`:
--   smart - about 70% questions they lost marks on before (as many as exist),
--           the rest new to them, then anything left
--   weak  - as many previously-missed questions as possible
--   new   - questions they have not seen first
-- Whatever the focus, the paper is filled to `_count` from what is available,
-- so a student with no history simply gets a paper of new questions. Questions
-- come out in rising order of difficulty, like a real paper.
CREATE OR REPLACE FUNCTION public.create_revision_paper(
  _board text, _topics text[], _count int, _focus text, _title text, _minutes int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  n_target int;
  weak_target int;
  pid uuid;
  picked int;
  weak_n int;
  marks_n int;
  topics_in text[] := COALESCE(_topics, '{}');
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF _board NOT IN ('ocr', 'aqa') THEN RAISE EXCEPTION 'Choose OCR or AQA'; END IF;
  IF _focus NOT IN ('smart', 'weak', 'new') THEN RAISE EXCEPTION 'Unknown focus'; END IF;
  n_target := COALESCE(_count, 10);
  IF n_target < 3 OR n_target > 30 THEN RAISE EXCEPTION 'A paper has 3 to 30 questions'; END IF;
  -- NULL = no timer; 0 = "like an exam": about a minute a mark, worked out below.
  IF _minutes IS NOT NULL AND _minutes <> 0 AND (_minutes < 5 OR _minutes > 240) THEN
    RAISE EXCEPTION 'The timer must be 5 to 240 minutes';
  END IF;

  weak_target := CASE _focus WHEN 'weak' THEN n_target WHEN 'smart' THEN ceil(n_target * 0.7)::int ELSE 0 END;

  CREATE TEMP TABLE _cand ON COMMIT DROP AS
  SELECT q.id, q.marks, q.ability, h.fraction, h.seen_at,
         (h.fraction IS NOT NULL AND h.fraction < 1) AS missed,
         (h.question_id IS NULL) AS unseen,
         random() AS r
  FROM public.assessment_questions q
  LEFT JOIN public.revision_history() h ON h.question_id = q.id
  WHERE q.track = 'gcse' AND q.board = _board
    AND (cardinality(topics_in) = 0 OR q.topic = ANY (topics_in))
    AND NOT public.revision_embargoed(q.id);

  IF NOT EXISTS (SELECT 1 FROM _cand) THEN
    RAISE EXCEPTION 'There are no questions for that choice yet';
  END IF;

  CREATE TEMP TABLE _pick (id text PRIMARY KEY, was_weak boolean) ON COMMIT DROP;
  -- 1. Questions they lost marks on, worst first.
  INSERT INTO _pick
  SELECT id, true FROM _cand WHERE missed ORDER BY fraction ASC, r LIMIT weak_target;
  -- 2. Fill the rest: never-seen first, then leftover misses, then ones they
  --    got right (longest ago first).
  INSERT INTO _pick
  SELECT c.id, c.missed FROM _cand c
  WHERE c.id NOT IN (SELECT id FROM _pick)
  ORDER BY CASE WHEN c.unseen THEN 0 WHEN c.missed THEN 1 ELSE 2 END,
           CASE WHEN NOT c.unseen AND NOT c.missed THEN extract(epoch FROM c.seen_at) END ASC,
           c.r
  LIMIT (n_target - (SELECT count(*) FROM _pick));

  SELECT count(*), count(*) FILTER (WHERE was_weak) INTO picked, weak_n FROM _pick;
  SELECT COALESCE(sum(c.marks), 0) INTO marks_n FROM _cand c JOIN _pick p ON p.id = c.id;

  INSERT INTO public.revision_papers
    (student_id, title, board, topics, focus, time_limit_minutes, question_count, total_marks, weak_count)
  VALUES (uid, COALESCE(NULLIF(btrim(_title), ''), 'Revision paper'), _board, topics_in, _focus,
          CASE WHEN _minutes = 0 THEN LEAST(240, GREATEST(10, (round(marks_n * 1.1 / 5) * 5)::int)) ELSE _minutes END,
          picked, marks_n, weak_n)
  RETURNING id INTO pid;

  INSERT INTO public.revision_items (paper_id, position, question_id, was_weak)
  SELECT pid, row_number() OVER (ORDER BY c.ability, c.r), c.id, p.was_weak
  FROM _cand c JOIN _pick p ON p.id = c.id;

  RETURN jsonb_build_object('paper_id', pid, 'questions', picked, 'weak', weak_n, 'marks', marks_n);
END;
$$;
REVOKE ALL ON FUNCTION public.create_revision_paper(text, text[], int, text, text, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_revision_paper(text, text[], int, text, text, int) TO authenticated;

-- ============================================================ sitting
-- Open a paper: the questions, the student's saved answers, and - once it has
-- been submitted - the mark scheme with any marking done so far. Opening a
-- paper for the first time starts its (optional) timer.
CREATE OR REPLACE FUNCTION public.open_revision_paper(_paper_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.revision_papers%ROWTYPE;
BEGIN
  SELECT * INTO p FROM public.revision_papers WHERE id = _paper_id AND student_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Paper not found'; END IF;
  IF p.started_at IS NULL THEN
    UPDATE public.revision_papers SET started_at = now() WHERE id = p.id RETURNING * INTO p;
  END IF;
  RETURN jsonb_build_object(
    'id', p.id,
    'title', p.title,
    'board', p.board,
    'topics', to_jsonb(p.topics),
    'time_limit_minutes', p.time_limit_minutes,
    'total_marks', p.total_marks,
    'weak_count', p.weak_count,
    'started_at', p.started_at,
    'submitted_at', p.submitted_at,
    'marked_at', p.marked_at,
    'server_now', now(),
    'questions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'position', i.position,
        'question_id', q.id,
        'topic', q.topic,
        'ability', q.ability,
        'marks', q.marks,
        'answer_format', q.answer_format,
        'question', q.question,
        'was_weak', i.was_weak,
        'answer', COALESCE(ans.answer, ''),
        'marked', COALESCE(ans.marked, false),
        'marks_awarded', COALESCE(ans.marks_awarded, 0),
        'mark_scheme', CASE WHEN p.submitted_at IS NULL THEN NULL ELSE COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'position', mp.position,
            'text', mp.text,
            'marks', mp.marks,
            'guidance', mp.guidance,
            'awarded', (SELECT m.awarded FROM public.revision_marks m
                        WHERE m.paper_id = p.id AND m.question_id = q.id AND m.position = mp.position)
          ) ORDER BY mp.position)
          FROM public.assessment_mark_points mp WHERE mp.question_id = q.id
        ), '[]'::jsonb) END
      ) ORDER BY i.position)
      FROM public.revision_items i
      JOIN public.assessment_questions q ON q.id = i.question_id
      LEFT JOIN public.revision_answers ans ON ans.paper_id = p.id AND ans.question_id = q.id
      WHERE i.paper_id = p.id
    ), '[]'::jsonb)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.open_revision_paper(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.open_revision_paper(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_revision_answer(_paper_id uuid, _question_id text, _answer text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.revision_papers%ROWTYPE;
BEGIN
  SELECT * INTO p FROM public.revision_papers WHERE id = _paper_id AND student_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Paper not found'; END IF;
  IF p.submitted_at IS NOT NULL THEN RAISE EXCEPTION 'This paper has already been handed in'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.revision_items WHERE paper_id = p.id AND question_id = _question_id) THEN
    RAISE EXCEPTION 'That question is not part of this paper';
  END IF;
  IF length(_answer) > 20000 THEN RAISE EXCEPTION 'Answer is too long'; END IF;
  INSERT INTO public.revision_answers (paper_id, question_id, answer, updated_at)
    VALUES (p.id, _question_id, _answer, now())
  ON CONFLICT (paper_id, question_id) DO UPDATE SET answer = EXCLUDED.answer, updated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION public.save_revision_answer(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_revision_answer(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_revision_paper(_paper_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.revision_papers SET submitted_at = now()
  WHERE id = _paper_id AND student_id = auth.uid() AND submitted_at IS NULL;
  IF NOT FOUND AND NOT EXISTS (
    SELECT 1 FROM public.revision_papers WHERE id = _paper_id AND student_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Paper not found';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_revision_paper(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_revision_paper(uuid) TO authenticated;

-- ============================================================ self-marking
-- Record the student's YES/NO on each mark-scheme point of one answer, exactly
-- as a teacher would in mark_assessment_answer: `_points` is
-- [{"position": 1, "awarded": true}, ...], a point not listed counts as NO, and
-- the score is capped at the question's marks. Only after the paper is handed
-- in. When every question has been marked the paper is marked as finished.
CREATE OR REPLACE FUNCTION public.mark_revision_question(_paper_id uuid, _question_id text, _points jsonb)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.revision_papers%ROWTYPE;
  q public.assessment_questions%ROWTYPE;
  earned int;
BEGIN
  SELECT * INTO p FROM public.revision_papers WHERE id = _paper_id AND student_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Paper not found'; END IF;
  IF p.submitted_at IS NULL THEN RAISE EXCEPTION 'Hand the paper in before marking it'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.revision_items WHERE paper_id = p.id AND question_id = _question_id) THEN
    RAISE EXCEPTION 'That question is not part of this paper';
  END IF;
  SELECT * INTO q FROM public.assessment_questions WHERE id = _question_id;

  DELETE FROM public.revision_marks WHERE paper_id = p.id AND question_id = _question_id;
  INSERT INTO public.revision_marks (paper_id, question_id, position, awarded, marks)
  SELECT p.id, mp.question_id, mp.position,
         COALESCE((SELECT (e->>'awarded')::boolean FROM jsonb_array_elements(COALESCE(_points, '[]'::jsonb)) e
                   WHERE (e->>'position')::int = mp.position LIMIT 1), false),
         mp.marks
  FROM public.assessment_mark_points mp WHERE mp.question_id = _question_id;

  SELECT COALESCE(sum(marks), 0) INTO earned FROM public.revision_marks
    WHERE paper_id = p.id AND question_id = _question_id AND awarded;
  earned := LEAST(earned, q.marks);

  INSERT INTO public.revision_answers (paper_id, question_id, answer, marked, marks_awarded, updated_at)
    VALUES (p.id, _question_id, '', true, earned, now())
  ON CONFLICT (paper_id, question_id)
    DO UPDATE SET marked = true, marks_awarded = earned, updated_at = now();

  IF p.marked_at IS NULL AND NOT EXISTS (
    SELECT 1 FROM public.revision_items i
    LEFT JOIN public.revision_answers a ON a.paper_id = i.paper_id AND a.question_id = i.question_id
    WHERE i.paper_id = p.id AND COALESCE(a.marked, false) = false
  ) THEN
    UPDATE public.revision_papers SET marked_at = now() WHERE id = p.id;
  END IF;
  RETURN earned;
END;
$$;
REVOKE ALL ON FUNCTION public.mark_revision_question(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_revision_question(uuid, text, jsonb) TO authenticated;

-- ============================================================ analysis
-- The caller's self-marked revision papers in the same shape as
-- my_assessment_analysis(), so the dashboard's "My results" analysis can
-- combine the two. Only papers they have finished marking.
CREATE OR REPLACE FUNCTION public.my_revision_analysis() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(s.item ORDER BY s.marked_at DESC), '[]'::jsonb)
  FROM (
    SELECT p.marked_at,
      jsonb_build_object(
        'assessment_id', p.id,
        'title', p.title,
        'board', p.board,
        'marked_at', p.marked_at,
        'total_marks', p.total_marks,
        'marks_awarded', COALESCE((SELECT sum(a.marks_awarded) FROM public.revision_answers a WHERE a.paper_id = p.id), 0),
        'questions', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'position', i.position,
            'question_id', q.id,
            'topic', q.topic,
            'ability', q.ability,
            'marks', q.marks,
            'marks_awarded', COALESCE(a.marks_awarded, 0),
            'question', q.question,
            'comment', ''
          ) ORDER BY i.position)
          FROM public.revision_items i
          JOIN public.assessment_questions q ON q.id = i.question_id
          LEFT JOIN public.revision_answers a ON a.paper_id = p.id AND a.question_id = q.id
          WHERE i.paper_id = p.id
        ), '[]'::jsonb)
      ) AS item
    FROM public.revision_papers p
    WHERE p.student_id = auth.uid() AND p.marked_at IS NOT NULL
  ) s
$$;
REVOKE ALL ON FUNCTION public.my_revision_analysis() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_revision_analysis() TO authenticated;
