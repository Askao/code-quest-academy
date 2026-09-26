// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  analyseResults,
  bandFor,
  percentOf,
  questionLabel,
  type AnalysedAttempt,
  type AnalysedQuestion,
} from "./results-analysis.ts";

const q = (
  id: string,
  topic: string,
  marks: number,
  awarded: number,
  extra: Partial<AnalysedQuestion> = {},
): AnalysedQuestion => ({
  position: 1,
  question_id: id,
  topic,
  ability: 2,
  marks,
  marks_awarded: awarded,
  question: `State something about ${id}. [${marks}]`,
  comment: "",
  ...extra,
});

const attempt = (id: string, markedAt: string, questions: AnalysedQuestion[]): AnalysedAttempt => ({
  assessment_id: id,
  title: `Test ${id}`,
  board: "ocr",
  marked_at: markedAt,
  total_marks: questions.reduce((s, x) => s + x.marks, 0),
  marks_awarded: questions.reduce((s, x) => s + x.marks_awarded, 0),
  questions,
});

test("percentages round and never divide by zero", () => {
  assert.equal(percentOf(2, 3), 67);
  assert.equal(percentOf(0, 0), 0);
  assert.equal(percentOf(5, 5), 100);
});

test("bands: under half needs work, three-quarters is strong", () => {
  assert.equal(bandFor(0), "needs_work");
  assert.equal(bandFor(49), "needs_work");
  assert.equal(bandFor(50), "developing");
  assert.equal(bandFor(74), "developing");
  assert.equal(bandFor(75), "strong");
  assert.equal(bandFor(100), "strong");
});

test("overall marks add up across assessments", () => {
  const a = analyseResults([
    attempt("a1", "2026-09-20T10:00:00Z", [q("x", "iteration", 4, 3), q("y", "selection", 2, 2)]),
    attempt("a2", "2026-09-27T10:00:00Z", [q("z", "iteration", 6, 1)]),
  ]);
  assert.deepEqual(a.overall, {
    earned: 6,
    available: 12,
    percent: 50,
    band: "developing",
    assessments: 2,
  });
});

test("assessments are listed newest first with their own percentage", () => {
  const a = analyseResults([
    attempt("old", "2026-09-01T10:00:00Z", [q("x", "iteration", 4, 4)]),
    attempt("new", "2026-09-27T10:00:00Z", [q("y", "iteration", 4, 1)]),
  ]);
  assert.deepEqual(
    a.assessments.map((r) => [r.assessmentId, r.percent]),
    [
      ["new", 25],
      ["old", 100],
    ],
  );
});

test("topics are combined across assessments and listed weakest first", () => {
  const a = analyseResults([
    attempt("a1", "2026-09-20T10:00:00Z", [q("1", "iteration", 4, 4), q("2", "selection", 4, 1)]),
    attempt("a2", "2026-09-27T10:00:00Z", [q("3", "iteration", 4, 0), q("4", "functions", 2, 2)]),
  ]);
  assert.deepEqual(
    a.topics.map((t) => [t.topic, t.earned, t.available, t.percent, t.band, t.questions]),
    [
      ["selection", 1, 4, 25, "needs_work", 1],
      ["iteration", 4, 8, 50, "developing", 2],
      ["functions", 2, 2, 100, "strong", 1],
    ],
  );
});

test("a topic tie is broken by how many marks were at stake, then by name", () => {
  const a = analyseResults([
    attempt("a", "2026-09-27T10:00:00Z", [
      q("1", "beta", 2, 1),
      q("2", "alpha", 4, 2),
      q("3", "gamma", 4, 2),
    ]),
  ]);
  assert.deepEqual(
    a.topics.map((t) => t.topic),
    ["alpha", "gamma", "beta"],
  );
});

test("a question that got full marks is never in the revisit list", () => {
  const a = analyseResults([
    attempt("a", "2026-09-27T10:00:00Z", [
      q("full", "iteration", 3, 3),
      q("part", "iteration", 3, 2),
    ]),
  ]);
  assert.deepEqual(
    a.revisit.map((r) => r.questionId),
    ["part"],
  );
});

test("revisit lists the questions that lost the most marks first, and can be limited", () => {
  const a = analyseResults(
    [
      attempt("a", "2026-09-27T10:00:00Z", [
        q("small", "t", 2, 1),
        q("big", "t", 6, 0),
        q("mid", "t", 4, 1),
      ]),
    ],
    2,
  );
  assert.deepEqual(
    a.revisit.map((r) => [r.questionId, r.lost]),
    [
      ["big", 6],
      ["mid", 3],
    ],
  );
});

test("revisit keeps the teacher's comment and which assessment it came from", () => {
  const a = analyseResults([
    attempt("a1", "2026-09-27T10:00:00Z", [q("x", "iteration", 4, 1, { comment: "Say WHY." })]),
  ]);
  assert.equal(a.revisit[0]!.comment, "Say WHY.");
  assert.equal(a.revisit[0]!.assessmentId, "a1");
  assert.equal(a.revisit[0]!.assessmentTitle, "Test a1");
});

test("a score above what the question is worth is treated as full marks, not extra credit", () => {
  const a = analyseResults([attempt("a", "2026-09-27T10:00:00Z", [q("x", "iteration", 2, 5)])]);
  assert.equal(a.overall.earned, 2);
  assert.equal(a.revisit.length, 0);
});

test("no results gives an empty, safe analysis", () => {
  const a = analyseResults([]);
  assert.deepEqual(a.overall, {
    earned: 0,
    available: 0,
    percent: 0,
    band: "needs_work",
    assessments: 0,
  });
  assert.deepEqual([a.assessments, a.topics, a.revisit], [[], [], []]);
});

test("question labels skip code listings and scenarios to find what was actually asked", () => {
  const withCode =
    "The following program is written in OCR Exam Reference Language.\n\n```\ntotal = 0\nfor i = 1 to 4\n```\n\n(a) State the value that is output when the program is run. [1]\n\n(b) State the number of times the line is executed. [1]";
  assert.equal(
    questionLabel(withCode),
    "(a) State the value that is output when the program is run.",
  );
});

test("question labels drop markdown, the [n] marks and long tails", () => {
  assert.equal(
    questionLabel("Identify **two** types of loop (iteration) used in programming. [2]"),
    "Identify two types of loop (iteration) used in programming.",
  );
  const long = "Write a program " + "that does something quite involved ".repeat(10) + "[6]";
  const label = questionLabel(long, 60);
  assert.ok(label.length <= 60 && label.endsWith("…"));
});

test("question label falls back to the first paragraph when there is no command word", () => {
  assert.equal(
    questionLabel("A cinema sells tickets.\n\nSomething else."),
    "A cinema sells tickets.",
  );
});

test("question labels ignore the 'you may use pseudocode' boilerplate and a bare 'Write the program.'", () => {
  const q =
    "A teacher wants a program to help with marking. The program must:\n\n- ask for five marks\n- output the average. [6]\n\nWrite the program. You may use pseudocode or a high-level programming language.";
  assert.equal(
    questionLabel(q),
    "A teacher wants a program to help with marking. The program must:",
  );
  assert.equal(
    questionLabel(
      "Write a function called `areaRect` that returns the area. [4]\n\nYou may use pseudocode or a high-level programming language.",
    ),
    "Write a function called areaRect that returns the area.",
  );
});

test("every pilot question gets a meaningful label", async () => {
  const fs = await import("node:fs");
  for (const board of ["ocr", "aqa"]) {
    const qs = JSON.parse(
      fs.readFileSync(new URL(`../content/assessments/${board}.json`, import.meta.url), "utf8"),
    ) as { id: string; question: string }[];
    for (const x of qs) {
      const label = questionLabel(x.question);
      assert.ok(label.length >= 25, `${x.id}: label too short -> "${label}"`);
      assert.ok(!/^You may use/i.test(label), `${x.id}: boilerplate label`);
    }
  }
});
