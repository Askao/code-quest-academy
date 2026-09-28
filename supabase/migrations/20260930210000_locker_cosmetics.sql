-- The Locker: avatars and banners unlocked by level (the same curve
-- levelFromXp in src/lib/game.ts uses) or by a handful of real achievements
-- duels/attempts/streak already track. Badges are untouched - they keep
-- working exactly as they do today (client-awarded, see progress.ts).
--
-- Cosmetics need a stronger guarantee than badges do: a badge is a private
-- personal record, but an equipped avatar/banner is shown to classmates on
-- the leaderboard and in Duels, so "is this actually unlocked" has to be
-- checked server-side, not just hidden in the UI - otherwise a student can
-- simply call the update directly and wear anything.
--
-- The catalog below (in cosmetic_unlocked) MUST stay in sync with the
-- AVATARS/BANNERS catalogs in src/lib/game.ts - one is what's enforced, the
-- other is what's drawn. Keep both identical when adding a new one.

alter table public.profiles
  add column selected_avatar text,
  add column selected_banner text;

-- own profile update already lets a student write any column on their own
-- row (RLS is row-level, not column-level) - these two are carved out so
-- the only way to change them is through set_cosmetic below, which checks
-- eligibility first. Revoking, not a CHECK constraint, because eligibility
-- depends on the caller's own level/history, not just "is this a real key".
--
-- A plain `revoke update (col) on table from role` does NOT do this on its
-- own: the original schema also holds a table-level
-- `grant select, insert, update on public.profiles to authenticated`, and
-- Postgres treats the table-level and column-level UPDATE grants as
-- independent - either one alone is enough to permit writing any column,
-- so the coarser table-level grant would silently keep letting students
-- write these two columns directly. The table-level UPDATE grant has to be
-- revoked and re-granted per-column (everything except the two cosmetic
-- columns) for the column-level revoke below to actually mean anything.
revoke update on public.profiles from authenticated;
grant update (email, full_name, school_id) on public.profiles to authenticated;

-- Mirrors levelFromXp's loop in src/lib/game.ts exactly (level n needs
-- n*100 more XP than the previous level) - kept as its own function so
-- cosmetic_unlocked reads clearly, and so anything else that ever needs a
-- level from the database has it already.
create or replace function public.level_from_xp(_xp int) returns int
language plpgsql immutable as $$
declare
  lvl int := 1;
  needed int := 100;
  remaining int := coalesce(_xp, 0);
begin
  while remaining >= needed loop
    remaining := remaining - needed;
    lvl := lvl + 1;
    needed := lvl * 100;
  end loop;
  return lvl;
end;
$$;

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
    when 'century' then (select count(*) from public.attempts where user_id = _user_id and passed) >= 100
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
revoke all on function public.cosmetic_unlocked(uuid, text) from public, anon;
grant execute on function public.cosmetic_unlocked(uuid, text) to authenticated;

-- _key of null clears the slot back to the default look. Any other key must
-- pass cosmetic_unlocked for the caller themselves - nobody can equip
-- something on someone else's behalf, or something they haven't earned.
create or replace function public.set_cosmetic(_kind text, _key text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if _kind not in ('avatar', 'banner') then
    raise exception 'Unknown cosmetic kind: %', _kind;
  end if;
  if _key is not null and not public.cosmetic_unlocked(auth.uid(), _key) then
    raise exception 'Not unlocked yet';
  end if;
  if _kind = 'avatar' then
    update public.profiles set selected_avatar = _key where id = auth.uid();
  else
    update public.profiles set selected_banner = _key where id = auth.uid();
  end if;
end;
$$;
revoke all on function public.set_cosmetic(text, text) from public, anon;
grant execute on function public.set_cosmetic(text, text) to authenticated;

notify pgrst, 'reload schema';
