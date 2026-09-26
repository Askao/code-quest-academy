// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assessmentReasonLabel,
  studentAssessmentArchiveReason,
  studentHomeworkArchiveReason,
  teacherAssessmentArchiveReason,
  teacherHomeworkArchiveReason,
} from "./archive.ts";

const now = new Date("2026-09-28T12:00:00Z");
const past = "2026-09-20T09:00:00Z";
const future = "2026-10-05T09:00:00Z";

test("student homework: finishing everything archives it, whatever the deadline", () => {
  assert.equal(
    studentHomeworkArchiveReason({ completed: 4, total: 4, dueAt: future }, now),
    "completed",
  );
  assert.equal(
    studentHomeworkArchiveReason({ completed: 4, total: 4, dueAt: null }, now),
    "completed",
  );
});

test("student homework: a passed deadline archives it even if unfinished", () => {
  assert.equal(
    studentHomeworkArchiveReason({ completed: 1, total: 4, dueAt: past }, now),
    "overdue",
  );
});

test("student homework: finished wins over overdue", () => {
  assert.equal(
    studentHomeworkArchiveReason({ completed: 4, total: 4, dueAt: past }, now),
    "completed",
  );
});

test("student homework: open work stays current", () => {
  assert.equal(studentHomeworkArchiveReason({ completed: 1, total: 4, dueAt: future }, now), null);
  assert.equal(
    studentHomeworkArchiveReason({ completed: 0, total: 4, dueAt: null }, now),
    null,
    "no deadline never expires",
  );
});

test("student homework: nothing assigned yet is not finished", () => {
  assert.equal(studentHomeworkArchiveReason({ completed: 0, total: 0, dueAt: future }, now), null);
  assert.equal(studentHomeworkArchiveReason({ completed: 0, total: 0, dueAt: null }, now), null);
});

test("student assessment: handed in or marked is archived", () => {
  assert.equal(
    studentAssessmentArchiveReason({ status: "handed_in", closesAt: future }, now),
    "handed_in",
  );
  assert.equal(studentAssessmentArchiveReason({ status: "marked", closesAt: null }, now), "marked");
});

test("student assessment: closed without ever starting is archived as missed", () => {
  assert.equal(
    studentAssessmentArchiveReason({ status: "not_started", closesAt: past }, now),
    "missed",
  );
});

test("student assessment: open to start, or still writing, is never archived", () => {
  assert.equal(
    studentAssessmentArchiveReason({ status: "not_started", closesAt: future }, now),
    null,
  );
  assert.equal(
    studentAssessmentArchiveReason({ status: "not_started", closesAt: null }, now),
    null,
  );
  assert.equal(
    studentAssessmentArchiveReason({ status: "writing", closesAt: past }, now),
    null,
    "may finish after the window closes",
  );
});

test("assessment labels say whether marks are back", () => {
  assert.equal(assessmentReasonLabel("marked", true), "Marked - results ready");
  assert.equal(assessmentReasonLabel("marked", false), "Marked");
  assert.match(assessmentReasonLabel("handed_in", false), /waiting to be marked/);
  assert.match(assessmentReasonLabel("missed", false), /Missed/);
});

test("teacher homework: archived when everyone has finished or the deadline passed", () => {
  assert.equal(
    teacherHomeworkArchiveReason({ dueAt: future, doneCount: 25, studentCount: 25 }, now),
    "everyone_finished",
  );
  assert.equal(
    teacherHomeworkArchiveReason({ dueAt: past, doneCount: 10, studentCount: 25 }, now),
    "past_deadline",
  );
  assert.equal(
    teacherHomeworkArchiveReason({ dueAt: future, doneCount: 10, studentCount: 25 }, now),
    null,
  );
  assert.equal(
    teacherHomeworkArchiveReason({ dueAt: null, doneCount: 24, studentCount: 25 }, now),
    null,
  );
});

test("teacher homework: an empty class does not count as everyone finished", () => {
  assert.equal(
    teacherHomeworkArchiveReason({ dueAt: future, doneCount: 0, studentCount: 0 }, now),
    null,
  );
});

test("teacher assessment: releasing results archives it", () => {
  assert.equal(
    teacherAssessmentArchiveReason(
      { resultsReleased: true, closesAt: future, statuses: ["writing", "handed_in"] },
      now,
    ),
    "results_released",
  );
});

test("teacher assessment: closed with nothing left to mark is archived", () => {
  assert.equal(
    teacherAssessmentArchiveReason(
      { resultsReleased: false, closesAt: past, statuses: ["marked", "marked", "not_started"] },
      now,
    ),
    "closed",
  );
  assert.equal(
    teacherAssessmentArchiveReason({ resultsReleased: false, closesAt: past, statuses: [] }, now),
    "closed",
  );
});

test("teacher assessment: never archived while anyone is writing or waiting to be marked", () => {
  assert.equal(
    teacherAssessmentArchiveReason(
      { resultsReleased: false, closesAt: past, statuses: ["marked", "handed_in"] },
      now,
    ),
    null,
  );
  assert.equal(
    teacherAssessmentArchiveReason(
      { resultsReleased: false, closesAt: past, statuses: ["writing"] },
      now,
    ),
    null,
  );
});

test("teacher assessment: with no closing time it stays active until results are released", () => {
  assert.equal(
    teacherAssessmentArchiveReason(
      { resultsReleased: false, closesAt: null, statuses: ["marked", "marked"] },
      now,
    ),
    null,
  );
});
