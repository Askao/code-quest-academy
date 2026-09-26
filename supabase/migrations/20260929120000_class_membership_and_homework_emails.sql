-- Three things that belong together:
--
--   1. An admin can put a student in a class, or move them to another one.
--   2. A student who is in no class can join one with its join code.
--   3. A record of which homework emails have gone to which student, so the
--      "homework set" and "1 day left" emails are each sent once, however
--      often the sender runs.
--
-- Both membership changes are functions rather than open table policies: class
-- membership drives lesson gating and what a teacher sees, so each door checks
-- who is asking and what they are asking for.

-- ---------------------------------------------------------------------------
-- 1. Admin: set (or clear) a student's class.
--
-- "Set" means the student ends up in exactly that class - any other class they
-- were in is left, which is what "in the wrong one" needs. Passing NULL takes
-- them out of every class. Only accounts that are purely students can be
-- placed, so this can't be used to turn a teacher's account into a roster entry.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_student_class(_student_id uuid, _class_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  IF NOT public.has_role(_student_id, 'student')
     OR public.has_role(_student_id, 'teacher')
     OR public.has_role(_student_id, 'admin') THEN
    RAISE EXCEPTION 'Only student accounts can be put in a class';
  END IF;
  IF _class_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.classes WHERE id = _class_id) THEN
    RAISE EXCEPTION 'Class not found';
  END IF;

  DELETE FROM public.class_members
  WHERE student_id = _student_id
    AND (_class_id IS NULL OR class_id <> _class_id);

  IF _class_id IS NOT NULL THEN
    INSERT INTO public.class_members (class_id, student_id)
    VALUES (_class_id, _student_id)
    ON CONFLICT (class_id, student_id) DO NOTHING;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_student_class(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_student_class(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Student: join a class with its join code.
--
-- Only for a student who is in no class yet. Someone already in a class has to
-- be moved by their teacher or an admin - otherwise a student could hop between
-- classes and their lesson progress and homework would follow them around.
-- Teacher and admin accounts can't use it (their access to a class is a
-- different thing from being on its roster).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_class_by_code(_code text)
RETURNS TABLE (joined_id uuid, joined_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  cls public.classes%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;
  IF public.has_role(uid, 'teacher') OR public.has_role(uid, 'admin') THEN
    RAISE EXCEPTION 'Only student accounts join a class with a code';
  END IF;

  SELECT * INTO cls FROM public.classes WHERE join_code = upper(btrim(coalesce(_code, '')));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No class found with that code';
  END IF;

  IF EXISTS (SELECT 1 FROM public.class_members WHERE student_id = uid) THEN
    RAISE EXCEPTION 'You are already in a class - ask your teacher to move you to another one';
  END IF;

  INSERT INTO public.class_members (class_id, student_id) VALUES (cls.id, uid);
  RETURN QUERY SELECT cls.id, cls.name;
END;
$$;
REVOKE ALL ON FUNCTION public.join_class_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_class_by_code(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Which homework emails have been sent.
--
-- One row per (homework, student, kind). The sender inserts the row *before*
-- sending and deletes it if the send fails, so two runs at once can't both
-- email the same student, and a failed send is retried on the next run.
-- Only the server (service role) touches it; students and teachers have no
-- access, since it holds nothing they need.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.homework_emails (
  homework_id uuid NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('set', 'reminder')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (homework_id, student_id, kind)
);
ALTER TABLE public.homework_emails ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.homework_emails FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.homework_emails TO service_role;

-- Homework that already exists was announced the old way (in the app), so count
-- it as "set" emailed. Without this the first run would email every student
-- about homework they've had for days. Reminders are not backfilled: a homework
-- due tomorrow *should* trigger one.
INSERT INTO public.homework_emails (homework_id, student_id, kind)
SELECT h.id, m.student_id, 'set'
FROM public.homework h
JOIN public.class_members m ON m.class_id = h.class_id
ON CONFLICT DO NOTHING;
