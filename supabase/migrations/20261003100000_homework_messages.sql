-- A teacher can send a note to the students on a homework at any time, not
-- just in the instructions written when it was set. The note is stored here
-- (so students can read it on the homework page as well as in their inbox)
-- and emailed by the server, which works out the recipients itself.
--
--   audience 'all'        - everyone on the class roster
--   audience 'unfinished' - only students who haven't finished that homework,
--                           worked out at the moment the emails go out
--
-- processed_at is set once the server has gone through the whole recipient
-- list, so a message held back overnight or half-failed is retried by the
-- hourly job, but one that is complete is never emailed again.
create table if not exists public.homework_messages (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  audience text not null default 'unfinished' check (audience in ('all', 'unfinished')),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index if not exists homework_messages_homework_idx on public.homework_messages (homework_id, created_at desc);

alter table public.homework_messages enable row level security;
revoke all on public.homework_messages from public, anon;
grant select, insert on public.homework_messages to authenticated;
grant all on public.homework_messages to service_role;

-- Who may write: the class's teachers (and admins), as themselves.
create policy "teachers send messages" on public.homework_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.homework h
      where h.id = homework_id
        and (public.is_class_teacher(h.class_id, auth.uid()) or public.has_role(auth.uid(), 'admin'))
    )
  );

-- Who may read: the same teachers, and the students on that class's roster.
create policy "read homework messages" on public.homework_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.homework h
      where h.id = homework_id
        and (
          public.is_class_teacher(h.class_id, auth.uid())
          or public.has_role(auth.uid(), 'admin')
          or exists (
            select 1 from public.class_members m
            where m.class_id = h.class_id and m.student_id = auth.uid()
          )
        )
    )
  );

-- A cap, so a slip of the Send button (or a bad day) can't flood a class's inboxes.
create or replace function public.limit_homework_messages() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (
    select count(*) from public.homework_messages
    where homework_id = new.homework_id and created_at > now() - interval '24 hours'
  ) >= 5 then
    raise exception 'You can send up to 5 messages per homework per day';
  end if;
  return new;
end;
$$;
drop trigger if exists limit_homework_messages on public.homework_messages;
create trigger limit_homework_messages
  before insert on public.homework_messages
  for each row execute function public.limit_homework_messages();

-- Which students a message has been emailed to. Recorded before sending (like
-- homework_emails) so two runs can't both email the same student. Server only.
create table if not exists public.homework_message_emails (
  message_id uuid not null references public.homework_messages(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (message_id, student_id)
);
alter table public.homework_message_emails enable row level security;
revoke all on public.homework_message_emails from public, anon, authenticated;
grant all on public.homework_message_emails to service_role;

notify pgrst, 'reload schema';
