/** The exam board a GCSE class or self-learner is working to. Only GCSE has
 * more than one board in H-Code - A level has no board concept at all. */
export type Board = "ocr" | "aqa";

export const GCSE_TOPICS = [
  {
    key: "getting-started",
    label: "Getting started",
    blurb: "Using the IDE, print(), input() and joining text",
  },
  {
    key: "fundamentals",
    label: "Data types & variables",
    blurb: "Variables, data types, casting, input and output",
  },
  { key: "sequencing", label: "Sequencing", blurb: "Input, output, variables, arithmetic" },
  { key: "selection", label: "Selection", blurb: "if / elif / else and conditions" },
  { key: "iteration", label: "Iteration", blurb: "for and while loops" },
  {
    key: "combining-techniques",
    label: "Combining techniques",
    blurb: "Putting sequencing, selection and iteration together",
    // Lesson-only: reachable through /learn, but deliberately left out of
    // Practice's random topic-picker and boss battles (see practice.tsx) -
    // it doesn't teach any new skill of its own, just combines the three
    // topics before it, so there's nothing for it to be "practised" on that
    // Iteration/Selection practice doesn't already cover.
    practiceExcluded: true,
  },
  { key: "lists", label: "Lists & arrays", blurb: "1D and 2D lists, searching" },
  { key: "strings", label: "Strings", blurb: "Manipulation and string handling" },
  { key: "functions", label: "Subprograms", blurb: "Functions and procedures" },
  { key: "files", label: "File handling", blurb: "Reading and writing text files" },
  {
    key: "databases",
    label: "Databases & SQL",
    blurb: "Relational databases, tables and SQL queries",
    // AQA-only: OCR's spec has no relational-database content at all (OCR's
    // own "Moving from AQA" guide lists it under "you will not need to
    // teach this"), so this topic - and only this one - is gated by board
    // rather than being available to every GCSE class like the rest.
    boards: ["aqa"] as const,
  },
  {
    key: "capstone",
    label: "Capstone Projects",
    blurb: "Bigger, harder builds that combine everything you've learned",
    // No lessons of its own and no random practice pool - Projects only,
    // reached from the Projects section once its own unlock condition
    // (finishing the Subprograms project, not a lesson) is met. See the
    // special-cased unlock check for this one topic in practice.tsx.
    practiceExcluded: true,
  },
] as const;

export const ALEVEL_TOPICS = [
  { key: "recursion", label: "Recursion", blurb: "Base cases and recursive calls" },
  { key: "oop", label: "Object-oriented", blurb: "Classes, objects, inheritance" },
  { key: "algorithms", label: "Algorithms", blurb: "Sorting and searching" },
  { key: "data structures", label: "Data structures", blurb: "Stacks, queues and more" },
] as const;

export type TrackKey = "gcse" | "alevel";

/** `board` only matters for GCSE topics tagged with a `boards` allow-list
 * (currently just "databases") - everything else is common to both boards,
 * so it's shown regardless of which one is passed. Omit `board` (or pass
 * nothing) to get every GCSE topic, board-gating included, which is what
 * anywhere not board-aware yet (still being migrated) should keep doing. */
export function topicsFor(track: TrackKey, board?: Board) {
  if (track === "alevel") return [...ALEVEL_TOPICS];
  if (!board) return [...GCSE_TOPICS];
  return GCSE_TOPICS.filter(
    (t) => !("boards" in t) || (t.boards as readonly Board[]).includes(board),
  );
}

export function topicLabel(topic: string) {
  return (
    [...GCSE_TOPICS, ...ALEVEL_TOPICS].find((t) => t.key === topic)?.label ??
    topic.charAt(0).toUpperCase() + topic.slice(1)
  );
}

/** XP curve: level n needs 100 * n XP more than the previous level. */
export function levelFromXp(xp: number) {
  let level = 1;
  let needed = 100;
  let remaining = xp;
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = level * 100;
  }
  return { level, intoLevel: remaining, needed };
}

export const SKILL_LABELS = ["Getting started", "Developing", "Secure", "Confident", "Mastery"];

export function skillLabel(level: number) {
  return SKILL_LABELS[Math.min(4, Math.max(0, Math.round(level) - 1))]!;
}

/**
 * Skill level is stored 1-5 internally (1 = untouched, since that's the
 * adaptive engine's starting point), which reads as "already 20% done"
 * if shown as a raw fraction. For display, remap to 0-100% so an
 * untouched topic reads as 0% and full mastery (level 5) reads as 100%.
 */
export function skillPercent(level: number) {
  const clamped = Math.min(5, Math.max(1, level));
  return Math.round(((clamped - 1) / 4) * 100);
}

export const BADGES: Record<string, { name: string; description: string; icon: string }> = {
  first_pass: { name: "First light", description: "Passed your first challenge", icon: "🌱" },
  ten_pass: { name: "Ten up", description: "Passed 10 challenges", icon: "🔟" },
  streak_3: { name: "On a roll", description: "3 day practice streak", icon: "🔥" },
  streak_7: { name: "Unstoppable", description: "7 day practice streak", icon: "⚡" },
  topic_master: { name: "Topic master", description: "Reached mastery in a topic", icon: "🏅" },
  boss_slayer: { name: "Boss slayer", description: "Won a boss battle", icon: "👑" },
  duel_winner: { name: "Duellist", description: "Won a head-to-head duel", icon: "⚔️" },
  night_owl: { name: "Night owl", description: "Practised after 10pm", icon: "🦉" },
};

export function xpForAttempt(baseXp: number, firstTry: boolean, mode: string) {
  let xp = baseXp;
  if (firstTry) xp = Math.round(xp * 1.5);
  if (mode === "boss") xp = Math.round(xp * 1.25);
  if (mode === "duel") xp = Math.round(xp * 1.25);
  return xp;
}
