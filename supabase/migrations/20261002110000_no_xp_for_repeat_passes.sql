-- XP is earned once per challenge. Students were re-opening a task they had
-- already passed and pasting the old answer back in to farm XP. recordAttempt
-- in src/lib/progress.ts now skips XP for repeats, but the browser can't be
-- trusted to enforce a rule that benefits the person running it (attempts are
-- inserted straight from the client), so the database zeroes it as well: any
-- passing attempt on a challenge the same student has already passed is
-- stored with xp_awarded = 0, whatever the client sent.
create or replace function public.zero_xp_for_repeat_pass() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.passed and new.xp_awarded <> 0 and exists (
    select 1 from public.attempts a
    where a.user_id = new.user_id and a.challenge_id = new.challenge_id and a.passed
  ) then
    new.xp_awarded := 0;
  end if;
  return new;
end;
$$;

drop trigger if exists zero_xp_for_repeat_pass on public.attempts;
create trigger zero_xp_for_repeat_pass
  before insert on public.attempts
  for each row execute function public.zero_xp_for_repeat_pass();
