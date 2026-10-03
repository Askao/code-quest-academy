-- Everything the weekly student and teacher emails need, worked out in the
-- database. Each function hands back ONE jsonb value rather than rows:
-- PostgREST cuts any row-returning call off at 1,000 rows without an error,
-- which is how the old fortnightly report quietly under-counted busy weeks.
-- The functions are for the server (service role) only.
--
-- "Passed" always means the FIRST pass of a challenge. Replaying a finished
-- task earns nothing and counts for nothing here, matching the repeat-XP fix.

-- A student can switch these emails off from their account page. Only this
-- one column is added to what a student may edit on their own profile.
alter table public.profiles add column if not exists weekly_reports boolean not null default true;
grant update (weekly_reports) on public.profiles to authenticated;

-- One row per email sent, written before sending (like homework_emails) so two
-- runs can't both email the same person, and removed again if the send fails.
create table if not exists public.weekly_report_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  kind text not null check (kind in ('student', 'teacher')),
  sent_at timestamptz not null default now(),
  primary key (user_id, week_start, kind)
);
alter table public.weekly_report_log enable row level security;
revoke all on public.weekly_report_log from public, anon, authenticated;
grant all on public.weekly_report_log to service_role;

-- One object per student: this week's and last week's passes, XP, the days
-- they were active (UK dates), what they worked on, the attempts that count
-- towards accuracy (up to and including the first pass of each task), when
-- they last did anything, and any topic they have failed three times running.
create or replace function public.report_student_week(_from timestamptz, _to timestamptz, _prev_from timestamptz)
returns jsonb
language sql stable set search_path = public as $$
  with fp as (
    select distinct on (a.user_id, a.challenge_id) a.user_id, a.challenge_id, a.created_at
    from public.attempts a where a.passed
    order by a.user_id, a.challenge_id, a.created_at, a.id
  ),
  win as (
    select a.user_id, a.challenge_id, a.passed, a.xp_awarded, a.created_at
    from public.attempts a where a.created_at >= _from and a.created_at < _to
  ),
  counted as (
    select w.user_id, w.passed
    from win w
    left join fp on fp.user_id = w.user_id and fp.challenge_id = w.challenge_id
    where fp.created_at is null or w.created_at <= fp.created_at
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'student_id', s.user_id,
    'tasks_passed', (select count(*) from fp where fp.user_id = s.user_id and fp.created_at >= _from and fp.created_at < _to),
    'prev_tasks_passed', (select count(*) from fp where fp.user_id = s.user_id and fp.created_at >= _prev_from and fp.created_at < _from),
    'xp_earned', coalesce((select sum(w.xp_awarded) from win w where w.user_id = s.user_id), 0),
    'xp_total', s.xp,
    'active_dates', coalesce((
      select jsonb_agg(distinct to_char((w.created_at at time zone 'Europe/London')::date, 'YYYY-MM-DD'))
      from win w where w.user_id = s.user_id
    ), '[]'::jsonb),
    'topics', coalesce((
      select jsonb_object_agg(t.topic, t.n) from (
        select c.topic, count(*) as n
        from fp join public.challenges c on c.id = fp.challenge_id
        where fp.user_id = s.user_id and fp.created_at >= _from and fp.created_at < _to
        group by c.topic
      ) t
    ), '{}'::jsonb),
    'attempts_in_window', (select count(*) from win w where w.user_id = s.user_id),
    'attempts_counted', (select count(*) from counted c where c.user_id = s.user_id),
    'passed_counted', (select count(*) from counted c where c.user_id = s.user_id and c.passed),
    'last_attempt_at', (select max(a.created_at) from public.attempts a where a.user_id = s.user_id),
    'stuck_topics', coalesce((
      select jsonb_agg(k.topic) from public.skills k where k.user_id = s.user_id and k.consecutive_fails >= 3
    ), '[]'::jsonb)
  )), '[]'::jsonb)
  from public.stats s;
$$;

-- One object per (student, homework) that is still relevant: not set more than
-- 30 days ago with no deadline, nor due more than 28 days ago. Uses the
-- student's own task list if they have one, else the homework's shared list.
-- next_task is the first task on the list they have not passed yet.
create or replace function public.report_homework_status(_now timestamptz)
returns jsonb
language sql stable set search_path = public as $$
  with fp as (
    select distinct on (a.user_id, a.challenge_id) a.user_id, a.challenge_id, a.created_at
    from public.attempts a where a.passed
    order by a.user_id, a.challenge_id, a.created_at, a.id
  ),
  pairs as (
    select m.student_id, h.id as homework_id, h.class_id, h.title, h.due_at,
      coalesce(ha.challenge_ids, h.challenge_ids) as ids
    from public.homework h
    join public.class_members m on m.class_id = h.class_id
    left join public.homework_assignments ha on ha.homework_id = h.id and ha.student_id = m.student_id
    where (h.due_at is null and h.created_at > _now - interval '30 days')
       or h.due_at > _now - interval '28 days'
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'student_id', p.student_id,
    'homework_id', p.homework_id,
    'class_id', p.class_id,
    'class_name', c.name,
    'title', p.title,
    'due_at', p.due_at,
    'total', cardinality(p.ids),
    'done', (select count(*) from unnest(p.ids) as t(cid) join fp on fp.user_id = p.student_id and fp.challenge_id = t.cid),
    'last_pass', (select max(fp.created_at) from unnest(p.ids) as t(cid) join fp on fp.user_id = p.student_id and fp.challenge_id = t.cid),
    'next_task', (
      select ch.title
      from unnest(p.ids) with ordinality as t(cid, ord)
      join public.challenges ch on ch.id = t.cid
      left join fp on fp.user_id = p.student_id and fp.challenge_id = t.cid
      where fp.created_at is null
      order by t.ord limit 1
    )
  )), '[]'::jsonb)
  from pairs p join public.classes c on c.id = p.class_id;
$$;

-- Papers handed in and waiting for a teacher, per class and assessment.
create or replace function public.report_marking_queue()
returns jsonb
language sql stable set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'class_id', x.class_id, 'assessment_id', x.id, 'title', x.title,
    'submitted', x.submitted, 'unmarked', x.unmarked
  )), '[]'::jsonb)
  from (
    select a.class_id, a.id, a.title,
      count(*) filter (where t.submitted_at is not null) as submitted,
      count(*) filter (where t.submitted_at is not null and t.marked_at is null) as unmarked
    from public.assessments a
    join public.assessment_attempts t on t.assessment_id = a.id
    group by a.class_id, a.id, a.title
    having count(*) filter (where t.submitted_at is not null and t.marked_at is null) > 0
  ) x;
$$;

-- Results released to students that were marked during the window.
create or replace function public.report_results(_from timestamptz, _to timestamptz)
returns jsonb
language sql stable set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'student_id', t.student_id, 'title', a.title, 'total', a.total_marks,
    'awarded', coalesce((select sum(ans.marks_awarded) from public.assessment_answers ans where ans.attempt_id = t.id), 0)
  )), '[]'::jsonb)
  from public.assessment_attempts t
  join public.assessments a on a.id = t.assessment_id
  where a.results_released and t.marked_at >= _from and t.marked_at < _to;
$$;

revoke all on function public.report_student_week(timestamptz, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.report_homework_status(timestamptz) from public, anon, authenticated;
revoke all on function public.report_marking_queue() from public, anon, authenticated;
revoke all on function public.report_results(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.report_student_week(timestamptz, timestamptz, timestamptz) to service_role;
grant execute on function public.report_homework_status(timestamptz) to service_role;
grant execute on function public.report_marking_queue() to service_role;
grant execute on function public.report_results(timestamptz, timestamptz) to service_role;

notify pgrst, 'reload schema';
