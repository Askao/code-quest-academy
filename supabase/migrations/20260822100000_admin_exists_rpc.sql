-- Lets the public sign-in page hide "the first account becomes the admin"
-- once that's no longer true, without exposing who the admin actually is
-- or touching user_roles' RLS (which deliberately doesn't allow anon reads
-- at all). Returns only a boolean - the narrowest possible answer to "is
-- the bootstrap-admin condition in handle_new_user() still live".
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;
REVOKE ALL ON FUNCTION public.admin_exists() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon, authenticated;
