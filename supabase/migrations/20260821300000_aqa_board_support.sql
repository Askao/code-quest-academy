-- Multi-board GCSE support: a class can now be OCR (unchanged default) or
-- AQA. This only matters for GCSE - A level classes get 'ocr' too, but the
-- value is meaningless there since no A level UI ever reads it.
--
-- Deliberately just one new column, not a parallel content set: OCR and AQA
-- both let a school teach in real Python and test general programming
-- skill in substance the same way, so the whole existing GCSE task bank
-- stays valid for both boards. The one genuine gap is AQA's relational
-- databases & SQL requirement, which OCR doesn't have at all - that's
-- handled as a new topic ("databases") gated to board = 'aqa', not a
-- rewrite of anything that already exists.
ALTER TABLE public.classes
  ADD COLUMN board text NOT NULL DEFAULT 'ocr' CHECK (board IN ('ocr', 'aqa'));

-- class_for_join_code() is what the pre-signup join page (join/$code) reads
-- - it needs board alongside track for the same reason it already returns
-- track: so an invitee sees which exam board the class is before joining.
CREATE OR REPLACE FUNCTION public.class_for_join_code(_code text)
RETURNS TABLE(id uuid, name text, track public.track, board text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, track, board FROM public.classes WHERE join_code = _code
$$;
REVOKE ALL ON FUNCTION public.class_for_join_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.class_for_join_code(text) TO anon, authenticated;
