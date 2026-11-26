-- The admin page's user list stopped at the 200 newest accounts, so its
-- "Users" total stuck at 200 once the site passed that. Same function,
-- same masking, no limit: the admin page now pages through the results
-- (PostgREST hands back at most 1,000 rows per request). Safe to run more
-- than once.
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
  order by p.created_at desc, p.id;
end;
$$;

revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;
