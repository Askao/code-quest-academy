-- The teacher roster worked out each student's Accuracy and Last active from
-- the newest 500 attempts across the WHOLE class. A few students replaying
-- finished tasks thousands of times filled that window, so everyone else had
-- no attempts in it and showed 0% accuracy. This computes both per student
-- from their complete history instead.
--
-- Accuracy counts attempts up to and including the first pass of each
-- challenge: once a task is completed, replaying it says nothing about how
-- accurate the student is (and was how farmers showed 94%). Last active is
-- the newest attempt of any kind.
create or replace function public.class_attempt_summary(_class_id uuid)
returns table (user_id uuid, attempts int, passed int, last_attempt timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.is_class_teacher(_class_id, auth.uid()) or public.has_role(auth.uid(), 'admin')) then
    raise exception 'Not allowed';
  end if;

  return query
  with a as (
    select t.user_id as uid, t.passed as ok, t.created_at,
      coalesce(
        bool_or(t.passed) over (
          partition by t.user_id, t.challenge_id
          order by t.created_at, t.id
          rows between unbounded preceding and 1 preceding
        ), false
      ) as done_before
    from public.attempts t
    where t.user_id in (select m.student_id from public.class_members m where m.class_id = _class_id)
  )
  select a.uid,
    (count(*) filter (where not a.done_before))::int,
    (count(*) filter (where not a.done_before and a.ok))::int,
    max(a.created_at)
  from a
  group by a.uid;
end;
$$;

revoke all on function public.class_attempt_summary(uuid) from public, anon;
grant execute on function public.class_attempt_summary(uuid) to authenticated;

notify pgrst, 'reload schema';
