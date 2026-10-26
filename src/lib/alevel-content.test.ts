import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// Guards the A level topics built by scripts/alevel/build.mjs: every task is
// complete, has a database row, and every quiz answer is one of its options.
// (The build script runs each task's model answer in Pyodide; this checks
// nothing has drifted since, e.g. a JSON edited by hand.)
type Task = {
  slug: string;
  title: string;
  brief: string;
  hints: string[];
  tests: { stdin?: string; expect: string }[];
  difficulty: number;
  tier: number;
  xp: number;
};
type Topic = {
  track: string;
  topic: string;
  lessons: { slug: string; title: string; notes: string }[];
  quiz: { lessonSlug: string; options: string[]; answer: string }[];
  tasks: Task[];
  homeworkTasks: Task[];
};

const contentDir = new URL("../content/", import.meta.url);
const topics = fs
  .readdirSync(contentDir)
  .filter((f) => /^alevel-.*\.json$/.test(f))
  .map((f) => JSON.parse(fs.readFileSync(new URL(f, contentDir), "utf8")) as Topic);

const migrations = fs
  .readdirSync(new URL("../../supabase/migrations/", import.meta.url))
  .filter((f) => f.endsWith(".sql"))
  .map((f) => fs.readFileSync(new URL(`../../supabase/migrations/${f}`, import.meta.url), "utf8"))
  .join("\n");

const contentModule = fs.readFileSync(new URL("./content.ts", import.meta.url), "utf8");
const gameModule = fs.readFileSync(new URL("./game.ts", import.meta.url), "utf8");

test("every A level topic file is loaded and listed", () => {
  assert.ok(topics.length > 0);
  for (const t of topics) {
    assert.equal(t.track, "alevel", `${t.topic}: track`);
    assert.ok(
      contentModule.includes(`@/content/alevel-${t.topic}.json`),
      `${t.topic}: not imported in content.ts`,
    );
    assert.ok(gameModule.includes(`key: "${t.topic}"`), `${t.topic}: not in ALEVEL_TOPICS`);
  }
});

test("every A level task is complete and has a database row", () => {
  for (const t of topics) {
    const all = [...t.tasks, ...t.homeworkTasks];
    assert.equal(new Set(all.map((x) => x.slug)).size, all.length, `${t.topic}: duplicate slugs`);
    for (const task of all) {
      assert.ok(task.brief.trim().length >= 40, `${task.slug}: brief too short`);
      assert.ok(task.hints.length >= 2, `${task.slug}: needs two hints`);
      assert.ok(task.difficulty >= 1 && task.difficulty <= 5, `${task.slug}: difficulty`);
      assert.ok(task.tier >= 1 && task.tier <= 4, `${task.slug}: tier`);
      assert.ok(task.tests.length >= 3, `${task.slug}: needs 3+ tests`);
      const inputs = task.tests.map((x) => x.stdin ?? "");
      assert.equal(new Set(inputs).size, inputs.length, `${task.slug}: repeated test input`);
      for (const x of task.tests)
        assert.ok(x.expect.trim(), `${task.slug}: a test expects no output`);
      assert.ok(migrations.includes(`$t$${task.slug}$t$`), `${task.slug}: no challenges row`);
    }
  }
});

test("every A level lesson has notes and a quiz whose answers are among the options", () => {
  for (const t of topics) {
    for (const l of t.lessons) {
      assert.ok(l.notes.length > 200, `${l.slug}: notes too short`);
      const quiz = t.quiz.filter((q) => q.lessonSlug === l.slug);
      assert.ok(quiz.length >= 2, `${l.slug}: needs a quiz`);
      for (const q of quiz)
        assert.ok(q.options.includes(q.answer), `${l.slug}: quiz answer missing`);
      assert.ok(
        t.tasks.some((x) => x.slug.startsWith(`alevel-${t.topic}-t${l.slug.split("-").pop()}-`)),
        `${l.slug}: no tasks`,
      );
    }
  }
});
