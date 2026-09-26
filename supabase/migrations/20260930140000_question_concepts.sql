-- Papers shouldn't contain questions that feel like repeats. Each question now
-- carries a "concept" - what it is really testing, finer than its topic (for
-- example "authentication", "binary-search", "loop-trace") - and revision
-- papers avoid putting two questions with the same concept on one paper, and
-- spread themselves across topics, whenever the pool allows. If it doesn't
-- (a student asks for 20 questions on a topic that only has 5 concepts) the
-- paper is still filled, using the repeats last.
--
-- The column is also in the assessments table definition, so a fresh database
-- has it before the question seed runs; this makes it exist on one that was
-- set up before. Re-run the regenerated question seed after applying this to
-- fill the concepts in.
ALTER TABLE public.assessment_questions ADD COLUMN IF NOT EXISTS concept text;

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

  -- Every question that could go on the paper, with:
  --   fill   the order a question is used when filling the paper:
  --          0 never seen, 1 lost marks on it before, 2 got it right before
  --   crank  1 for the best question of its concept, 2+ for the rest (so a
  --          concept is only used a second time once every concept has been
  --          used). "Best" means a missed question first - except for a 'new'
  --          paper, where it means an unseen one.
  --   trank  the question's turn within its topic (so topics take turns)
  CREATE TEMP TABLE _cand ON COMMIT DROP AS
  SELECT x.*,
         row_number() OVER (PARTITION BY x.topic ORDER BY x.crank, x.fill, x.r) AS trank
  FROM (
    SELECT y.*,
           row_number() OVER (
             PARTITION BY COALESCE(y.concept, y.id)
             ORDER BY CASE WHEN _focus = 'new' THEN y.fill ELSE y.tier END, y.fraction NULLS LAST, y.r
           ) AS crank
    FROM (
      SELECT q.id, q.marks, q.ability, q.topic, q.concept, h.fraction, h.seen_at,
             (h.fraction IS NOT NULL AND h.fraction < 1) AS missed,
             (h.question_id IS NULL) AS unseen,
             CASE WHEN h.fraction IS NOT NULL AND h.fraction < 1 THEN 0
                  WHEN h.question_id IS NULL THEN 1 ELSE 2 END AS tier,
             CASE WHEN h.question_id IS NULL THEN 0
                  WHEN h.fraction < 1 THEN 1 ELSE 2 END AS fill,
             random() AS r
      FROM public.assessment_questions q
      LEFT JOIN public.revision_history() h ON h.question_id = q.id
      WHERE q.track = 'gcse' AND q.board = _board
        AND (cardinality(topics_in) = 0 OR q.topic = ANY (topics_in))
        AND NOT public.revision_embargoed(q.id)
    ) y
  ) x;

  IF NOT EXISTS (SELECT 1 FROM _cand) THEN
    RAISE EXCEPTION 'There are no questions for that choice yet';
  END IF;

  CREATE TEMP TABLE _pick (id text PRIMARY KEY, was_weak boolean) ON COMMIT DROP;
  -- 1. Questions they lost marks on - one per concept, topics taking turns.
  INSERT INTO _pick
  SELECT id, true FROM _cand WHERE missed AND crank = 1
  ORDER BY trank, fraction ASC, r LIMIT weak_target;
  -- 2. Fill the rest with a different concept each: never-seen first, then
  --    other misses, then ones they got right (longest ago first).
  INSERT INTO _pick
  SELECT c.id, c.missed FROM _cand c
  WHERE c.crank = 1 AND c.id NOT IN (SELECT id FROM _pick)
  ORDER BY c.fill, c.trank,
           CASE WHEN c.fill = 2 THEN extract(epoch FROM c.seen_at) END ASC,
           c.r
  LIMIT (n_target - (SELECT count(*) FROM _pick));
  -- 3. Only if there still aren't enough: allow a second question from a concept.
  INSERT INTO _pick
  SELECT c.id, c.missed FROM _cand c
  WHERE c.id NOT IN (SELECT id FROM _pick)
  ORDER BY c.crank, c.fill, c.trank, c.r
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
