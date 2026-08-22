import { supabase } from "@/integrations/supabase/client";
import { BADGES, xpForAttempt, type TrackKey } from "@/lib/game";

/**
 * Wipes a student's (or the caller's own) progress on a topic - every task
 * attempt, every lesson quiz result in it, and the topic's skill level, a
 * genuine "start over" - or on just one lesson within it (that lesson's
 * task attempts and its one quiz attempt; the skill level is a topic-wide
 * signal so a single-lesson reset leaves it alone). `taskSlugs` is required
 * for a lesson-scoped reset - only the caller (via content.ts) knows which
 * task slugs belong to a given lesson number, the database doesn't.
 * Authorization (self, admin, or a teacher of a class this student is in)
 * is enforced inside the reset_progress RPC, not here.
 */
export async function resetProgress(opts: {
  userId: string;
  track: TrackKey;
  topic: string;
  lessonSlug?: string | undefined;
  taskSlugs?: string[] | undefined;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.rpc("reset_progress", {
    _user_id: opts.userId,
    _track: opts.track,
    _topic: opts.topic,
    _lesson_slug: opts.lessonSlug ?? null,
    _task_slugs: opts.taskSlugs ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** The only shape recordAttempt actually needs from a run outcome - shared
 * by python-runner's RunOutcome and sql-runner's SqlRunOutcome, so either
 * can be passed straight in without a cast. */
type Outcome = { passed: boolean; passedCount: number; total: number; durationMs: number };

export type Challenge = {
  id: string;
  slug: string;
  title: string;
  track: TrackKey;
  topic: string;
  difficulty: number;
  xp: number;
  brief: string;
  starter_code: string;
  hints: string[];
  tests: { stdin?: string; expect: string }[];
  /** Multi-part problems: tasks sharing a group are ordered steps of one bigger scenario. */
  group?: string;
  part?: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function awardBadge(userId: string, key: string, earned: string[]) {
  if (!BADGES[key] || earned.includes(key)) return null;
  const { error } = await supabase.from("badges").insert({ user_id: userId, badge_key: key });
  return error ? null : key;
}

export type AttemptSummary = {
  xpAwarded: number;
  newBadges: string[];
  newSkillLevel: number;
};

/**
 * Persist a submission: attempt row, adaptive skill level, XP, streak and badges.
 */
export async function recordAttempt(opts: {
  userId: string;
  challenge: Challenge;
  outcome: Outcome;
  code: string;
  mode: string;
  firstTry: boolean;
}): Promise<AttemptSummary> {
  const { userId, challenge, outcome, code, mode, firstTry } = opts;
  const xpAwarded = outcome.passed ? xpForAttempt(challenge.xp, firstTry, mode) : 0;

  await supabase.from("attempts").insert({
    user_id: userId,
    challenge_id: challenge.id,
    code,
    passed: outcome.passed,
    tests_passed: outcome.passedCount,
    tests_total: outcome.total,
    duration_ms: outcome.durationMs,
    xp_awarded: xpAwarded,
    mode,
  });

  // --- adaptive skill level -------------------------------------------------
  const { data: existingSkill } = await supabase
    .from("skills")
    .select("*")
    .eq("user_id", userId)
    .eq("track", challenge.track)
    .eq("topic", challenge.topic)
    .maybeSingle();

  const current = Number(existingSkill?.level ?? 1);
  const stretch = Math.max(0, challenge.difficulty - current);
  const priorFails = existingSkill?.consecutive_fails ?? 0;

  // Three fails in a row on a topic is treated as a stronger signal than one
  // fail in isolation - drop further so the next pickChallenge() call lands
  // on a visibly easier tier, not just a marginally easier one. A single
  // fail stays gentle on purpose: overreacting to one slip ("premature
  // abandonment") is a known failure mode in adaptive difficulty systems -
  // it takes a genuine pattern, not one wrong answer, to push someone down.
  //
  // Speed cuts the other way too: a pass that took a long time still counts,
  // but doesn't earn the full stretch bonus a fast one would - the student
  // clearly hasn't mastered that difficulty yet even though they got there
  // in the end. A clean, quick, first-try pass earns *more* than the base
  // bonus, so a student breezing through gets pushed to harder material
  // faster instead of drilling the same level indefinitely. Only Test
  // clicks call recordAttempt at all (see play.$slug.tsx's split between
  // the free "Run" console and "Test") - casual runs while still debugging
  // never reach here, so this speed isn't measuring "how fast did they
  // fumble their way to something that ran", only genuine attempts.
  const consecutiveFails = outcome.passed ? 0 : priorFails + 1;
  const fastPass = outcome.passed && firstTry && outcome.durationMs < 60 * 1000;
  const slowPass = outcome.passed && outcome.durationMs > 4 * 60 * 1000;
  const speedMultiplier = fastPass ? 1.3 : slowPass ? 0.5 : 1;
  const delta = outcome.passed
    ? (0.15 + 0.12 * stretch) * speedMultiplier
    : consecutiveFails >= 3
      ? -0.27
      : -0.12;
  const newSkillLevel = Math.min(5, Math.max(1, Number((current + delta).toFixed(2))));

  await supabase.from("skills").upsert(
    {
      user_id: userId,
      track: challenge.track,
      topic: challenge.topic,
      level: newSkillLevel,
      attempts: (existingSkill?.attempts ?? 0) + 1,
      passes: (existingSkill?.passes ?? 0) + (outcome.passed ? 1 : 0),
      consecutive_fails: consecutiveFails,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,track,topic" },
  );

  // --- xp + streak ----------------------------------------------------------
  const { data: stats } = await supabase
    .from("stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // The daily streak is earned specifically by passing the recap task, not
  // by any old attempt - a student grinding Practice or Duels all day
  // shouldn't see their streak climb unless they've actually done the one
  // thing ("today's recap") the streak is meant to represent. Every other
  // mode still updates XP as normal, just leaves streak/last_active
  // untouched rather than silently advancing them.
  const day = today();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const isRecapCompletion = mode === "recap" && outcome.passed;
  let streak = stats?.streak_days ?? 0;
  let lastActive = stats?.last_active ?? null;
  if (isRecapCompletion && stats?.last_active !== day) {
    streak = stats?.last_active === yesterday ? streak + 1 : 1;
    lastActive = day;
  }

  const newXp = (stats?.xp ?? 0) + xpAwarded;
  await supabase.from("stats").upsert({
    user_id: userId,
    xp: newXp,
    streak_days: streak,
    best_streak: Math.max(stats?.best_streak ?? 0, streak),
    last_active: lastActive,
    updated_at: new Date().toISOString(),
  });

  // --- badges ---------------------------------------------------------------
  const newBadges: string[] = [];
  if (outcome.passed) {
    const { data: earnedRows } = await supabase
      .from("badges")
      .select("badge_key")
      .eq("user_id", userId);
    const earned = (earnedRows ?? []).map((b) => b.badge_key);

    const { count } = await supabase
      .from("attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("passed", true);

    const candidates: string[] = ["first_pass"];
    if ((count ?? 0) >= 10) candidates.push("ten_pass");
    if (streak >= 3) candidates.push("streak_3");
    if (streak >= 7) candidates.push("streak_7");
    if (newSkillLevel >= 5) candidates.push("topic_master");
    if (mode === "boss") candidates.push("boss_slayer");
    if (new Date().getHours() >= 22) candidates.push("night_owl");

    for (const key of candidates) {
      const added = await awardBadge(userId, key, earned);
      if (added) newBadges.push(added);
    }
  }

  return { xpAwarded, newBadges, newSkillLevel };
}

/**
 * Pick a challenge matched to the student's current skill level, avoiding
 * repeats. When `onlySlugs` is given, the candidate pool is restricted to
 * those slugs first - used by Recap to stay within material the student
 * has actually covered (see `completedTaskSlugs` in content.ts).
 *
 * `practiceOnly` restricts to the dedicated practice-task pool (never the
 * same tasks shown in a lesson's own list) - but a topic whose practice
 * pool hasn't been authored yet transparently falls back to the ordinary
 * pool instead of coming back empty, so this is safe to roll a topic's
 * practice content out on its own, without breaking Practice for every
 * other topic in the meantime.
 */
export async function pickChallenge(opts: {
  track: TrackKey;
  topic?: string;
  level: number;
  excludeIds?: string[];
  onlySlugs?: Set<string>;
  practiceOnly?: boolean;
}): Promise<Challenge | null> {
  const runQuery = async (practiceOnly: boolean) => {
    let query = supabase
      .from("challenges")
      .select("*")
      .eq("track", opts.track)
      .eq("homework_only", false)
      .eq("is_project", false)
      .eq("practice_only", practiceOnly);
    if (opts.topic) query = query.eq("topic", opts.topic);
    const { data } = await query;
    return data ?? [];
  };

  let data = await runQuery(opts.practiceOnly ?? false);
  if (opts.practiceOnly && data.length === 0) {
    data = await runQuery(false);
  }
  if (data.length === 0) return null;

  let candidates = data;
  if (opts.onlySlugs) {
    candidates = candidates.filter((c) => opts.onlySlugs!.has(c.slug));
    if (candidates.length === 0) return null;
  }

  const exclude = new Set(opts.excludeIds ?? []);
  const target = Math.round(opts.level);
  const fresh = candidates.filter((c) => !exclude.has(c.id));
  const pool = fresh.length ? fresh : candidates;

  // prefer challenges within one difficulty band of the student's level
  const near = pool.filter((c) => Math.abs(c.difficulty - target) <= 1);
  const chosenPool = near.length ? near : pool;
  return chosenPool[Math.floor(Math.random() * chosenPool.length)] as unknown as Challenge;
}

function shuffled<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

/**
 * Pick up to `n` distinct challenge ids from `items`, favouring ones within
 * one difficulty band of `target`, randomised rather than always the same
 * closest set for a given level.
 */
function pickNear(
  items: { id: string; difficulty: number }[],
  target: number,
  n: number,
): string[] {
  const near = items.filter((c) => Math.abs(c.difficulty - target) <= 1);
  const source = near.length >= n ? near : items;
  return shuffled(source)
    .slice(0, n)
    .map((c) => c.id);
}

/**
 * Pick up to `count` distinct challenges from a pool, randomised and
 * favouring difficulty near `level` - used to build one student's
 * personalized homework set. When the pool spans more than one topic (a
 * teacher selecting several topics at once), draws round-robin across
 * those topics first so the set is a genuine mix rather than leaving
 * variety to chance on a merged, difficulty-sorted pool.
 */
export function pickHomeworkSet(
  pool: { id: string; difficulty: number; topic?: string }[],
  level: number,
  count: number,
): string[] {
  const target = Math.round(level);
  const topics = Array.from(new Set(pool.map((c) => c.topic).filter((t): t is string => !!t)));

  if (topics.length <= 1) {
    return pickNear(pool, target, count);
  }

  const perTopic = Math.ceil(count / topics.length);
  const used = new Set<string>();
  const picked: string[] = [];
  for (const t of topics) {
    const items = pool.filter((c) => c.topic === t && !used.has(c.id));
    const ids = pickNear(items, target, perTopic);
    ids.forEach((id) => used.add(id));
    picked.push(...ids);
  }
  // Round-robin can slightly overshoot count - trim it down, shuffled so
  // it isn't always the last topic in the list that loses a slot.
  return shuffled(picked).slice(0, count);
}

/**
 * Pick something from a topic the student has already covered, favouring
 * whichever topic they're weakest in - used by the daily recap page to
 * fight forgetting rather than push new material.
 */
export async function pickRecapChallenge(opts: {
  userId: string;
  track: TrackKey;
  excludeIds?: string[];
  onlySlugs?: Set<string>;
}): Promise<Challenge | null> {
  const { data: skills } = await supabase
    .from("skills")
    .select("topic, level")
    .eq("user_id", opts.userId)
    .eq("track", opts.track);
  if (!skills || skills.length === 0) return null;

  // Try topics weakest-first, but a topic only counts if it actually has
  // something in onlySlugs - a weak topic with no completed lessons yet
  // has nothing eligible to recap.
  const sorted = [...skills].sort((a, b) => Number(a.level) - Number(b.level));
  for (const s of sorted) {
    const result = await pickChallenge({
      track: opts.track,
      topic: s.topic,
      level: Number(s.level),
      excludeIds: opts.excludeIds ?? [],
      ...(opts.onlySlugs ? { onlySlugs: opts.onlySlugs } : {}),
    });
    if (result) return result;
  }
  return null;
}
