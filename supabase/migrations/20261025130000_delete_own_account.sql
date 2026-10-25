-- Students and teachers can delete their own account from the Account page
-- (the privacy policy promises it). Everything they own already cascades off
-- auth.users (see 20260821140000_admin_delete_user.sql), with two exceptions
-- fixed first: these columns only record who did something, so they now
-- clear to null instead of blocking the delete. Before this, deleting any
-- teacher who had set up a school or added a co-teacher failed outright,
-- the admin delete included.
alter table public.schools alter column created_by drop not null;
alter table public.schools drop constraint if exists schools_created_by_fkey;
alter table public.schools
  add constraint schools_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

alter table public.class_co_teachers alter column added_by drop not null;
alter table public.class_co_teachers drop constraint if exists class_co_teachers_added_by_fkey;
alter table public.class_co_teachers
  add constraint class_co_teachers_added_by_fkey
  foreign key (added_by) references auth.users(id) on delete set null;

-- Deletes the caller's own account and everything in it.
--
-- A teacher's classes would otherwise vanish with them, taking their
-- students' homework and the class itself away mid-year. Where a class has a
-- co-teacher, the longest-serving one becomes its owner instead and the class
-- carries on; classes with no co-teacher are deleted. The Account page says
-- which will happen before the teacher confirms.
--
-- The last admin can't delete themselves, or nobody could manage the site.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _me uuid := auth.uid();
  _class record;
  _heir uuid;
begin
  if _me is null then
    raise exception 'not signed in';
  end if;

  if public.has_role(_me, 'admin') and not exists (
    select 1 from public.user_roles where role = 'admin' and user_id <> _me
  ) then
    raise exception 'You are the only admin. Make someone else an admin before deleting your account.';
  end if;

  for _class in select id from public.classes where teacher_id = _me loop
    select ct.teacher_id into _heir
    from public.class_co_teachers ct
    where ct.class_id = _class.id and ct.teacher_id <> _me
    order by ct.created_at, ct.id
    limit 1;
    if _heir is not null then
      update public.classes set teacher_id = _heir where id = _class.id;
      delete from public.class_co_teachers where class_id = _class.id and teacher_id = _heir;
    end if;
  end loop;

  delete from auth.users where id = _me;
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
