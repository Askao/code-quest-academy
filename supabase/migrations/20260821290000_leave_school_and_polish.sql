-- Leaving a school used to be two plain client-side updates (see
-- src/lib/school.ts's old attachToSchool-style logic). That's fine for an
-- ordinary teacher leaving, but the school's creator leaving needs a
-- bigger, atomic action: delete the school outright and detach every
-- other teacher and class in it too - same end state as if each of them
-- had individually left, done in one transaction so it can't half-apply,
-- and gated so only the actual creator can trigger the cascade.
CREATE OR REPLACE FUNCTION public.leave_school(_school_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  owner_id uuid;
BEGIN
  SELECT created_by INTO owner_id FROM public.schools WHERE id = _school_id;
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'School not found';
  END IF;

  IF owner_id = auth.uid() THEN
    UPDATE public.classes SET school_id = NULL WHERE school_id = _school_id;
    UPDATE public.profiles SET school_id = NULL WHERE school_id = _school_id;
    DELETE FROM public.schools WHERE id = _school_id;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = _school_id
    ) THEN
      RAISE EXCEPTION 'You are not part of this school';
    END IF;
    UPDATE public.classes SET school_id = NULL WHERE school_id = _school_id AND teacher_id = auth.uid();
    UPDATE public.profiles SET school_id = NULL WHERE id = auth.uid();
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.leave_school(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leave_school(uuid) TO authenticated;
