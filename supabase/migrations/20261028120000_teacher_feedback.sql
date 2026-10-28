-- Teacher feedback: a short form teachers are asked to fill in once, after
-- they have really used the site (account at least 7 days old, used on at
-- least 3 different days). Answers are read on the admin page.
--
-- Three tables, none readable directly (RLS on, no policies): everything goes
-- through the functions below, which check who is asking.
--   teacher_active_days   - one row per teacher per UK day they used the site
--   teacher_feedback      - the answers
--   feedback_prompt_state - whether a teacher has answered, said no, or asked
--                           to be reminded (once) a week later
-- All three are removed with the account (on delete cascade). Safe to run
-- more than once.

create table if not exists public.teacher_active_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);
alter table public.teacher_active_days enable row level security;
revoke all on public.teacher_active_days from public, anon, authenticated;

create table if not exists public.teacher_feedback (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  usefulness integer not null check (usefulness between 1 and 5),
  clarity text not null check (clarity in ('clear', 'some', 'many')),
  used text[] not null default '{}',
  missing text not null default '' check (char_length(missing) <= 4000),
  recommend text not null check (recommend in ('yes', 'maybe', 'not_yet')),
  contact_ok boolean not null default false
);
alter table public.teacher_feedback enable row level security;
revoke all on public.teacher_feedback from public, anon, authenticated;

create table if not exists public.feedback_prompt_state (
  teacher_id uuid primary key references auth.users (id) on delete cascade,
  status text not null check (status in ('sent', 'declined', 'snoozed')),
  snoozed_until timestamptz,
  snoozes integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.feedback_prompt_state enable row level security;
revoke all on public.feedback_prompt_state from public, anon, authenticated;

-- Called once a day by a teacher's browser. Does nothing for students.
create or replace function public.record_active_day()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.teacher_active_days (user_id, day)
  select auth.uid(), (now() at time zone 'Europe/London')::date
  where exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'teacher')
  on conflict do nothing;
$$;
revoke all on function public.record_active_day() from public, anon;
grant execute on function public.record_active_day() to authenticated;

-- Should this teacher see the feedback form now? Admins are never asked.
create or replace function public.feedback_prompt_due()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'teacher')
    and not exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and created_at <= now() - interval '7 days'
    )
    and (select count(*) from public.teacher_active_days where user_id = auth.uid()) >= 3
    and not exists (
      select 1 from public.feedback_prompt_state s
      where s.teacher_id = auth.uid()
        and (s.status <> 'snoozed' or s.snoozed_until > now())
    );
$$;
revoke all on function public.feedback_prompt_due() from public, anon;
grant execute on function public.feedback_prompt_due() to authenticated;

-- "Ask me next week" (once only: a second "later" counts as "no thanks"),
-- or "No thanks".
create or replace function public.dismiss_feedback_prompt(_choice text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _snoozes integer;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  select snoozes into _snoozes from public.feedback_prompt_state where teacher_id = auth.uid();
  if _choice = 'later' and coalesce(_snoozes, 0) = 0 then
    insert into public.feedback_prompt_state (teacher_id, status, snoozed_until, snoozes, updated_at)
    values (auth.uid(), 'snoozed', now() + interval '7 days', 1, now())
    on conflict (teacher_id) do update
      set status = 'snoozed', snoozed_until = excluded.snoozed_until, snoozes = 1, updated_at = now();
  else
    insert into public.feedback_prompt_state (teacher_id, status, snoozes, updated_at)
    values (auth.uid(), 'declined', coalesce(_snoozes, 0), now())
    on conflict (teacher_id) do update
      set status = case when feedback_prompt_state.status = 'sent' then 'sent' else 'declined' end,
          updated_at = now();
  end if;
end;
$$;
revoke all on function public.dismiss_feedback_prompt(text) from public, anon;
grant execute on function public.dismiss_feedback_prompt(text) to authenticated;

-- Teachers can send feedback any time from the teacher menu; at most 5 a day.
create or replace function public.submit_teacher_feedback(
  _usefulness integer, _clarity text, _used text[], _missing text, _recommend text, _contact_ok boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.user_roles where user_id = auth.uid() and role in ('teacher', 'admin')
  ) then
    raise exception 'Only teachers can send feedback';
  end if;
  if (
    select count(*) from public.teacher_feedback
    where teacher_id = auth.uid() and created_at > now() - interval '1 day'
  ) >= 5 then
    raise exception 'You have sent a lot of feedback today. Thank you! Please try again tomorrow.';
  end if;
  insert into public.teacher_feedback (teacher_id, usefulness, clarity, used, missing, recommend, contact_ok)
  values (
    auth.uid(), _usefulness, _clarity,
    coalesce((select array_agg(u) from unnest(_used) u
              where u in ('lessons', 'homework', 'markbook', 'assessments', 'duels', 'editor')), '{}'),
    left(coalesce(_missing, ''), 4000), _recommend, coalesce(_contact_ok, false)
  );
  insert into public.feedback_prompt_state (teacher_id, status, updated_at)
  values (auth.uid(), 'sent', now())
  on conflict (teacher_id) do update set status = 'sent', updated_at = now();
end;
$$;
revoke all on function public.submit_teacher_feedback(integer, text, text[], text, text, boolean) from public, anon;
grant execute on function public.submit_teacher_feedback(integer, text, text[], text, text, boolean) to authenticated;

-- The admin page: every answer, newest first, with the teacher's name, how
-- many classes they have, and their email only if they said it's fine to
-- contact them. One jsonb value, so the 1,000-row response limit can't trim it.
create or replace function public.admin_teacher_feedback()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin') then
    raise exception 'Admins only';
  end if;
  return coalesce((
    select jsonb_agg(row_to_json(r) order by r.created_at desc)
    from (
      select f.id, f.created_at, f.usefulness, f.clarity, f.used, f.missing, f.recommend, f.contact_ok,
             coalesce(p.full_name, 'Teacher') as name,
             case when f.contact_ok then p.email end as email,
             (select count(*) from public.classes c where c.teacher_id = f.teacher_id) as classes
      from public.teacher_feedback f
      left join public.profiles p on p.id = f.teacher_id
    ) r
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.admin_teacher_feedback() from public, anon;
grant execute on function public.admin_teacher_feedback() to authenticated;
