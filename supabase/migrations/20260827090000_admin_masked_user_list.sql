-- Admins can manage roles and delete accounts without ever seeing full
-- names or emails - masking happens inside this SECURITY DEFINER function,
-- in the database, so unmasked personal data never leaves Postgres for the
-- admin's browser (a client-side mask alone would still send the real
-- values over the wire, visible to anyone opening devtools). Only enough
-- survives to tell one account apart from another: first name in full,
-- last name reduced to an initial ("Ada L."); email reduced to its first
-- character and domain ("a***@school.org").
--
-- Same "check the caller's role inside the function, RAISE EXCEPTION if
-- not authorized" pattern as add_class_co_teacher/delete_class.
create or replace function public.admin_list_users()
returns table (
  id uuid,
  masked_name text,
  masked_email text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Admins only';
  end if;

  return query
  select
    p.id,
    case
      when p.full_name is null or trim(p.full_name) = '' then null
      else
        split_part(trim(p.full_name), ' ', 1) ||
        case
          when split_part(trim(p.full_name), ' ', 2) <> ''
          then ' ' || left(split_part(trim(p.full_name), ' ', 2), 1) || '.'
          else ''
        end
    end as masked_name,
    case
      when p.email is null or position('@' in p.email) = 0 then p.email
      else left(split_part(p.email, '@', 1), 1) || '***@' || split_part(p.email, '@', 2)
    end as masked_email,
    p.created_at
  from public.profiles p
  order by p.created_at desc
  limit 200;
end;
$$;

revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;
