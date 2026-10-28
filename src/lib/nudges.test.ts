import { test } from "node:test";
import assert from "node:assert/strict";
import { isSnoozed, snoozeUntil } from "./nudges.ts";

test("a prompt hidden for 30 days stays hidden until then, then comes back", () => {
  const now = new Date("2026-10-28T12:00:00Z");
  const until = snoozeUntil(30, now);
  assert.equal(until, "2026-11-27T12:00:00.000Z");
  assert.equal(isSnoozed(until, new Date("2026-11-27T11:59:00Z")), true);
  assert.equal(isSnoozed(until, new Date("2026-11-27T12:01:00Z")), false);
});

test("nothing stored, or something unreadable, means the prompt shows", () => {
  assert.equal(isSnoozed(null), false);
  assert.equal(isSnoozed("not a date"), false);
});
