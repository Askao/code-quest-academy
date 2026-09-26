import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// Guards the practice-task pools: every topic's tasks are complete enough to be
// fair (a real brief, two hints, enough test cases), and every one has a row in
// the database (a task with no row can't record attempts or XP).
type Task = { slug: string; title: string; brief: string; hints: string[]; tests: { stdin?: string; expect: string }[]; difficulty: number; xp: number; tier: number; stretch?: boolean };
const contentDir = new URL("../content/", import.meta.url);
const topics = fs
  .readdirSync(contentDir)
  .filter((f) => /^gcse-.*\.json$/.test(f))
  .map((f) => ({ file: f, data: JSON.parse(fs.readFileSync(new URL(f, contentDir), "utf8")) as { topic: string; practiceTasks?: Task[] } }));

const migrations = fs
  .readdirSync(new URL("../../supabase/migrations/", import.meta.url))
  .filter((f) => f.endsWith(".sql"))
  .map((f) => fs.readFileSync(new URL(`../../supabase/migrations/${f}`, import.meta.url), "utf8"))
  .join("\n");

// Topics that must have a full practice pool, not just a handful of tasks.
const FULL_POOL = new Set(["searching-sorting", "robust-programs"]);

test("the newest topics have a real practice pool", () => {
  for (const t of FULL_POOL) {
    const pool = topics.find((x) => x.data.topic === t)!.data.practiceTasks ?? [];
    assert.ok(pool.filter((p) => !p.stretch).length >= 20, `${t}: needs at least 20 core practice tasks`);
    assert.ok(pool.filter((p) => p.stretch).length >= 3, `${t}: needs stretch tasks`);
  }
});

test("every practice task is complete, and unique within its topic", () => {
  for (const { data } of topics) {
    const seen = new Set<string>();
    for (const p of data.practiceTasks ?? []) {
      assert.ok(!seen.has(p.slug), `${p.slug}: duplicate slug`);
      seen.add(p.slug);
      assert.ok(p.brief.trim().length >= 40, `${p.slug}: brief too short`);
      assert.ok(p.hints.length >= 2, `${p.slug}: needs two hints`);
      assert.ok(p.tests.length >= 1, `${p.slug}: no test cases`);
      assert.ok(p.difficulty >= 1 && p.difficulty <= 5 && p.tier >= 1 && p.tier <= 4, `${p.slug}: bad tier/difficulty`);
      // Three or more cases, all different, so a program can't pass by printing
      // one hard-coded answer; and none expecting no output at all, or an empty
      // program would pass it.
      assert.ok(p.tests.length >= 3, `${p.slug}: needs 3+ test cases`);
      const inputs = p.tests.map((x) => x.stdin ?? "");
      assert.equal(new Set(inputs).size, inputs.length, `${p.slug}: repeated test input`);
      for (const x of p.tests) assert.ok(x.expect.trim().length > 0, `${p.slug}: a test expects empty output`);
    }
  }
});

test("every practice task has a database row", () => {
  for (const { data } of topics) {
    for (const p of data.practiceTasks ?? []) {
      assert.ok(migrations.includes(`'${p.slug}'`), `${p.slug}: no challenges row in any migration`);
    }
  }
});
