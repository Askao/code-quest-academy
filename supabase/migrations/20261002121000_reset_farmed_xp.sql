-- ONE-OFF DATA FIX. Apply 20261002110000_no_xp_for_repeat_passes.sql (and
-- ship the matching app change) FIRST, otherwise students can farm it all
-- back the same day.
--
-- Until now every passing attempt paid XP, so re-opening a finished task and
-- pasting the answer back in earned it again. XP is meant to be earned once
-- per challenge: the first pass. This puts everyone back to that.
--
--   1. Every passed attempt after a student's first pass of the same
--      challenge has its xp_awarded set to 0 (this also stops farmers
--      topping the "most improved" leaderboard and the class reports).
--   2. stats.xp is lowered to what the student's attempts now add up to. It is
--      never raised: someone already below their total keeps what they have.
--   3. skills.passes is recounted as distinct challenges passed per topic.
--      Skill LEVELS are not recomputed - they correct themselves as the
--      student's real results come in.
--   4. An equipped avatar/banner the student no longer qualifies for is
--      cleared (the Locker only checks eligibility at the moment of equipping).
--
-- Everything changed is copied into the *_backup tables first, so it can be
-- undone with the restore statements at the bottom.
create table if not exists public.xp_reset_backup (
  user_id uuid primary key,
  xp_before int not null,
  passes_before jsonb,
  avatar_before text,
  banner_before text,
  backed_up_at timestamptz not null default now()
);
create table if not exists public.xp_reset_attempts_backup (
  attempt_id uuid primary key,
  xp_before int not null
);
alter table public.xp_reset_backup enable row level security;
alter table public.xp_reset_attempts_backup enable row level security;
-- no policies: only the service role / dashboard can read these.

insert into public.xp_reset_backup (user_id, xp_before, passes_before, avatar_before, banner_before)
select s.user_id, s.xp,
  (select jsonb_object_agg(k.track || ':' || k.topic, k.passes) from public.skills k where k.user_id = s.user_id),
  p.selected_avatar, p.selected_banner
from public.stats s
left join public.profiles p on p.id = s.user_id
on conflict (user_id) do nothing;

insert into public.xp_reset_attempts_backup (attempt_id, xp_before)
select id, xp_awarded from (
  select id, xp_awarded,
    row_number() over (partition by user_id, challenge_id order by created_at, id) as pass_no
  from public.attempts where passed
) r
where pass_no > 1 and xp_awarded <> 0
on conflict (attempt_id) do nothing;

update public.attempts a set xp_awarded = 0
from public.xp_reset_attempts_backup b
where a.id = b.attempt_id;

update public.stats s
set xp = t.total, updated_at = now()
from (
  select s2.user_id, coalesce((select sum(a.xp_awarded) from public.attempts a where a.user_id = s2.user_id), 0)::int as total
  from public.stats s2
) t
where t.user_id = s.user_id and s.xp > t.total;

update public.skills k
set passes = coalesce((
  select count(distinct a.challenge_id) from public.attempts a
  join public.challenges c on c.id = a.challenge_id
  where a.user_id = k.user_id and a.passed and c.track = k.track and c.topic = k.topic
), 0);

update public.profiles
set selected_avatar = null
where selected_avatar is not null and not public.cosmetic_unlocked(id, selected_avatar);
update public.profiles
set selected_banner = null
where selected_banner is not null and not public.cosmetic_unlocked(id, selected_banner);

-- UNDO (run by hand if ever needed):
--   update public.attempts a set xp_awarded = b.xp_before from public.xp_reset_attempts_backup b where a.id = b.attempt_id;
--   update public.stats s set xp = b.xp_before from public.xp_reset_backup b where b.user_id = s.user_id;
--   update public.profiles p set selected_avatar = b.avatar_before, selected_banner = b.banner_before
--     from public.xp_reset_backup b where b.user_id = p.id;
-- (skills.passes_before is kept as JSON keyed "track:topic" for reference.)
