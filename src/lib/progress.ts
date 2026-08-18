import { supabase } from "@/integrations/supabase/client";
import { BADGES, xpForAttempt, type TrackKey } from "@/lib/game";
import type { RunOutcome } from "@/lib/python-runner";

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
  outcome: RunOutcome;
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
  const delta = outcome.passed ? 0.15 + 0.12 * stretch : -0.12;
  const newSkillLevel = Math.min(5, Math.max(1, Number((current + delta).toFixed(2))));

  await supabase.from("skills").upsert(
    {
      user_id: userId,
      track: challenge.track,
      topic: challenge.topic,
      level: newSkillLevel,
      attempts: (existingSkill?.attempts ?? 0) + 1,
      passes: (existingSkill?.passes ?? 0) + (outcome.passed ? 1 : 0),
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

  const day = today();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let streak = stats?.streak_days ?? 0;
  if (stats?.last_active !== day) {
    streak = stats?.last_active === yesterday ? streak + 1 : 1;
  }

  const newXp = (stats?.xp ?? 0) + xpAwarded;
  await supabase.from("stats").upsert({
    user_id: userId,
    xp: newXp,
    streak_days: streak,
    best_streak: Math.max(stats?.best_streak ?? 0, streak),
    last_active: day,
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

/** Pick a challenge matched to the student's current skill level, avoiding repeats. */
export async function pickChallenge(opts: {
  track: TrackKey;
  topic?: string;
  level: number;
  excludeIds?: string[];
}): Promise<Challenge | null> {
  let query = supabase.from("challenges").select("*").eq("track", opts.track);
  if (opts.topic) query = query.eq("topic", opts.topic);
  const { data } = await query;
  if (!data || data.length === 0) return null;

  const exclude = new Set(opts.excludeIds ?? []);
  const target = Math.round(opts.level);
  const fresh = data.filter((c) => !exclude.has(c.id));
  const pool = fresh.length ? fresh : data;

  // prefer challenges within one difficulty band of the student's level
  const near = pool.filter((c) => Math.abs(c.difficulty - target) <= 1);
  const chosenPool = near.length ? near : pool;
  return chosenPool[Math.floor(Math.random() * chosenPool.length)] as unknown as Challenge;
}
