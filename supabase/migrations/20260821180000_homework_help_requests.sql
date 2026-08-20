-- Lets a student flag that they're stuck on a piece of homework, paired
-- with the automatic consecutive_fails-based "struggling" detection on the
-- teacher's Overview tab. Only shown to the student once they've genuinely
-- attempted and failed at least one task in the homework (see
-- homework.$homeworkId.tsx), not on first load - and snapshots how many
-- tasks were done/total at the moment of the request, so the teacher can
-- always see whether it was a "just started" or "nearly there" request
-- even if the student's progress changes afterwards.
create table public.homework_help_requests (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  message text not null default '',
  tasks_done_at_request integer not null default 0,
  tasks_total_at_request integer not null default 0,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.homework_help_requests to authenticated;
grant all on public.homework_help_requests to service_role;
alter table public.homework_help_requests enable row level security;

create policy "help requests readable" on public.homework_help_requests for select to authenticated
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.homework h
      where h.id = homework_id and public.is_class_teacher(h.class_id, auth.uid())
    )
    or public.has_role(auth.uid(), 'admin')
  );
create policy "students create own help requests" on public.homework_help_requests for insert to authenticated
  with check (student_id = auth.uid());
create policy "teacher resolves help requests" on public.homework_help_requests for update to authenticated
  using (
    exists (
      select 1 from public.homework h
      where h.id = homework_id and public.is_class_teacher(h.class_id, auth.uid())
    )
    or public.has_role(auth.uid(), 'admin')
  );
