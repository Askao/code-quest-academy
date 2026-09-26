// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldRestoreSolution } from "./saved-solution.ts";

const starter = "# write your code here\n";

test("an untouched editor is replaced by the saved solution", () => {
  assert.equal(shouldRestoreSolution({ current: starter, starter, saved: "print('hi')" }), true);
});

test("an empty editor is replaced too (a task with no starter code)", () => {
  assert.equal(shouldRestoreSolution({ current: "", starter: "", saved: "x = 1" }), true);
  assert.equal(shouldRestoreSolution({ current: "  \n", starter, saved: "x = 1" }), true);
});

test("anything the student has already typed is never overwritten", () => {
  assert.equal(shouldRestoreSolution({ current: "print(", starter, saved: "print('hi')" }), false);
});

test("nothing to restore when there is no saved solution", () => {
  assert.equal(shouldRestoreSolution({ current: starter, starter, saved: null }), false);
  assert.equal(shouldRestoreSolution({ current: starter, starter, saved: undefined }), false);
  assert.equal(shouldRestoreSolution({ current: starter, starter, saved: "   \n" }), false);
});

test("no change when the editor already shows the saved code", () => {
  assert.equal(shouldRestoreSolution({ current: "x = 1", starter, saved: "x = 1" }), false);
});
