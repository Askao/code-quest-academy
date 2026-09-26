// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  attemptStatus,
  buildPaper,
  deadlineOf,
  formatClock,
  GRACE_MS,
  questionScore,
  replaceQuestion,
  sortForPaper,
  splitQuestionParts,
  joinPartAnswers,
  splitPartAnswers,
  suggestedMinutes,
  type Ability,
  type BankQuestionMeta,
} from "./assessments.ts";

// A deterministic random source so a failing test can be reproduced.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const bank = (topic: string, perAbility = 6): BankQuestionMeta[] =>
  ([1, 2, 3] as Ability[]).flatMap((a) =>
    Array.from({ length: perAbility }, (_, i) => ({
      id: `${topic}-${a}-${i}`,
      topic,
      ability: a,
      marks: a === 1 ? 2 : a === 2 ? 4 : 6,
    })),
  );

const abilityCount = (paper: BankQuestionMeta[], a: Ability) =>
  paper.filter((q) => q.ability === a).length;

test("a paper has the number of questions asked for, with no repeats", () => {
  for (let seed = 1; seed <= 50; seed++) {
    const paper = buildPaper({
      bank: bank("iteration"),
      topics: ["iteration"],
      count: 8,
      difficulty: "mixed",
      random: seeded(seed),
    });
    assert.equal(paper.length, 8);
    assert.equal(new Set(paper.map((q) => q.id)).size, 8);
  }
});

test("mixed splits roughly 30/40/30, and always adds up exactly", () => {
  for (const count of [3, 5, 8, 10, 12, 15]) {
    const paper = buildPaper({
      bank: bank("iteration", 10),
      topics: ["iteration"],
      count,
      difficulty: "mixed",
      random: seeded(count),
    });
    assert.equal(paper.length, count);
  }
  const ten = buildPaper({
    bank: bank("iteration", 10),
    topics: ["iteration"],
    count: 10,
    difficulty: "mixed",
    random: seeded(3),
  });
  assert.deepEqual(
    [1, 2, 3].map((a) => abilityCount(ten, a as Ability)),
    [3, 4, 3],
  );
});

test("easier leans accessible and harder leans stretch", () => {
  const easy = buildPaper({
    bank: bank("iteration", 10),
    topics: ["iteration"],
    count: 10,
    difficulty: "easier",
    random: seeded(4),
  });
  const hard = buildPaper({
    bank: bank("iteration", 10),
    topics: ["iteration"],
    count: 10,
    difficulty: "harder",
    random: seeded(4),
  });
  assert.ok(abilityCount(easy, 1) > abilityCount(easy, 3));
  assert.ok(abilityCount(hard, 3) > abilityCount(hard, 1));
});

test("only the chosen topics are used, and they are all represented", () => {
  const all = [...bank("iteration"), ...bank("selection"), ...bank("functions")];
  for (let seed = 1; seed <= 30; seed++) {
    const paper = buildPaper({
      bank: all,
      topics: ["iteration", "selection"],
      count: 9,
      difficulty: "mixed",
      random: seeded(seed),
    });
    const topics = new Set(paper.map((q) => q.topic));
    assert.deepEqual([...topics].sort(), ["iteration", "selection"]);
  }
});

test("topics are shared out fairly across the paper", () => {
  const all = [...bank("iteration", 10), ...bank("selection", 10), ...bank("functions", 10)];
  const paper = buildPaper({
    bank: all,
    topics: ["iteration", "selection", "functions"],
    count: 12,
    difficulty: "mixed",
    random: seeded(9),
  });
  const perTopic = ["iteration", "selection", "functions"].map(
    (t) => paper.filter((q) => q.topic === t).length,
  );
  assert.ok(Math.max(...perTopic) - Math.min(...perTopic) <= 2, `lopsided: ${perTopic}`);
});

test("no topics selected means every topic in the bank", () => {
  const all = [...bank("iteration"), ...bank("selection")];
  const paper = buildPaper({
    bank: all,
    topics: [],
    count: 10,
    difficulty: "mixed",
    random: seeded(2),
  });
  assert.equal(new Set(paper.map((q) => q.topic)).size, 2);
});

test("a paper is ordered easiest to hardest", () => {
  const paper = buildPaper({
    bank: bank("iteration", 8),
    topics: ["iteration"],
    count: 9,
    difficulty: "mixed",
    random: seeded(5),
  });
  const abilities = paper.map((q) => q.ability);
  assert.deepEqual(
    abilities,
    [...abilities].sort((a, b) => a - b),
  );
});

test("when a level runs short the paper is filled from another level, not left short", () => {
  const noStretch = bank("iteration", 6).filter((q) => q.ability !== 3);
  const paper = buildPaper({
    bank: noStretch,
    topics: ["iteration"],
    count: 10,
    difficulty: "harder",
    random: seeded(6),
  });
  assert.equal(paper.length, 10);
  assert.ok(paper.every((q) => q.ability !== 3));
});

test("asking for more than exist returns everything available, once", () => {
  const small = bank("iteration", 1); // 3 questions
  const paper = buildPaper({
    bank: small,
    topics: ["iteration"],
    count: 20,
    difficulty: "mixed",
    random: seeded(7),
  });
  assert.equal(paper.length, 3);
});

test("an empty pool gives an empty paper", () => {
  assert.deepEqual(
    buildPaper({ bank: [], topics: ["iteration"], count: 5, difficulty: "mixed" }),
    [],
  );
  assert.deepEqual(
    buildPaper({ bank: bank("selection"), topics: ["iteration"], count: 5, difficulty: "mixed" }),
    [],
  );
});

test("swapping a question prefers the same topic and level and never duplicates", () => {
  const all = bank("iteration", 8);
  const paper = buildPaper({
    bank: all,
    topics: ["iteration"],
    count: 6,
    difficulty: "mixed",
    random: seeded(8),
  });
  for (let i = 0; i < paper.length; i++) {
    const swapped = replaceQuestion({
      bank: all,
      topics: ["iteration"],
      paper,
      index: i,
      random: seeded(i + 1),
    })!;
    assert.equal(swapped.length, paper.length);
    assert.equal(new Set(swapped.map((q) => q.id)).size, swapped.length);
    assert.ok(!swapped.some((q) => q.id === paper[i]!.id), "old question is still there");
    const added = swapped.find((q) => !paper.some((p) => p.id === q.id))!;
    assert.equal(added.topic, paper[i]!.topic);
    assert.equal(added.ability, paper[i]!.ability);
  }
});

test("swapping falls back when the same level is used up, and returns null when nothing is left", () => {
  const two = [
    { id: "a", topic: "t", ability: 1 as Ability, marks: 1 },
    { id: "b", topic: "t", ability: 2 as Ability, marks: 3 },
    { id: "c", topic: "t", ability: 3 as Ability, marks: 6 },
  ];
  const swapped = replaceQuestion({
    bank: two,
    topics: ["t"],
    paper: [two[0]!, two[1]!],
    index: 0,
    random: seeded(1),
  })!;
  assert.deepEqual(swapped.map((q) => q.id).sort(), ["b", "c"]);
  assert.equal(replaceQuestion({ bank: two, topics: ["t"], paper: two, index: 0 }), null);
});

test("suggested time is about a minute a mark, in 5-minute steps, never under 10", () => {
  assert.equal(suggestedMinutes(4), 10);
  assert.equal(suggestedMinutes(30), 35); // 33 -> 35
  assert.equal(suggestedMinutes(40), 45); // 44 -> 45
  assert.equal(suggestedMinutes(80), 90); // a full GCSE paper: 1h30
});

test("a question's score is the YES marks, capped at the question's marks", () => {
  const points = [1, 2, 3, 4].map((position) => ({ position, marks: 1 }));
  assert.equal(questionScore(points, new Set(), 2), 0);
  assert.equal(questionScore(points, new Set([1]), 2), 1);
  assert.equal(questionScore(points, new Set([1, 2]), 2), 2);
  assert.equal(questionScore(points, new Set([1, 2, 3, 4]), 2), 2, "any-2-from-4 must cap at 2");
  assert.equal(
    questionScore(
      [
        { position: 1, marks: 2 },
        { position: 2, marks: 1 },
      ],
      new Set([1, 2]),
      3,
    ),
    3,
  );
  assert.equal(questionScore(points, new Set([99]), 2), 0, "an unknown point earns nothing");
});

test("attempt status follows the timer, submission and marking", () => {
  const started = new Date("2026-09-26T10:00:00Z");
  const at = (mins: number, secs = 0) => new Date(started.getTime() + mins * 60_000 + secs * 1000);
  assert.equal(attemptStatus(null, 30), "not_started");
  assert.equal(attemptStatus({ startedAt: started }, 30, at(10)), "writing");
  assert.equal(
    attemptStatus({ startedAt: started }, 30, at(30, 30)),
    "writing",
    "inside the grace it is still writing",
  );
  assert.equal(
    attemptStatus({ startedAt: started }, 30, at(31)),
    "handed_in",
    "out of time counts as handed in",
  );
  assert.equal(attemptStatus({ startedAt: started, submittedAt: at(12) }, 30, at(13)), "handed_in");
  assert.equal(
    attemptStatus({ startedAt: started, submittedAt: at(12), markedAt: at(90) }, 30, at(100)),
    "marked",
  );
  assert.ok(GRACE_MS === 45_000, "must match assessment_grace() in the migration");
});

test("deadline is start plus the time limit", () => {
  assert.equal(deadlineOf("2026-09-26T10:00:00Z", 45).toISOString(), "2026-09-26T10:45:00.000Z");
});

test("the countdown clock formats sensibly and never goes negative", () => {
  assert.equal(formatClock(0), "0:00");
  assert.equal(formatClock(-5000), "0:00");
  assert.equal(formatClock(7_000), "0:07");
  assert.equal(formatClock(723_000), "12:03");
  assert.equal(formatClock(3_909_000), "1:05:09");
  assert.equal(
    formatClock(59_100),
    "1:00",
    "rounds a part-second up so it never shows 0:00 with time left",
  );
});

test("sortForPaper is stable and does not change its input", () => {
  const input = [
    { id: "b", topic: "t", ability: 3 as Ability, marks: 6 },
    { id: "a", topic: "t", ability: 1 as Ability, marks: 1 },
  ];
  const copy = [...input];
  assert.deepEqual(
    sortForPaper(input).map((q) => q.id),
    ["a", "b"],
  );
  assert.deepEqual(input, copy);
});

const F = "```";
const threeParts = `The following program is written in pseudo-code.\n\n${F}\nx ← 1\n\ny ← 2\n${F}\n\n(a) State the value of x. [1]\n\n(b) State the value of y. [1]\n\n(c) State the sum. [1]`;

test("a question with (a) (b) (c) splits into a stem and one part each", () => {
  const q = splitQuestionParts(threeParts)!;
  assert.deepEqual(
    q.parts.map((p) => p.label),
    ["a", "b", "c"],
  );
  assert.ok(
    q.stem.includes("x ← 1") && q.stem.includes("y ← 2"),
    "the code stays in the stem, blank line and all",
  );
  assert.equal(q.parts[0]!.text, "(a) State the value of x. [1]");
  assert.equal(q.parts[2]!.text, "(c) State the sum. [1]");
});

test("trailing text after the last part stays with that part", () => {
  const q = splitQuestionParts(
    "Intro.\n\n(a) Write a function. [4]\n\n(b) Write the program. [2]\n\nYou may use pseudocode.",
  )!;
  assert.equal(q.parts.length, 2);
  assert.ok(q.parts[1]!.text.endsWith("You may use pseudocode."));
});

test("ordinary questions and stray '(a)' text are not split", () => {
  assert.equal(splitQuestionParts("State what is meant by selection. [1]"), null);
  assert.equal(splitQuestionParts("Explain option (a) in the table. [2]"), null);
  assert.equal(
    splitQuestionParts("Intro.\n\n(a) Only one part. [2]"),
    null,
    "one part is not a split",
  );
  assert.equal(
    splitQuestionParts("(b) First. [1]\n\n(a) Second. [1]"),
    null,
    "parts must run a, b, c in order",
  );
});

test("part answers join under their labels and split back exactly", () => {
  const labels = ["a", "b", "c"];
  const joined = joinPartAnswers(labels, ["10", "4 times", "It adds them up"]);
  assert.equal(joined, "(a) 10\n\n(b) 4 times\n\n(c) It adds them up");
  assert.deepEqual(splitPartAnswers(joined, labels), ["10", "4 times", "It adds them up"]);
});

test("a blank middle part, multi-line code and text that mentions '(b)' all survive a round trip", () => {
  const labels = ["a", "b", "c"];
  const values = ["", "for i = 1 to 3\n    print(i)\n\nnext i", "see (b) above, and (c) too"];
  const back = splitPartAnswers(joinPartAnswers(labels, values), labels);
  assert.deepEqual(back, values);
});

test("nothing written in any part is stored as empty so it counts as unanswered", () => {
  assert.equal(joinPartAnswers(["a", "b"], ["", "  \n"]), "");
  assert.deepEqual(splitPartAnswers("", ["a", "b"]), ["", ""]);
});

test("an answer not stored in part form goes into the first box instead of being lost", () => {
  assert.deepEqual(splitPartAnswers("just one lump of text", ["a", "b", "c"]), [
    "just one lump of text",
    "",
    "",
  ]);
});
