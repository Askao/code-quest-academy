import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clampCount,
  decisionsOf,
  defaultTitle,
  markingProgress,
  paperScore,
  paperState,
  pointsPayload,
  scoreOf,
  toAnalysed,
  totalsFor,
  type MarkSchemePoint,
  type OpenedPaper,
  type RevisionQuestion,
} from "./revision.ts";
import { analyseResults } from "./results-analysis.ts";

const rows = [
  { topic: "iteration", available: 10, missed: 3, unseen: 4 },
  { topic: "selection", available: 6, missed: 0, unseen: 6 },
  { topic: "functions", available: 8, missed: 5, unseen: 1 },
];

test("totals: no topics chosen means every topic", () => {
  assert.deepEqual(totalsFor(rows, []), { available: 24, missed: 8, unseen: 11 });
});

test("totals: only the chosen topics count", () => {
  assert.deepEqual(totalsFor(rows, ["iteration", "functions"]), {
    available: 18,
    missed: 8,
    unseen: 5,
  });
  assert.deepEqual(totalsFor(rows, ["nothing"]), { available: 0, missed: 0, unseen: 0 });
});

test("you can't ask for more questions than exist", () => {
  assert.equal(clampCount(20, 12), 12);
  assert.equal(clampCount(8, 12), 8);
  assert.equal(clampCount(8, 0), 0);
});

test("default title names the board and topics", () => {
  const label = (t: string) => t[0]!.toUpperCase() + t.slice(1);
  assert.equal(defaultTitle("ocr", [], label), "OCR revision: mixed topics");
  assert.equal(defaultTitle("aqa", ["iteration"], label), "AQA revision: Iteration");
  assert.equal(
    defaultTitle("aqa", ["iteration", "lists"], label),
    "AQA revision: Iteration & Lists",
  );
  assert.equal(defaultTitle("ocr", ["a", "b", "c"], label), "OCR revision: 3 topics");
});

const point = (
  position: number,
  marks: number,
  awarded: boolean | null = null,
): MarkSchemePoint => ({
  position,
  text: `point ${position}`,
  marks,
  guidance: "",
  awarded,
});

test("score is the awarded points, capped at the question's marks", () => {
  const scheme = [point(1, 1), point(2, 1), point(3, 1), point(4, 1)]; // any 2 from 4
  assert.equal(scoreOf(scheme, { 1: true, 2: false, 3: null, 4: null }, 2), 1);
  assert.equal(scoreOf(scheme, { 1: true, 2: true, 3: true, 4: true }, 2), 2, "capped");
  assert.equal(scoreOf(scheme, {}, 2), 0);
});

test("an undecided point is sent as NO", () => {
  const scheme = [point(1, 1), point(2, 2)];
  assert.deepEqual(pointsPayload(scheme, { 1: true, 2: null }), [
    { position: 1, awarded: true },
    { position: 2, awarded: false },
  ]);
});

test("earlier decisions are picked back up", () => {
  assert.deepEqual(decisionsOf([point(1, 1, true), point(2, 1, false), point(3, 1, null)]), {
    1: true,
    2: false,
    3: null,
  });
});

const q = (over: Partial<RevisionQuestion>): RevisionQuestion => ({
  position: 1,
  question_id: "ocr-iteration-01",
  topic: "iteration",
  ability: 1,
  marks: 4,
  answer_format: "text",
  question: "State **two** types of loop. [4]",
  was_weak: false,
  answer: "",
  marked: true,
  marks_awarded: 0,
  mark_scheme: null,
  ...over,
});
const paper = (questions: RevisionQuestion[], over: Partial<OpenedPaper> = {}): OpenedPaper => ({
  id: "p1",
  title: "Loops",
  board: "ocr",
  topics: [],
  time_limit_minutes: null,
  total_marks: questions.reduce((s, x) => s + x.marks, 0),
  weak_count: 0,
  started_at: "2026-10-01T10:00:00Z",
  submitted_at: "2026-10-01T10:30:00Z",
  marked_at: "2026-10-01T10:45:00Z",
  server_now: "2026-10-01T11:00:00Z",
  questions,
  ...over,
});

test("paper score only counts questions that have been marked", () => {
  const qs = [
    q({ marks: 4, marks_awarded: 3 }),
    q({ position: 2, question_id: "b", marks: 2, marks_awarded: 2, marked: false }),
  ];
  assert.deepEqual(paperScore(qs), { earned: 3, available: 6, percent: 50 });
});

test("an over-generous stored score can't push the total past what's available", () => {
  assert.equal(paperScore([q({ marks: 2, marks_awarded: 9 })]).earned, 2);
});

test("marking progress", () => {
  const qs = [q({ marked: true }), q({ position: 2, question_id: "b", marked: false })];
  assert.deepEqual(markingProgress(qs), { marked: 1, total: 2, done: false });
  assert.equal(markingProgress([q({ marked: true })]).done, true);
  assert.equal(markingProgress([]).done, false);
});

test("a finished paper feeds the same analysis as a teacher-marked assessment", () => {
  const qs = [
    q({ question_id: "a", topic: "iteration", marks: 4, marks_awarded: 1 }),
    q({ position: 2, question_id: "b", topic: "lists", marks: 2, marks_awarded: 2 }),
  ];
  const analysis = analyseResults([toAnalysed(paper(qs))]);
  assert.equal(analysis.overall.earned, 3);
  assert.equal(analysis.overall.available, 6);
  assert.equal(analysis.topics[0]!.topic, "iteration", "weakest topic first");
  assert.equal(analysis.revisit.length, 1);
  assert.equal(analysis.revisit[0]!.questionId, "a");
  assert.equal(analysis.revisit[0]!.lost, 3);
});

test("paper state for the history list", () => {
  assert.equal(paperState({ submitted_at: null, marked_at: null }), "in_progress");
  assert.equal(paperState({ submitted_at: "x", marked_at: null }), "to_mark");
  assert.equal(paperState({ submitted_at: "x", marked_at: null, marked_questions: 2 }), "marking");
  assert.equal(paperState({ submitted_at: "x", marked_at: "y" }), "marked");
});
