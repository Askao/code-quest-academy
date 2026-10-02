-- Read-only. Run in Supabase Studio's SQL editor. Lists students whose XP is
-- higher than their history supports: legitimate XP is the XP from the FIRST
-- pass of each challenge (XP is earned once per challenge). "excess" is what
-- they hold above that, "repeat_passes" how many times they re-passed a task
-- they had already completed. Staff accounts are left out.
with ranked as (
  select user_id, challenge_id, xp_awarded,
    row_number() over (partition by user_id, challenge_id order by created_at, id) as pass_no
  from public.attempts where passed
), per_user as (
  select user_id,
    sum(xp_awarded) filter (where pass_no = 1)::int as legit_xp,
    count(*) filter (where pass_no > 1) as repeat_passes
  from ranked group by user_id
)
select p.full_name as student,
  (select string_agg(c.name, ', ') from public.class_members m join public.classes c on c.id = m.class_id where m.student_id = s.user_id) as classes,
  s.xp as xp_now, coalesce(u.legit_xp, 0) as legit_xp,
  s.xp - coalesce(u.legit_xp, 0) as excess, coalesce(u.repeat_passes, 0) as repeat_passes
from public.stats s
join public.profiles p on p.id = s.user_id
left join per_user u on u.user_id = s.user_id
where s.xp > coalesce(u.legit_xp, 0)
  and not exists (select 1 from public.user_roles r where r.user_id = s.user_id and r.role in ('teacher', 'admin'))
order by excess desc;
