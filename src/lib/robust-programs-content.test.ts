import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import content from "../content/gcse-robust-programs.json" with { type: "json" };

// Guards the shape of the "Robust programs" topic: every task belongs to a
// lesson, every quiz answer is one of its options, and the database migration
// seeds exactly the tasks the content defines (a task missing from the
// migration would have nothing for attempts and XP to point at).
const lessonSlugs = new Set(content.lessons.map((l) => l.slug));

test("every task belongs to a real lesson and has usable tests", () => {
  const slugs = new Set<string>();
  for (const t of content.tasks) {
    assert.ok(!slugs.has(t.slug), `duplicate task slug ${t.slug}`);
    slugs.add(t.slug);
    assert.ok(lessonSlugs.has(`gcse-robust-programs-${t.lesson}`), `${t.slug}: no lesson ${t.lesson}`);
    assert.ok(t.tests.length >= 3, `${t.slug}: fewer than 3 tests`);
    assert.ok(t.hints.length >= 2, `${t.slug}: needs two hints`);
    assert.ok(t.brief.trim().length > 20, `${t.slug}: brief too short`);
    assert.ok(t.tier >= 1 && t.tier <= 4 && t.difficulty >= 1 && t.difficulty <= 5, `${t.slug}: bad tier/difficulty`);
  }
});

test("every lesson has at least three required tasks, a stretch task and a quiz", () => {
  for (const l of content.lessons) {
    const n = Number(l.slug.split("-").pop());
    const mine = content.tasks.filter((t) => t.lesson === n);
    assert.ok(mine.filter((t) => !("stretch" in t)).length >= 3, `${l.slug}: needs 3+ required tasks`);
    assert.equal(mine.filter((t) => "stretch" in t).length, 1, `${l.slug}: exactly one stretch task`);
    assert.ok(content.quiz.filter((q) => q.lessonSlug === l.slug).length >= 3, `${l.slug}: needs 3+ quiz questions`);
  }
});

test("every quiz answer is one of its options, and options are distinct", () => {
  for (const q of content.quiz) {
    assert.ok(lessonSlugs.has(q.lessonSlug), `quiz for unknown lesson ${q.lessonSlug}`);
    assert.ok(q.options.includes(q.answer), `answer not among options: ${q.question}`);
    assert.equal(new Set(q.options).size, q.options.length, `duplicate options: ${q.question}`);
  }
});

test("the migration seeds exactly the content's tasks", () => {
  const sql = fs.readFileSync(
    new URL("../../supabase/migrations/20260930120000_robust_programs_topic.sql", import.meta.url),
    "utf8",
  );
  const seeded = [...sql.matchAll(/^\('(gcse-robust-programs-[^']+)'/gm)].map((m) => m[1]).sort();
  assert.deepEqual(seeded, content.tasks.map((t) => t.slug).sort());
});
