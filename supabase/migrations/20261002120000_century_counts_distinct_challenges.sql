-- The "Century" avatar ("pass 100 challenges") counted passed attempts, so the
-- repeat-pass XP exploit unlocked it cheaply. It now counts distinct
-- challenges passed. Same body as 20260930210000_locker_cosmetics.sql apart
-- from that one line - keep the two catalogs in sync with src/lib/game.ts.
create or replace function public.cosmetic_unlocked(_user_id uuid, _key text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  lvl int;
  best int;
begin
  select public.level_from_xp(s.xp), coalesce(s.best_streak, 0) into lvl, best
  from public.stats s where s.user_id = _user_id;
  lvl := coalesce(lvl, 1);
  best := coalesce(best, 0);

  return case _key
    when 'sprout' then lvl >= 1
    when 'spark' then lvl >= 3
    when 'compass' then lvl >= 5
    when 'owl' then lvl >= 7
    when 'fox' then lvl >= 9
    when 'rocket' then lvl >= 12
    when 'phoenix' then lvl >= 15
    when 'wolf' then lvl >= 18
    when 'dragon' then lvl >= 22
    when 'crown' then lvl >= 27
    when 'comet' then exists (select 1 from public.duels where winner_id = _user_id)
    when 'century' then (select count(distinct challenge_id) from public.attempts where user_id = _user_id and passed) >= 100
    when 'horizon' then lvl >= 1
    when 'ember' then lvl >= 5
    when 'circuit' then lvl >= 10
    when 'aurora' then lvl >= 15
    when 'midnight' then lvl >= 20
    when 'champion' then lvl >= 25
    when 'duellist_crest' then (select count(*) from public.duels where winner_id = _user_id) >= 5
    when 'streak_flame' then best >= 14
    else false
  end;
end;
$$;

-- The Locker page shows the caller's own progress towards Century, so it
-- needs the same distinct count (a plain count of attempt rows would still be
-- inflated by repeats). Own-record only: no argument to point at someone else.
create or replace function public.my_passed_challenge_count() returns int
language sql stable security definer set search_path = public as $$
  select count(distinct challenge_id)::int from public.attempts
  where user_id = auth.uid() and passed;
$$;
revoke all on function public.my_passed_challenge_count() from public, anon;
grant execute on function public.my_passed_challenge_count() to authenticated;

notify pgrst, 'reload schema';
