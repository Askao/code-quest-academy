import test from "node:test";
import assert from "node:assert/strict";
import {
  activityOf,
  classTotals,
  percent,
  weakestTopic,
  type RevisionSummaryRow,
} from "./revision-summary.ts";

const NOW = new Date("2026-10-01T12:00:00Z");
const row = (over: Partial<RevisionSummaryRow> = {}): RevisionSummaryRow => ({
  student_id: "s",
  papers_made: 0,
  papers_handed_in: 0,
  marks_awarded: 0,
  marks_available: 0,
  last_active: null,
  topics: [],
  ...over,
});

test("percent rounds, and is null when nothing has been marked", () => {
  assert.equal(percent(7, 9), 78);
  assert.equal(percent(0, 10), 0);
  assert.equal(percent(0, 0), null);
});

test("activity: never, recent, or quiet after two weeks", () => {
  assert.equal(activityOf(null, NOW), "never");
  assert.equal(activityOf("2026-09-30T12:00:00Z", NOW), "recent");
  assert.equal(activityOf("2026-09-17T12:00:00Z", NOW), "recent"); // exactly 14 days
  assert.equal(activityOf("2026-09-16T12:00:00Z", NOW), "quiet");
});

test("weakest topic ignores topics with too little evidence", () => {
  const r = row({
    topics: [
      { topic: "lists", awarded: 0, available: 2 }, // too few marks to judge
      { topic: "selection", awarded: 3, available: 8 },
      { topic: "iteration", awarded: 7, available: 8 },
    ],
  });
  assert.deepEqual(weakestTopic(r), { topic: "selection", percent: 38 });
  assert.equal(weakestTopic(row({ topics: [{ topic: "lists", awarded: 0, available: 3 }] })), null);
  assert.equal(weakestTopic(row()), null);
});

test("class totals count students who never started and who have gone quiet", () => {
  const rows = [
    row({ papers_made: 2, marks_awarded: 10, marks_available: 20, last_active: "2026-09-30T00:00:00Z" }),
    row({ papers_made: 1, marks_awarded: 5, marks_available: 10, last_active: "2026-08-01T00:00:00Z" }),
    row(),
  ];
  assert.deepEqual(classTotals(rows, NOW), {
    students: 3,
    started: 2,
    neverStarted: 1,
    quiet: 1,
    papers: 3,
    percent: 50,
  });
  assert.equal(classTotals([], NOW).percent, null);
});
