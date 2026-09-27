// Adds SQL practice tasks (currently just "databases") from an authoring
// file, with expected outputs produced by running each reference query
// through the real sql.js engine (same library the browser's sql-runner.ts
// loads from a CDN) - never hand-typed, so a formatting quirk (SQLite's
// column ordering, how it prints a NULL, tie-breaking on an unordered
// query) can't sneak an incorrect `expect` into the content.
//
//   npm i --no-save sql.js
//   node scripts/build-sql-practice.mjs <topic> <authoring.mjs> [--write]
//
// An authoring file exports `tasks`: { key, tier, difficulty, xp, title,
// brief, hints: [a, b], schema (CREATE TABLE + INSERT, ending in the
// "-- Write your query below this line:" marker), query, stretch? }.
// Without --write it only prints each task's result set so it can be read
// through against the brief; with --write it updates src/content/gcse-
// <topic>.json and writes the migration that adds the database rows.
import initSqlJs from "sql.js";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = "C:/Users/charl/Documents/GitHub/code-quest-academy/";
const [topic, file] = process.argv.slice(2);
const write = process.argv.includes("--write");
const { tasks } = await import(pathToFileURL(path.resolve(file)).href);

const SQL = await initSqlJs();

// Mirrors sql-runner.ts's formatResult/normalise exactly, so an expected
// value generated here matches what the browser will compute at runtime.
function formatResult(result) {
  if (!result) return "";
  return result.values.map((row) => row.map((cell) => String(cell ?? "")).join(", ")).join("\n");
}
function normalise(text) {
  return text.replace(/\r\n/g, "\n").split("\n").map((line) => line.trim()).join("\n").trim();
}
function runScript(script) {
  const db = new SQL.Database();
  try {
    const results = db.exec(script);
    const last = results[results.length - 1];
    return { output: formatResult(last), error: undefined };
  } catch (err) {
    return { output: "", error: String(err.message ?? err) };
  } finally {
    db.close();
  }
}

const contentPath = `${repo}src/content/gcse-${topic}.json`;
const data = JSON.parse(fs.readFileSync(contentPath, "utf8"));
const pool = new Map((data.practiceTasks ?? []).map((t) => [t.slug, t]));
const rows = [];
let bad = 0;
const q = (s) => "'" + String(s).replaceAll("'", "''") + "'";

for (const t of tasks) {
  const slug = `gcse-${topic}-p-${t.key}`;
  console.log(`\n=== ${slug}  ${t.title}  (d${t.difficulty}${t.stretch ? ", stretch" : ""})`);
  const full = t.schema + t.query;
  const { output, error } = runScript(full);
  if (error) {
    bad++;
    console.log(`  ERROR: ${error}`);
    continue;
  }
  const expect = normalise(output);
  if (expect === "") {
    bad++;
    console.log("  EMPTY result set - query matched nothing");
    continue;
  }
  console.log(`  query: ${t.query}`);
  console.log(`  result:\n${expect
    .split("\n")
    .map((l) => "    " + l)
    .join("\n")}`);
  if (t.hints.length < 2) {
    bad++;
    console.log("  NEEDS TWO HINTS");
  }
  pool.set(slug, {
    slug, tier: t.tier, difficulty: t.difficulty, xp: t.xp, ...(t.stretch ? { stretch: true } : {}),
    title: t.title, brief: t.brief, starter: t.schema, hints: t.hints, tests: [{ expect }],
  });
  rows.push(`(${q(slug)}, 'gcse', ${q(topic)}, ${q(t.title)}, 'See lesson content.', ${t.difficulty}, ${t.xp}, true)`);
}

console.log(`\n${tasks.length} tasks, ${bad} problem(s)`);
if (write && !bad) {
  data.practiceTasks = [...pool.values()].sort((a, b) => a.slug.localeCompare(b.slug, "en", { numeric: true }));
  fs.writeFileSync(contentPath, JSON.stringify(data, null, 2) + "\n");
  const name = process.env.MIGRATION;
  if (name) {
    fs.writeFileSync(
      `${repo}supabase/migrations/${name}`,
      `-- SQL practice tasks for ${topic}: rows so attempts, XP and skill tracking have something to point at.\n-- Wording, the sample database and the single test case are in src/content/gcse-${topic}.json;\n-- every task's reference query was run against its exact schema in sql.js (the same engine\n-- the browser loads from a CDN in sql-runner.ts). Idempotent.\ninsert into public.challenges (slug, track, topic, title, brief, difficulty, xp, practice_only) values\n${rows.join(",\n")}\non conflict (slug) do nothing;\n`,
    );
    console.log("wrote migration", name);
  }
  console.log("written:", contentPath);
}
process.exit(bad ? 1 : 0);
