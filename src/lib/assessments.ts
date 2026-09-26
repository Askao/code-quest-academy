/**
 * The rules behind assessments: building a paper from the question bank,
 * scoring a marked answer, and the timing. Kept free of Supabase/React
 * imports so it can be tested on its own (assessments.test.ts) - the pages
 * gather the data, this decides.
 */

export type Ability = 1 | 2 | 3;
export type Difficulty = "mixed" | "easier" | "harder";

/** What's needed to build a paper - deliberately no question text, so a
 * large pool can be listed cheaply and the wording fetched only for the
 * questions actually chosen. */
export type BankQuestionMeta = { id: string; topic: string; ability: Ability; marks: number };

export const ABILITY_LABEL: Record<Ability, string> = {
  1: "Accessible",
  2: "Core",
  3: "Stretch",
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  mixed: "Mixed - a spread from accessible to stretch",
  easier: "Easier - mostly accessible and core",
  harder: "Harder - mostly core and stretch",
};

/** How the questions on a paper are split between the three ability levels. */
const ABILITY_MIX: Record<Difficulty, Record<Ability, number>> = {
  mixed: { 1: 0.3, 2: 0.4, 3: 0.3 },
  easier: { 1: 0.5, 2: 0.35, 3: 0.15 },
  harder: { 1: 0.15, 2: 0.35, 3: 0.5 },
};

/** A save or submit is still accepted this long after the deadline - the
 * final autosave and the automatic submit at 0:00 shouldn't be lost to
 * network delay. Must match assessment_grace() in the migration. */
export const GRACE_MS = 45_000;

/** Whole-number targets per ability that sum to exactly `count`
 * (largest-remainder, so 8 questions at 30/40/30 is 2/3/3 not 2/3/2). */
function abilityTargets(count: number, difficulty: Difficulty): Record<Ability, number> {
  const mix = ABILITY_MIX[difficulty];
  const raw = ([1, 2, 3] as Ability[]).map((a) => ({ a, exact: count * mix[a] }));
  const targets = { 1: 0, 2: 0, 3: 0 } as Record<Ability, number>;
  for (const r of raw) targets[r.a] = Math.floor(r.exact);
  let left = count - raw.reduce((s, r) => s + Math.floor(r.exact), 0);
  const byRemainder = [...raw].sort(
    (x, y) => y.exact - Math.floor(y.exact) - (x.exact - Math.floor(x.exact)),
  );
  for (const r of byRemainder) {
    if (left <= 0) break;
    targets[r.a] += 1;
    left -= 1;
  }
  return targets;
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Take up to `n` from `pool`, cycling through the topics so a multi-topic
 * paper is a genuine mix rather than whichever topic shuffled first. */
function takeAcrossTopics(
  pool: BankQuestionMeta[],
  topicOrder: string[],
  n: number,
): BankQuestionMeta[] {
  const byTopic = new Map<string, BankQuestionMeta[]>(topicOrder.map((t) => [t, []]));
  for (const q of pool) byTopic.get(q.topic)?.push(q);
  const taken: BankQuestionMeta[] = [];
  while (taken.length < n) {
    let progressed = false;
    for (const t of topicOrder) {
      const next = byTopic.get(t)!.shift();
      if (next) {
        taken.push(next);
        progressed = true;
        if (taken.length === n) break;
      }
    }
    if (!progressed) break;
  }
  return taken;
}

/**
 * Pick `count` questions for a paper from the topics the teacher chose.
 * Split between ability levels per `difficulty`, spread across the topics,
 * and ordered easiest-to-hardest like a real paper. Returns fewer than
 * `count` only when the pool for those topics is smaller than that. Where a
 * level runs short (a topic with no stretch questions yet) the gap is filled
 * from the nearest other level instead of leaving the paper short.
 */
export function buildPaper(opts: {
  bank: BankQuestionMeta[];
  topics: string[];
  count: number;
  difficulty: Difficulty;
  random?: () => number;
}): BankQuestionMeta[] {
  const random = opts.random ?? Math.random;
  const chosenTopics =
    opts.topics.length > 0 ? opts.topics : [...new Set(opts.bank.map((q) => q.topic))];
  const candidates = opts.bank.filter((q) => chosenTopics.includes(q.topic));
  const count = Math.min(opts.count, candidates.length);
  if (count <= 0) return [];

  const topicOrder = shuffled(chosenTopics, random);
  const targets = abilityTargets(count, opts.difficulty);
  const remaining = new Set(candidates.map((q) => q.id));
  const picked: BankQuestionMeta[] = [];

  for (const a of [1, 2, 3] as Ability[]) {
    const pool = shuffled(
      candidates.filter((q) => q.ability === a && remaining.has(q.id)),
      random,
    );
    for (const q of takeAcrossTopics(pool, topicOrder, targets[a])) {
      picked.push(q);
      remaining.delete(q.id);
    }
  }

  // Top up any shortfall from whichever level is closest to the mix asked for.
  if (picked.length < count) {
    const wanted = (a: Ability) => ABILITY_MIX[opts.difficulty][a];
    const rest = shuffled(
      candidates.filter((q) => remaining.has(q.id)),
      random,
    ).sort((x, y) => wanted(y.ability) - wanted(x.ability));
    for (const q of takeAcrossTopics(rest, topicOrder, count - picked.length)) picked.push(q);
  }

  return sortForPaper(picked);
}

/** Easiest first, and within a level keep a topic's questions together. */
export function sortForPaper(questions: BankQuestionMeta[]): BankQuestionMeta[] {
  return [...questions].sort(
    (a, b) => a.ability - b.ability || a.topic.localeCompare(b.topic) || a.id.localeCompare(b.id),
  );
}

/**
 * Swap one question for another on the same topic and level if there is
 * one, else the same topic, else anything in the chosen topics. Returns null
 * when nothing else is available.
 */
export function replaceQuestion(opts: {
  bank: BankQuestionMeta[];
  topics: string[];
  paper: BankQuestionMeta[];
  index: number;
  random?: () => number;
}): BankQuestionMeta[] | null {
  const random = opts.random ?? Math.random;
  const old = opts.paper[opts.index];
  if (!old) return null;
  const onPaper = new Set(opts.paper.map((q) => q.id));
  const allowedTopics =
    opts.topics.length > 0 ? opts.topics : [...new Set(opts.bank.map((q) => q.topic))];
  const free = opts.bank.filter((q) => !onPaper.has(q.id) && allowedTopics.includes(q.topic));
  const tiers = [
    free.filter((q) => q.topic === old.topic && q.ability === old.ability),
    free.filter((q) => q.topic === old.topic),
    free.filter((q) => q.ability === old.ability),
    free,
  ];
  const pool = tiers.find((t) => t.length > 0);
  if (!pool) return null;
  const replacement = shuffled(pool, random)[0]!;
  return sortForPaper(opts.paper.map((q, i) => (i === opts.index ? replacement : q)));
}

/** About a minute a mark (a real GCSE paper is roughly 1.1), to the nearest 5. */
export function suggestedMinutes(totalMarks: number): number {
  return Math.max(10, Math.round((totalMarks * 1.1) / 5) * 5);
}

export type MarkPoint = { position: number; marks: number };

/**
 * A question's score: the marks of every point the teacher said YES to,
 * capped at what the question is worth - so an "any two of these four
 * points" scheme cannot award four.
 */
export function questionScore(
  points: MarkPoint[],
  awarded: ReadonlySet<number>,
  questionMarks: number,
): number {
  const earned = points.filter((p) => awarded.has(p.position)).reduce((s, p) => s + p.marks, 0);
  return Math.min(earned, questionMarks);
}

export type AttemptTimes = {
  startedAt: string | Date;
  submittedAt?: string | Date | null;
  markedAt?: string | Date | null;
};

export function deadlineOf(startedAt: string | Date, timeLimitMinutes: number): Date {
  return new Date(new Date(startedAt).getTime() + timeLimitMinutes * 60_000);
}

export type AttemptStatus = "not_started" | "writing" | "handed_in" | "marked";

/**
 * Where a student is with an assessment. "Writing" only while their time
 * hasn't run out and they haven't submitted; a student who never pressed
 * Submit is treated as handed in once their time (plus the grace) is gone,
 * because at that point the database refuses any more changes and marking
 * is allowed - the same rule mark_assessment_answer() enforces.
 */
export function attemptStatus(
  attempt: AttemptTimes | null | undefined,
  timeLimitMinutes: number,
  now: Date = new Date(),
): AttemptStatus {
  if (!attempt) return "not_started";
  if (attempt.markedAt) return "marked";
  if (attempt.submittedAt) return "handed_in";
  const over = now.getTime() > deadlineOf(attempt.startedAt, timeLimitMinutes).getTime() + GRACE_MS;
  return over ? "handed_in" : "writing";
}

/** "1:05:09" / "12:03" / "0:07" - a countdown clock. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
