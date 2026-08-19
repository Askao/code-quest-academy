-- Saved programs for the free-form /ide sandbox. Backed by the DB (not
-- localStorage) since students commonly use shared school computers - a
-- browser-only save would vanish between sessions on a different machine.
CREATE TABLE public.ide_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ide_programs TO authenticated;
GRANT ALL ON public.ide_programs TO service_role;
ALTER TABLE public.ide_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own ide programs" ON public.ide_programs FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
