// Run with: node --test src/lib/homework-picks.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { pickFreshHomeworkSet, type PoolChallenge } from "./homework-picks.ts";

const pool = (n: number, topic = "iteration"): PoolChallenge[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${topic}-${i}`, difficulty: (i % 5) + 1, topic }));

const none = new Set<string>();

test("never sets a task the student has already passed", () => {
  const p = pool(20);
  const passed = new Set(p.slice(0, 12).map((c) => c.id));
  for (let run = 0; run < 200; run++) {
    const got = pickFreshHomeworkSet({
      pool: p,
      level: 3,
      count: 6,
      passed,
      alreadyAssigned: none,
    });
    assert.equal(got.length, 6);
    assert.ok(
      got.every((id) => !passed.has(id)),
      "picked a passed task",
    );
    assert.equal(new Set(got).size, got.length, "duplicate in list");
  }
});

test("prefers tasks never assigned before over ones assigned but unfinished", () => {
  const p = pool(10);
  const assigned = new Set(p.slice(0, 5).map((c) => c.id));
  for (let run = 0; run < 200; run++) {
    const got = pickFreshHomeworkSet({
      pool: p,
      level: 3,
      count: 5,
      passed: none,
      alreadyAssigned: assigned,
    });
    assert.ok(
      got.every((id) => !assigned.has(id)),
      "reused an assigned task while fresh ones remained",
    );
  }
});

test("tops up with assigned-but-unfinished tasks when fresh ones run out, never passed ones", () => {
  const p = pool(8);
  const passed = new Set(p.slice(0, 3).map((c) => c.id)); // 0-2 done
  const assigned = new Set(p.slice(3, 6).map((c) => c.id)); // 3-5 set before, not done
  // fresh = 6,7 (2 tasks); asking for 4 must add two of 3-5, and none of 0-2
  for (let run = 0; run < 200; run++) {
    const got = pickFreshHomeworkSet({
      pool: p,
      level: 3,
      count: 4,
      passed,
      alreadyAssigned: assigned,
    });
    assert.equal(got.length, 4);
    assert.ok(got.includes("iteration-6") && got.includes("iteration-7"));
    assert.ok(got.every((id) => !passed.has(id)));
  }
});

test("returns a short list rather than repeating finished work when the pool is exhausted", () => {
  const p = pool(6);
  const passed = new Set(p.slice(0, 5).map((c) => c.id));
  const got = pickFreshHomeworkSet({ pool: p, level: 3, count: 4, passed, alreadyAssigned: none });
  assert.deepEqual(got, ["iteration-5"]);
});

test("returns an empty list when the student has passed everything", () => {
  const p = pool(4);
  const got = pickFreshHomeworkSet({
    pool: p,
    level: 3,
    count: 4,
    passed: new Set(p.map((c) => c.id)),
    alreadyAssigned: none,
  });
  assert.deepEqual(got, []);
});

test("still mixes topics across a multi-topic pool once done tasks are removed", () => {
  const p = [...pool(10, "iteration"), ...pool(10, "selection")];
  const passed = new Set(p.filter((c) => Number(c.id.split("-")[1]) < 4).map((c) => c.id));
  for (let run = 0; run < 100; run++) {
    const got = pickFreshHomeworkSet({
      pool: p,
      level: 3,
      count: 6,
      passed,
      alreadyAssigned: none,
    });
    const topics = new Set(got.map((id) => id.split("-")[0]));
    assert.equal(got.length, 6);
    assert.equal(topics.size, 2, "expected both topics represented");
    assert.ok(got.every((id) => !passed.has(id)));
  }
});

test("with nothing done it behaves like before: full-size distinct list", () => {
  const got = pickFreshHomeworkSet({
    pool: pool(12),
    level: 2,
    count: 5,
    passed: none,
    alreadyAssigned: none,
  });
  assert.equal(got.length, 5);
  assert.equal(new Set(got).size, 5);
});
