/**
 * Building one student's personalised homework list. Kept free of any
 * Supabase/React imports so the rules can be tested on their own (see
 * homework-picks.test.ts) - the callers gather the data, this decides.
 */

export type PoolChallenge = { id: string; difficulty: number; topic?: string };

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
export function pickHomeworkSet(pool: PoolChallenge[], level: number, count: number): string[] {
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
 * The same, but for a student who has history: a task they've already
 * passed is never set again, and one they were already given in an earlier
 * homework is only reused as a last resort (they were set it and haven't
 * done it, so it isn't "new" - but it's still better than leaving a short
 * list). May return fewer than `count` if the pool is nearly exhausted for
 * this student; the caller should tell the teacher rather than pad it with
 * work they've already finished.
 */
export function pickFreshHomeworkSet(opts: {
  pool: PoolChallenge[];
  level: number;
  count: number;
  passed: ReadonlySet<string>;
  alreadyAssigned: ReadonlySet<string>;
}): string[] {
  const { pool, level, count, passed, alreadyAssigned } = opts;
  const notPassed = pool.filter((c) => !passed.has(c.id));
  const fresh = notPassed.filter((c) => !alreadyAssigned.has(c.id));

  const picked = pickHomeworkSet(fresh, level, count);
  if (picked.length >= count) return picked;

  const taken = new Set(picked);
  const reusable = notPassed.filter((c) => !taken.has(c.id));
  return [...picked, ...pickHomeworkSet(reusable, level, count - picked.length)];
}

/**
 * The skill level to pick a student's homework at: their average across the
 * topics the homework covers (2 for a topic they haven't started), or their
 * overall average when it covers every topic. Same rule whether the list is
 * built when the homework is set or later for someone who joined the class
 * afterwards.
 */
export function homeworkLevel(
  skills: { topic: string; track: string; level: number | string }[],
  track: string,
  topics: string[],
): number {
  const mine = skills.filter((k) => k.track === track);
  if (topics.length > 0) {
    return (
      topics.reduce((sum, t) => sum + Number(mine.find((k) => k.topic === t)?.level ?? 2), 0) /
      topics.length
    );
  }
  return mine.length ? mine.reduce((sum, k) => sum + Number(k.level), 0) / mine.length : 1;
}
