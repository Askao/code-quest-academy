-- The "roles readable" policy already existed, but authenticated had no
-- INSERT/DELETE grant on user_roles at all (table GRANTs are checked before
-- RLS), so the admin panel's role-change control failed for everyone,
-- including real admins. Add the grant plus admin-only RLS policies so only
-- an existing admin can assign or remove roles.
GRANT INSERT, DELETE ON public.user_roles TO authenticated;

CREATE POLICY "admins insert roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete roles" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
