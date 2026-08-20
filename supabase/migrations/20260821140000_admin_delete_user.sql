-- Lets an admin delete any account from the Admin > Users table. Same
-- SECURITY DEFINER pattern as delete_class (auth.users isn't writable
-- through normal RLS/PostgREST grants) - every student/teacher-owned table
-- already cascades cleanly off auth.users deletion (see delete_class's
-- migration for the full FK audit), so deleting the auth.users row alone
-- is sufficient here too.
CREATE OR REPLACE FUNCTION public.delete_user_account(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot delete your own account';
  END IF;

  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_user_account(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account(uuid) TO authenticated;
