import { test } from "node:test";
import assert from "node:assert/strict";
import { homeworkComplete, inListOrder, nextHomeworkTask } from "./homework-flow.ts";

const items = ["a", "b", "c", "d"].map((s) => ({ id: "id-" + s, slug: s }));
const passed = (...slugs: string[]) => new Set(slugs.map((s) => "id-" + s));

test("rows come back in the order of the student's list, not the database's", () => {
  const rows = [{ id: "3" }, { id: "1" }, { id: "2" }, { id: "9" }];
  assert.deepEqual(inListOrder(["1", "2", "3"], rows), [{ id: "1" }, { id: "2" }, { id: "3" }]);
});

test("next is the following task in the list", () => {
  assert.equal(nextHomeworkTask(items, "a", passed())?.slug, "b");
  assert.equal(nextHomeworkTask(items, "b", passed("a"))?.slug, "c");
});

test("next skips tasks already passed", () => {
  assert.equal(nextHomeworkTask(items, "a", passed("b", "c"))?.slug, "d");
});

test("after the last task it wraps to one that was skipped earlier", () => {
  assert.equal(nextHomeworkTask(items, "d", passed("a", "c"))?.slug, "b");
});

test("finishing the last remaining task means the homework is done", () => {
  assert.equal(nextHomeworkTask(items, "d", passed("a", "b", "c")), null);
  assert.equal(nextHomeworkTask([items[0]!], "a", passed()), null);
});

test("an unknown current task starts from the first unfinished one", () => {
  assert.equal(nextHomeworkTask(items, "zzz", passed("a"))?.slug, "b");
});

test("complete only when every task is passed", () => {
  assert.equal(homeworkComplete(items, passed("a", "b", "c")), false);
  assert.equal(homeworkComplete(items, passed("a", "b", "c", "d")), true);
  assert.equal(homeworkComplete([], passed()), false, "an empty list isn't 'complete'");
});
