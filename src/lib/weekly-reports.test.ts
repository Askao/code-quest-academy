import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildStudentEmail,
  buildTeacherEmail,
  newCosmetics,
  outstandingHomework,
  reportDue,
  shortName,
  studentReportWanted,
  studentSubject,
  studentWindow,
  teacherSubject,
  teacherWindow,
  ukMidnightUtc,
  ukParts,
  type HomeworkStatus,
  type StudentWeek,
  type TeacherEmailInput,
} from "./weekly-reports.ts";

const at = (iso: string) => new Date(iso);
const SITE = "https://www.hcodeacademy.co.uk";

// ---- weeks and times -------------------------------------------------------

test("UK time follows summer time", () => {
  assert.deepEqual(ukParts(at("2026-10-04T16:00:00Z")), { year: 2026, month: 10, day: 4, weekday: 0, hour: 17 });
  assert.equal(ukParts(at("2026-12-06T17:00:00Z")).hour, 17);
  assert.equal(ukParts(at("2026-09-30T23:30:00Z")).day, 1, "23:30 UTC in BST is already the next UK day");
});

test("UK midnight is an hour earlier in UTC during summer time", () => {
  assert.equal(ukMidnightUtc({ year: 2026, month: 9, day: 28 }).toISOString(), "2026-09-27T23:00:00.000Z");
  assert.equal(ukMidnightUtc({ year: 2026, month: 11, day: 30 }).toISOString(), "2026-11-30T00:00:00.000Z");
});

test("a student's week runs from Monday 00:00 UK to now", () => {
  const w = studentWindow(at("2026-10-04T16:00:00Z")); // Sunday 17:00 BST
  assert.equal(w.from.toISOString(), "2026-09-27T23:00:00.000Z");
  assert.equal(w.to.toISOString(), "2026-10-04T16:00:00.000Z");
  assert.equal(w.prevFrom.toISOString(), "2026-09-20T23:00:00.000Z");
  assert.equal(w.weekStart, "2026-09-28");
  assert.deepEqual(w.days, ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
});

test("a teacher's week is the one that has just finished, Monday to Sunday night", () => {
  const w = teacherWindow(at("2026-10-05T06:00:00Z")); // Monday 07:00 BST
  assert.equal(w.from.toISOString(), "2026-09-27T23:00:00.000Z");
  assert.equal(w.to.toISOString(), "2026-10-04T23:00:00.000Z");
  assert.equal(w.weekStart, "2026-09-28");
});

test("the week the clocks go back is a week and an hour long, not off by one", () => {
  const w = teacherWindow(at("2026-10-26T07:00:00Z")); // Monday 07:00 GMT after BST ended on the 25th
  assert.equal(w.from.toISOString(), "2026-10-18T23:00:00.000Z");
  assert.equal(w.to.toISOString(), "2026-10-26T00:00:00.000Z");
  assert.equal(w.weekStart, "2026-10-19");
  assert.equal(studentWindow(at("2026-10-25T17:00:00Z")).from.toISOString(), "2026-10-18T23:00:00.000Z");
});

test("students are emailed from Sunday 5pm, teachers from Monday 7am, nothing after 9pm", () => {
  assert.equal(reportDue(at("2026-10-04T15:59:00Z")), null); // Sunday 16:59 BST
  assert.equal(reportDue(at("2026-10-04T16:00:00Z")), "student");
  assert.equal(reportDue(at("2026-10-04T19:59:00Z")), "student"); // 20:59 BST
  assert.equal(reportDue(at("2026-10-04T20:00:00Z")), null); // 21:00 BST
  assert.equal(reportDue(at("2026-10-05T05:59:00Z")), null); // Monday 06:59 BST
  assert.equal(reportDue(at("2026-10-05T06:00:00Z")), "teacher");
  assert.equal(reportDue(at("2026-10-06T10:00:00Z")), null);
  assert.equal(reportDue(at("2026-12-06T17:00:00Z")), "student"); // Sunday 17:00 GMT
});

// ---- fixtures --------------------------------------------------------------

const NOW = at("2026-10-04T16:00:00Z");
const SW = studentWindow(NOW);

function week(over: Partial<StudentWeek> = {}): StudentWeek {
  return {
    student_id: "s1",
    tasks_passed: 6,
    prev_tasks_passed: 4,
    xp_earned: 240,
    xp_total: 2300,
    active_dates: ["2026-09-28", "2026-09-30", "2026-10-01", "2026-10-03"],
    topics: { iteration: 4, lists: 2 },
    attempts_in_window: 12,
    attempts_counted: 10,
    passed_counted: 7,
    last_attempt_at: "2026-10-03T10:00:00Z",
    stuck_topics: [],
    ...over,
  };
}

function hw(over: Partial<HomeworkStatus> = {}): HomeworkStatus {
  return {
    student_id: "s1",
    homework_id: "h1",
    class_id: "c1",
    class_name: "10B2",
    title: "Iteration: loops",
    due_at: "2026-10-06T15:00:00Z",
    total: 5,
    done: 3,
    last_pass: null,
    next_task: "Task 4",
    ...over,
  };
}

// ---- who has homework to do -------------------------------------------------

test("outstanding homework: overdue first (oldest first), then soonest due, then no deadline", () => {
  const out = outstandingHomework(
    [
      hw({ homework_id: "later", due_at: "2026-10-12T15:00:00Z" }),
      hw({ homework_id: "nodue", due_at: null }),
      hw({ homework_id: "soon", due_at: "2026-10-06T15:00:00Z" }),
      hw({ homework_id: "late1", due_at: "2026-10-02T15:00:00Z", done: 0 }),
      hw({ homework_id: "late0", due_at: "2026-09-30T15:00:00Z", done: 0 }),
    ],
    NOW,
  );
  assert.deepEqual(out.map((h) => h.homeworkId), ["late0", "late1", "soon", "later", "nodue"]);
  assert.equal(out[0]!.overdue, true);
  assert.equal(out[2]!.overdue, false);
});

test("outstanding homework leaves out finished work and homework overdue by more than three weeks", () => {
  const out = outstandingHomework(
    [
      hw({ homework_id: "done", done: 5 }),
      hw({ homework_id: "ancient", due_at: "2026-09-01T15:00:00Z", done: 0 }),
      hw({ homework_id: "empty", total: 0, done: 0 }),
      hw({ homework_id: "kept", due_at: "2026-09-20T15:00:00Z", done: 0 }),
    ],
    NOW,
  );
  assert.deepEqual(out.map((h) => h.homeworkId), ["kept"]);
});

test("a student is emailed if they did something or owe something, otherwise not", () => {
  const open = outstandingHomework([hw()], NOW);
  assert.equal(studentReportWanted(week(), []), true, "active");
  assert.equal(studentReportWanted(week({ attempts_in_window: 0 }), open), true, "owes homework");
  assert.equal(studentReportWanted(week({ attempts_in_window: 0 }), []), false, "dormant and nothing owed");
  assert.equal(studentReportWanted(undefined, []), false);
});

// ---- student email ----------------------------------------------------------

test("the subject says what matters: passes and homework still to do", () => {
  assert.equal(studentSubject(6, 2), "Your week on H-Code: 6 tasks passed, 2 homeworks to finish");
  assert.equal(studentSubject(1, 1), "Your week on H-Code: 1 task passed, 1 homework to finish");
  assert.equal(studentSubject(0, 2), "Your week on H-Code: 2 homeworks to finish");
  assert.equal(studentSubject(3, 0), "Your week on H-Code: 3 tasks passed, nothing outstanding");
  assert.equal(studentSubject(0, 0), "Your week on H-Code");
});

const homeworkSet = [
  hw({ homework_id: "late", title: "Lists: searching", due_at: "2026-10-02T15:00:00Z", done: 0, total: 4, next_task: "Find an item" }),
  hw(),
  hw({ homework_id: "fin", title: "Selection: if and else", total: 6, done: 6, due_at: "2026-10-01T15:00:00Z", last_pass: "2026-09-30T12:00:00Z" }),
];

test("the student email puts homework first, overdue before due soon, each with its progress", () => {
  const e = buildStudentEmail({ name: "Priya Shah", week: week(), homework: homeworkSet, results: [], window: SW, now: NOW, siteUrl: SITE });
  assert.equal(e.subject, "Your week on H-Code: 6 tasks passed, 2 homeworks to finish");
  assert.ok(e.html.includes("Your week, Priya"));
  assert.ok(e.html.includes("2 homeworks still to do."));
  assert.ok(e.html.includes("1 overdue, next due on Tuesday."));
  assert.ok(e.html.indexOf("Lists: searching") < e.html.indexOf("Iteration: loops"), "overdue before due soon");
  assert.ok(e.html.includes("0 of 4 tasks done") && e.html.includes("3 of 5 tasks done"));
  assert.ok(e.html.includes("Finished Wednesday"), "finished this week is acknowledged");
  assert.ok(e.html.indexOf("Homework to finish") < e.html.indexOf("Your week</p>"), "homework before the stats");
});

test("the student email shows the week against last week, level progress, active days and topics", () => {
  const e = buildStudentEmail({ name: "Priya Shah", week: week(), homework: homeworkSet, results: [], window: SW, now: NOW, siteUrl: SITE });
  assert.ok(e.html.includes("2 more than last week"));
  assert.ok(e.html.includes("Level 7, 500 XP to level 8"), "2300 XP is level 7 (from 2100), and level 8 starts at 2800");
  const lit = (e.html.match(/background: #e8c27a; border: 1px solid #e8c27a/g) ?? []).length;
  assert.equal(lit, 4, "four active days are lit in the Monday to Sunday strip");
  assert.ok(e.html.includes("Iteration") && e.html.includes("4 tasks passed"));
});

test("the next step is the first task of the most urgent homework", () => {
  const e = buildStudentEmail({ name: "Priya", week: week(), homework: homeworkSet, results: [], window: SW, now: NOW, siteUrl: SITE });
  assert.ok(e.html.includes("Start with Find an item in Lists: searching."));
  assert.ok(e.html.includes("It is overdue, so it is the best place to begin."));
  assert.ok(e.html.includes(`${SITE}/homework/late`));
});

test("a quiet week says so and still points the way back", () => {
  const e = buildStudentEmail({ name: "Priya", week: week({ tasks_passed: 0, prev_tasks_passed: 0, xp_earned: 0, attempts_in_window: 0, active_dates: [], topics: {} }), homework: homeworkSet, results: [], window: SW, now: NOW, siteUrl: SITE });
  assert.ok(e.html.includes("no tasks passed this week. The quickest way back in is below."));
  assert.equal(e.subject, "Your week on H-Code: 2 homeworks to finish");
});

test("with nothing outstanding the email says so and suggests Practice", () => {
  const e = buildStudentEmail({ name: "Priya", week: week(), homework: [], results: [], window: SW, now: NOW, siteUrl: SITE });
  assert.ok(e.html.includes("Nothing outstanding."));
  assert.ok(e.html.includes(`${SITE}/practice`));
});

test("a level-up that unlocks something gets a Locker line, with no comparison to anyone else", () => {
  assert.deepEqual(newCosmetics(2000, 2300), { level: 7, unlocked: ["Owl avatar"], levelUp: true });
  assert.deepEqual(newCosmetics(3600, 3700), { level: 9, unlocked: [], levelUp: false });
  const e = buildStudentEmail({ name: "Priya", week: week({ xp_total: 2300, xp_earned: 300 }), homework: [], results: [], window: SW, now: NOW, siteUrl: SITE });
  assert.ok(e.html.includes("You reached level 7 and unlocked the Owl avatar."));
  assert.ok(!/leaderboard|rank|classmates/i.test(e.html));
});

test("released results appear with the percentage", () => {
  const e = buildStudentEmail({ name: "Priya", week: week(), homework: [], results: [{ student_id: "s1", title: "Selection quiz", awarded: 18, total: 24 }], window: SW, now: NOW, siteUrl: SITE });
  assert.ok(e.html.includes("Selection quiz") && e.html.includes("18 out of 24 (75%)"));
});

test("only five homeworks are listed, with a count of the rest", () => {
  const many = Array.from({ length: 8 }, (_, n) => hw({ homework_id: `h${n}`, title: `Homework ${n}`, due_at: `2026-10-0${6 + (n % 3)}T15:00:00Z` }));
  const e = buildStudentEmail({ name: "Priya", week: week(), homework: many, results: [], window: SW, now: NOW, siteUrl: SITE });
  assert.ok(e.html.includes("3 more homeworks"));
});

test("everything a person typed is escaped, and the footer links to the account page", () => {
  const e = buildStudentEmail({
    name: "<b>Pri</b>ya",
    week: week(),
    homework: [hw({ title: '<script>alert("x")</script>', class_name: "10<i>B2</i>" })],
    results: [],
    window: SW,
    now: NOW,
    siteUrl: SITE,
  });
  assert.ok(!e.html.includes("<script>") && !e.html.includes("<b>Pri") && !e.html.includes("<i>B2"));
  assert.ok(e.html.includes(`${SITE}/account`));
});

// ---- teacher email ----------------------------------------------------------

test("names are shortened to first name and initial", () => {
  assert.equal(shortName("Marcus Thompson"), "Marcus T.");
  assert.equal(shortName("Ana Maria de la Cruz"), "Ana C.");
  assert.equal(shortName("Cher"), "Cher");
  assert.equal(shortName(""), "A student");
});

const TW = teacherWindow(at("2026-10-05T06:00:00Z"));
const TNOW = at("2026-10-05T06:00:00Z");

function teacherInput(over: Partial<TeacherEmailInput> = {}): TeacherEmailInput {
  const weeks = new Map<string, StudentWeek>([
    ["a", week({ student_id: "a", attempts_in_window: 8, attempts_counted: 8, passed_counted: 6 })],
    ["b", week({ student_id: "b", attempts_in_window: 0, attempts_counted: 0, passed_counted: 0, last_attempt_at: "2026-09-25T10:00:00Z" })],
    ["c", week({ student_id: "c", stuck_topics: ["lists"], attempts_in_window: 5, attempts_counted: 4, passed_counted: 2 })],
    ["d", week({ student_id: "d", attempts_in_window: 0, attempts_counted: 0, passed_counted: 0, last_attempt_at: null })],
  ]);
  return {
    teacherName: "Charlie Hughes",
    classes: [{ id: "c1", name: "10B2", studentIds: ["a", "b", "c", "d"] }, { id: "c2", name: "11C3", studentIds: ["e"] }],
    weeks: new Map([...weeks, ["e", week({ student_id: "e", attempts_in_window: 3, attempts_counted: 3, passed_counted: 3 })]]),
    homework: [
      hw({ student_id: "a", homework_id: "hl", title: "Lists: searching", due_at: "2026-10-02T15:00:00Z", done: 4, total: 4 }),
      hw({ student_id: "b", homework_id: "hl", title: "Lists: searching", due_at: "2026-10-02T15:00:00Z", done: 0, total: 4 }),
      hw({ student_id: "c", homework_id: "hl", title: "Lists: searching", due_at: "2026-10-02T15:00:00Z", done: 4, total: 4 }),
      hw({ student_id: "d", homework_id: "hl", title: "Lists: searching", due_at: "2026-10-02T15:00:00Z", done: 0, total: 4 }),
      hw({ student_id: "a", homework_id: "hi", title: "Iteration: loops", due_at: "2026-10-06T15:00:00Z", done: 5, total: 5 }),
      hw({ student_id: "b", homework_id: "hi", title: "Iteration: loops", due_at: "2026-10-06T15:00:00Z", done: 1, total: 5 }),
    ],
    marking: [{ class_id: "c1", assessment_id: "as1", title: "Selection quiz", submitted: 14, unmarked: 12 }],
    names: new Map([["a", "Ava Smith"], ["b", "Marcus Thompson"], ["c", "Zoe Kowalski"], ["d", "Dev Singh"], ["e", "Eli Brown"]]),
    window: TW,
    now: TNOW,
    siteUrl: SITE,
    ...over,
  };
}

test("the teacher email leads with who needs a nudge and why, worst first", () => {
  const e = buildTeacherEmail(teacherInput())!;
  assert.equal(e.subject, "Your week on H-Code: 2 classes, 3 students need a nudge");
  const iMarcus = e.html.indexOf("Marcus T.");
  const iDev = e.html.indexOf("Dev S.");
  const iZoe = e.html.indexOf("Zoe K.");
  assert.ok(iMarcus > -1 && iDev > -1 && iZoe > -1);
  assert.ok(iMarcus < iZoe && iDev < iZoe, "overdue before stuck");
  assert.ok(e.html.includes("Lists: searching, 0 of 4. No activity for 9 days."));
  assert.ok(e.html.includes("Hasn&#39;t started yet.") || e.html.includes("Hasn't started yet."));
  assert.ok(e.html.includes("Three fails in a row on Lists"));
});

test("full names never go in the email, only first name and initial", () => {
  const e = buildTeacherEmail(teacherInput())!;
  for (const surname of ["Thompson", "Kowalski", "Singh", "Smith"]) assert.ok(!e.html.includes(surname), surname);
  assert.ok(!e.subject.includes("Marcus"));
});

test("the busiest class gets the detail: counts, homework progress and papers to mark", () => {
  const e = buildTeacherEmail(teacherInput())!;
  assert.ok(e.html.includes("active this week"));
  assert.ok(e.html.includes("Lists: searching") && e.html.includes("2 of 4 finished"));
  assert.ok(e.html.includes("Selection quiz") && e.html.includes("12 waiting"));
  assert.ok(e.html.includes("Active 3 of 1") === false);
  assert.ok(e.html.includes("11C3"), "the other class still gets a line");
});

test("accuracy and handed-in come from first-pass attempts and what fell due that week", () => {
  const e = buildTeacherEmail(teacherInput())!;
  // class 10B2: (6 + 0 + 2 + 0) passed / (8 + 0 + 4 + 0) counted = 8 / 12
  assert.ok(e.html.includes("67%"), "accuracy");
  // homework due in the week: Lists - 2 of 4 students finished
  assert.ok(e.html.includes("50%"), "handed in");
});

test("only five students are listed, with a count of the rest", () => {
  const ids = Array.from({ length: 8 }, (_, n) => `x${n}`);
  const weeks = new Map(ids.map((id) => [id, week({ student_id: id, stuck_topics: ["lists"] })]));
  const e = buildTeacherEmail(
    teacherInput({
      classes: [{ id: "c1", name: "10B2", studentIds: ids }],
      weeks,
      homework: [],
      marking: [],
      names: new Map(ids.map((id, n) => [id, `Student${n} Lastname`])),
    }),
  )!;
  assert.ok(e.html.includes("3 more students"));
  assert.equal(e.subject, "Your week on H-Code: 1 class, 8 students need a nudge");
});

test("when everyone is fine the email says so, and when there is nothing at all it is not sent", () => {
  const fine = new Map([["a", week({ student_id: "a" })]]);
  const e = buildTeacherEmail(teacherInput({ classes: [{ id: "c1", name: "10B2", studentIds: ["a"] }], weeks: fine, homework: [], marking: [] }))!;
  assert.equal(e.subject, "Your week on H-Code: 1 class, everyone on track");
  assert.ok(e.html.includes("Everyone is on track this week."));

  const quiet = new Map([["a", week({ student_id: "a", attempts_in_window: 0, last_attempt_at: "2026-10-03T10:00:00Z" })]]);
  assert.equal(buildTeacherEmail(teacherInput({ classes: [{ id: "c1", name: "10B2", studentIds: ["a"] }], weeks: quiet, homework: [], marking: [] })), null);
  assert.equal(buildTeacherEmail(teacherInput({ classes: [{ id: "c1", name: "Empty", studentIds: [] }] })), null);
});

test("the teacher subject reads naturally for one student", () => {
  assert.equal(teacherSubject(1, 1), "Your week on H-Code: 1 class, 1 student needs a nudge");
  assert.equal(teacherSubject(3, 5), "Your week on H-Code: 3 classes, 5 students need a nudge");
});

test("a student in two of a teacher's classes is flagged once", () => {
  const e = buildTeacherEmail(
    teacherInput({
      classes: [{ id: "c1", name: "10B2", studentIds: ["b"] }, { id: "c2", name: "11C3", studentIds: ["b"] }],
      homework: [hw({ student_id: "b", homework_id: "hl", title: "Lists: searching", due_at: "2026-10-02T15:00:00Z", done: 0, total: 4 })],
    }),
  )!;
  assert.equal((e.html.match(/Marcus T\./g) ?? []).length, 1);
});

test("everything a person typed in the teacher email is escaped", () => {
  const e = buildTeacherEmail(
    teacherInput({
      teacherName: "<b>Mr</b> X",
      classes: [{ id: "c1", name: "10<i>B2</i>", studentIds: ["b"] }],
      names: new Map([["b", "<script>x</script> Smith"]]),
      homework: [hw({ student_id: "b", homework_id: "hl", title: "<img src=x>", due_at: "2026-10-02T15:00:00Z", done: 0, total: 4 })],
    }),
  )!;
  assert.ok(!e.html.includes("<script>") && !e.html.includes("<img src=x>") && !e.html.includes("<i>B2"));
});
