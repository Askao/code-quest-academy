// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assessmentMatrixRows,
  classSummary,
  overallRows,
  questionLevelRows,
  studentAssessmentRows,
  studentHomework,
  studentReport,
  topicOverview,
  type ReportData,
  type ReportHomework,
  type ReportStudent,
} from "./class-report.ts";
import { toCsv } from "./csv.ts";

const now = new Date("2026-09-28T12:00:00Z");
const day = (n: number) => new Date(now.getTime() + n * 86_400_000).toISOString();

const student = (id: string, name: string, extra: Partial<ReportStudent> = {}): ReportStudent => ({
  id,
  name,
  xp: 250,
  accuracy: 70,
  avg: 2,
  lastActive: day(-1),
  struggling: false,
  readyForMore: false,
  skills: [],
  practiceTotals: { done: 5, total: 20 },
  projectTotals: { done: 0, total: 0 },
  ...extra,
});
const ann = student("ann", "Ann Adams");
const ben = student("ben", "Ben Brown", { struggling: true });
const cai = student("cai", "Cai Clarke");
const students = [ann, ben, cai];

// Two assessments. A1: q1 (iteration, 4), q2 (iteration, 2), q3 (selection, 4). A2: q4 (functions, 6), q5 (selection, 2).
const data: ReportData = {
  assessments: [
    {
      id: "A1",
      title: "Loops & choices",
      board: "ocr",
      time_limit_minutes: 30,
      closes_at: day(-10),
      results_released: true,
      created_at: day(-20),
      items: ["q1", "q2", "q3"],
    },
    {
      id: "A2",
      title: "Subprograms",
      board: "ocr",
      time_limit_minutes: 30,
      closes_at: null,
      results_released: false,
      created_at: day(-5),
      items: ["q4", "q5"],
    },
  ],
  questions: {
    q1: {
      id: "q1",
      topic: "iteration",
      ability: 2,
      marks: 4,
      question: "Write a program that counts to ten. [4]",
    },
    q2: {
      id: "q2",
      topic: "iteration",
      ability: 1,
      marks: 2,
      question: "State two types of loop. [2]",
    },
    q3: {
      id: "q3",
      topic: "selection",
      ability: 2,
      marks: 4,
      question: "Write a program that grades a mark. [4]",
    },
    q4: {
      id: "q4",
      topic: "functions",
      ability: 3,
      marks: 6,
      question: "Write a function that returns the area. [6]",
    },
    q5: {
      id: "q5",
      topic: "selection",
      ability: 1,
      marks: 2,
      question: "State what an ELSE clause does. [2]",
    },
  },
  attempts: [
    {
      id: "t-ann-1",
      assessment_id: "A1",
      student_id: "ann",
      started_at: day(-19),
      submitted_at: day(-19),
      marked_at: day(-18),
    },
    {
      id: "t-ann-2",
      assessment_id: "A2",
      student_id: "ann",
      started_at: day(-4),
      submitted_at: day(-4),
      marked_at: day(-3),
    },
    {
      id: "t-ben-1",
      assessment_id: "A1",
      student_id: "ben",
      started_at: day(-19),
      submitted_at: day(-19),
      marked_at: day(-18),
    },
    {
      id: "t-ben-2",
      assessment_id: "A2",
      student_id: "ben",
      started_at: day(-4),
      submitted_at: day(-4),
      marked_at: null,
    },
  ],
  answers: [
    { attempt_id: "t-ann-1", question_id: "q1", marks_awarded: 4, teacher_comment: "" },
    { attempt_id: "t-ann-1", question_id: "q2", marks_awarded: 2, teacher_comment: "" },
    {
      attempt_id: "t-ann-1",
      question_id: "q3",
      marks_awarded: 3,
      teacher_comment: "Check the boundary.",
    },
    {
      attempt_id: "t-ann-2",
      question_id: "q4",
      marks_awarded: 2,
      teacher_comment: "You printed instead of returning.",
    },
    { attempt_id: "t-ann-2", question_id: "q5", marks_awarded: 2, teacher_comment: "" },
    { attempt_id: "t-ben-1", question_id: "q1", marks_awarded: 1, teacher_comment: "" },
    { attempt_id: "t-ben-1", question_id: "q2", marks_awarded: 1, teacher_comment: "" },
    { attempt_id: "t-ben-1", question_id: "q3", marks_awarded: 0, teacher_comment: "" },
  ],
};

const homework: ReportHomework[] = [
  {
    id: "h1",
    title: "Loops homework",
    due_at: day(-3),
    completion: [
      { id: "ann", done: 4, total: 4 },
      { id: "ben", done: 1, total: 4 },
      { id: "cai", done: 0, total: 4 },
    ],
  },
  {
    id: "h2",
    title: "Selection homework",
    due_at: day(4),
    completion: [
      { id: "ann", done: 2, total: 4 },
      { id: "ben", done: 0, total: 4 },
      { id: "cai", done: 0, total: 0 },
    ],
  },
];

test("a student's assessment rows show marks where marked, otherwise where they are up to", () => {
  const rows = studentAssessmentRows("ben", data, now);
  assert.deepEqual(
    rows.map((r) => [r.title, r.status, r.earned, r.available, r.percent]),
    [
      ["Subprograms", "handed_in", null, 8, null],
      ["Loops & choices", "marked", 2, 10, 20],
    ],
  );
});

test("a student who never started a closed assessment is flagged as closed and not started", () => {
  const rows = studentAssessmentRows("cai", data, now);
  const a1 = rows.find((r) => r.assessmentId === "A1")!;
  assert.equal(a1.status, "not_started");
  assert.equal(a1.closed, true);
  assert.equal(rows.find((r) => r.assessmentId === "A2")!.closed, false);
});

test("a student's homework adds up across every homework, and overdue unfinished is counted", () => {
  const h = studentHomework("ben", homework, now);
  assert.deepEqual([h.done, h.total, h.percent, h.overdueUnfinished], [1, 8, 13, 1]);
  const a = studentHomework("ann", homework, now);
  assert.deepEqual([a.done, a.total, a.percent, a.overdueUnfinished], [6, 8, 75, 0]);
});

test("a student with no homework assigned yet has no homework percentage", () => {
  const h = studentHomework("nobody", homework, now);
  assert.deepEqual([h.done, h.total, h.percent], [0, 0, null]);
});

test("topic overview blends assessment and practice, weakest first", () => {
  const rep = studentReport(
    student("ben", "Ben Brown", {
      skills: [
        { topic: "functions", track: "gcse", level: 1 },
        { topic: "iteration", track: "gcse", level: 5 },
      ],
    }),
    data,
    homework,
    "gcse",
    now,
  );
  // Ben: iteration 2/6 = 33% assessed, selection 0/4 = 0%; functions only has practice (level 1 -> 0%)
  assert.deepEqual(
    rep.topics.map((t) => [t.topic, t.assessmentPercent, t.practicePercent, t.band]),
    [
      ["functions", null, 0, "needs_work"],
      ["selection", 0, null, "needs_work"],
      ["iteration", 33, 100, "needs_work"],
    ],
  );
});

test("topic overview ignores other tracks' skills and topics with no evidence at all", () => {
  const rows = topicOverview([], [{ topic: "oop", track: "alevel", level: 3 }], "gcse");
  assert.deepEqual(rows, []);
});

test("the student summary is plain English with the name, weakest topics and homework", () => {
  const rep = studentReport(ben, data, homework, "gcse", now, (t) => t.toUpperCase());
  assert.match(rep.summary[0]!, /^Ben Brown has scored 2\/10 \(20%\) across 1 marked assessment\./);
  assert.ok(
    rep.summary.some((s) => /Needs most help with: SELECTION \(0%\), ITERATION \(33%\)/.test(s)),
    rep.summary.join(" | "),
  );
  assert.ok(
    rep.summary.some((s) =>
      /Homework: 1 of 8 tasks done \(13%\), with 1 overdue and unfinished\./.test(s),
    ),
  );
  assert.ok(rep.summary.includes("Flagged as struggling in practice."));
  assert.ok(!rep.summary.join(" ").match(/\b(he|she|his|her|him)\b/i), "no gendered pronouns");
});

test("a student with only unmarked work is told so, not 'no assessments'", () => {
  const onlyWaiting: ReportData = {
    ...data,
    attempts: data.attempts.filter((t) => t.id === "t-ben-2"),
  };
  const rep = studentReport(ben, onlyWaiting, [], "gcse", now);
  assert.match(rep.summary[0]!, /handed in 1 assessment that is waiting to be marked/);
  const none = studentReport(cai, { ...data, attempts: [] }, [], "gcse", now);
  assert.match(none.summary[0]!, /no marked assessments yet/);
});

test("class summary: assessment totals, per-assessment averages and status counts", () => {
  const c = classSummary(students, data, homework, "gcse", now);
  // Ann: A1 9/10, A2 4/8 ; Ben: A1 2/10 -> 15/28
  assert.deepEqual(
    [
      c.assessments.earned,
      c.assessments.available,
      c.assessments.percent,
      c.assessments.markedAttempts,
    ],
    [15, 28, 54, 3],
  );
  const a1 = c.assessments.list.find((a) => a.assessmentId === "A1")!;
  assert.deepEqual(
    [a1.marked, a1.notStarted, a1.avgPercent, a1.lowestPercent, a1.highestPercent],
    [2, 1, 55, 20, 90],
  );
  const a2 = c.assessments.list.find((a) => a.assessmentId === "A2")!;
  assert.deepEqual([a2.marked, a2.waitingToMark, a2.notStarted], [1, 1, 1]);
});

test("class summary: topics combine everyone's marked work, weakest first, with how many students are below 50%", () => {
  const c = classSummary(students, data, homework, "gcse", now);
  assert.deepEqual(
    c.topics.map((t) => [
      t.topic,
      t.earned,
      t.available,
      t.percent,
      t.studentsBelow50,
      t.studentsWithData,
    ]),
    [
      ["functions", 2, 6, 33, 1, 1],
      ["selection", 5, 10, 50, 1, 2],
      ["iteration", 8, 12, 67, 1, 2],
    ].sort((a, b) => (a[3] as number) - (b[3] as number)),
  );
});

test("class summary: most-missed questions are the ones with the lowest class success, listing how many got full marks", () => {
  const c = classSummary(students, data, homework, "gcse", now);
  assert.equal(c.mostMissed[0]!.questionId, "q3", "q3: 3/4 and 0/4 across two students");
  const q1 = c.mostMissed.find((m) => m.questionId === "q1")!;
  assert.deepEqual([q1.answered, q1.fullMarks, q1.avgPercent], [2, 1, 63]);
  assert.ok(
    !c.mostMissed.some((m) => m.questionId === "q5"),
    "q5 was answered once (below the minimum) and got full marks",
  );
});

test("class summary: homework is summed over the whole class", () => {
  const c = classSummary(students, data, homework, "gcse", now);
  assert.deepEqual(c.homework, { done: 7, total: 20, percent: 35 });
});

test("class summary: the watch list names who needs a conversation and why", () => {
  const c = classSummary(students, data, homework, "gcse", now);
  assert.deepEqual(
    c.watchList.map((w) => w.name),
    ["Ben Brown", "Cai Clarke"],
  );
  const ben = c.watchList.find((w) => w.name === "Ben Brown")!;
  assert.deepEqual(ben.reasons, [
    "Assessments: 20% overall",
    "Struggling in practice",
    "Behind on 1 overdue homework",
  ]);
  assert.deepEqual(c.watchList.find((w) => w.name === "Cai Clarke")!.reasons, [
    "Behind on 1 overdue homework",
    "Missed 1 assessment",
  ]);
  assert.ok(!c.watchList.some((w) => w.name === "Ann Adams"));
});

test("class summary copes with an empty class and no assessments", () => {
  const c = classSummary(
    [],
    { assessments: [], questions: {}, attempts: [], answers: [] },
    [],
    "gcse",
    now,
  );
  assert.equal(c.students, 0);
  assert.equal(c.assessments.percent, null);
  assert.deepEqual([c.topics, c.mostMissed, c.watchList], [[], [], []]);
  assert.equal(c.homework.percent, null);
});

test("assessment export: one row per student, marks or status per assessment, then totals", () => {
  const rows = assessmentMatrixRows(students, data, now);
  assert.deepEqual(rows[0], [
    "Student",
    "Loops & choices (out of 10)",
    "Subprograms (out of 8)",
    "Total marks",
    "Total available",
    "Overall %",
  ]);
  assert.deepEqual(rows[1], ["Ann Adams", "9", "4", "13", "18", "72"]);
  assert.deepEqual(rows[2], ["Ben Brown", "2", "Handed in (not marked)", "2", "10", "20"]);
  assert.deepEqual(rows[3], ["Cai Clarke", "Not started", "Not started", "0", "0", ""]);
});

test("question-level export: one row per marked question with topic, marks and the teacher's comment", () => {
  const rows = questionLevelRows([ann], data, (t) => `T:${t}`);
  assert.equal(rows.length, 1 + 5);
  const q3 = rows.find((r) => r[5]!.startsWith("Write a program that grades"))!;
  assert.deepEqual(
    [q3[0], q3[1], q3[3], q3[4], q3[6], q3[7], q3[8]],
    ["Ann Adams", "Loops & choices", "3", "T:selection", "4", "3", "Check the boundary."],
  );
});

test("overall export: a row per student with practice, homework, assessment and topic columns", () => {
  const rows = overallRows(students, data, homework, "gcse", (t) => t, now);
  const header = rows[0]!;
  const col = (name: string) => header.indexOf(name);
  assert.ok(
    col("Assessment %") > 0 &&
      col("Homework %") > 0 &&
      col("functions (assessment %)") > 0 &&
      col("Flags") === header.length - 1,
  );
  const annRow = rows.find((r) => r[0] === "Ann Adams")!;
  assert.equal(annRow[col("Assessment %")], "72");
  assert.equal(annRow[col("Homework %")], "75");
  assert.equal(annRow[col("Weakest topic (assessments)")], "functions");
  assert.equal(annRow[col("Strongest topic (assessments)")], "iteration");
  const benRow = rows.find((r) => r[0] === "Ben Brown")!;
  assert.equal(benRow[col("Flags")], "Struggling");
  const caiRow = rows.find((r) => r[0] === "Cai Clarke")!;
  assert.equal(
    caiRow[col("Assessment %")],
    "",
    "no marked work leaves the assessment columns blank, not 0",
  );
  assert.equal(caiRow[col("Homework %")], "0");
});

test("CSV: commas, quotes and newlines are quoted, and numbers are left alone", () => {
  assert.equal(
    toCsv([["a", "b,c", 'say "hi"', "line1\nline2", "12", "-3", "4.5"]]),
    'a,"b,c","say ""hi""","line1\nline2",12,-3,4.5',
  );
});

test("CSV: a cell that would run as a spreadsheet formula is made inert", () => {
  assert.equal(toCsv([['=HYPERLINK("http://evil")']]), '"\'=HYPERLINK(""http://evil"")"');
  assert.equal(toCsv([["+1+2", "-cmd", "@SUM(A1)"]]), "'+1+2,'-cmd,'@SUM(A1)");
  assert.equal(toCsv([["Ann Adams", "Marked"]]), "Ann Adams,Marked");
});

test("watch list: one task short on an overdue homework is not a reason to flag a student", () => {
  const nearlyDone: ReportHomework[] = [
    {
      id: "h",
      title: "H",
      due_at: day(-3),
      completion: [
        { id: "ann", done: 3, total: 4 },
        { id: "ben", done: 2, total: 4 },
        { id: "cai", done: 1, total: 4 },
      ],
    },
  ];
  const clean: ReportData = { ...data, attempts: [], answers: [] };
  const c = classSummary([ann, ben, cai], clean, nearlyDone, "gcse", now);
  const flaggedForHomework = c.watchList
    .filter((w) => w.reasons.some((r) => /homework/.test(r)))
    .map((w) => w.name);
  assert.deepEqual(flaggedForHomework, ["Cai Clarke"], "only under half done (1/4) counts");
  assert.equal(
    studentHomework("ben", nearlyDone, now).overdueUnfinished,
    1,
    "the plain count is still there for the summary text",
  );
  assert.equal(
    studentHomework("ben", nearlyDone, now).overdueBehind,
    0,
    "exactly half is not behind",
  );
});
