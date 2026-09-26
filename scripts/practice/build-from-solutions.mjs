// Adds new practice tasks to a topic from an authoring file, with expected outputs
// produced by running each reference solution in real Pyodide (0.26.4).
//
//   npm i --no-save pyodide@0.26.4
//   node scripts/practice/build-from-solutions.mjs <topic> <authoring.mjs> [--write]
//
// An authoring file exports `tasks`: { key, tier, difficulty, xp, title, brief,
// hints: [a, b], inputs: [stdin, ...], solution, stretch?, starter? }. Without
// --write it only prints every input -> output pair so they can be read through
// against the brief; with --write it updates src/content/gcse-<topic>.json and
// writes the migration that adds the database rows.
import { loadPyodide } from "pyodide";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = new URL("../../", import.meta.url).href.replace("file:///", "");
const [topic, file] = process.argv.slice(2);
const write = process.argv.includes("--write");
const { tasks } = await import(pathToFileURL(path.resolve(file)).href);

const py = await loadPyodide();
py.runPython(`
import json as __json__, os as __os__
def __make_test_input__(lines_json):
    __lines = __json__.loads(lines_json)
    __cursor = [0]
    def input(prompt=""):
        if __cursor[0] < len(__lines):
            __value = __lines[__cursor[0]]
            __cursor[0] += 1
            return __value
        return ""
    return input
def __clean_workdir__():
    for __name in __os__.listdir("."):
        __path = __os__.path.join(".", __name)
        if __os__.path.isfile(__path):
            try:
                __os__.remove(__path)
            except OSError:
                pass
`);
async function run(code, stdin) {
  py.runPython("__clean_workdir__()");
  const lines = stdin.length ? stdin.split("\n") : [];
  const out = [];
  py.setStdout({ batched: (s) => out.push(s) });
  py.setStderr({ batched: (s) => out.push(s) });
  const ns = py.globals.get("dict")();
  ns.set("input", py.globals.get("__make_test_input__")(JSON.stringify(lines)));
  try {
    await py.runPythonAsync(code, { globals: ns });
    return { output: out.join("\n").replace(/\n+$/, "") };
  } catch (e) {
    return { error: String(e.message).split("\n").slice(-2).join(" | ") };
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
  const tests = [];
  for (const stdin of t.inputs) {
    const r = await run(t.solution, stdin);
    if (r.error) { bad++; console.log(`  ERROR on ${JSON.stringify(stdin)}: ${r.error}`); continue; }
    if (r.output.trim() === "") { bad++; console.log(`  EMPTY output for ${JSON.stringify(stdin)} - an empty program would pass`); continue; }
    tests.push({ stdin, expect: r.output });
    console.log(`  ${JSON.stringify(stdin).padEnd(38)} => ${JSON.stringify(r.output)}`);
  }
  if (tests.length < 3) { bad++; console.log("  TOO FEW TESTS"); }
  if (new Set(tests.map((x) => x.expect)).size < 2) { bad++; console.log("  EVERY TEST GIVES THE SAME ANSWER"); }
  if (t.hints.length < 2) { bad++; console.log("  NEEDS TWO HINTS"); }
  const empty = await run("", t.inputs[0]);
  if (!empty.error && empty.output === tests[0]?.expect) { bad++; console.log("  AN EMPTY PROGRAM PASSES"); }
  if (t.starter) {
    let fails = 0;
    for (const x of tests) { const r = await run(t.starter, x.stdin); if (r.error || r.output !== x.expect) fails++; }
    if (fails === 0) { bad++; console.log("  THE STARTER ALREADY PASSES"); }
  }
  pool.set(slug, {
    slug, tier: t.tier, difficulty: t.difficulty, xp: t.xp, ...(t.stretch ? { stretch: true } : {}),
    title: t.title, brief: t.brief, starter: t.starter ?? "", hints: t.hints, tests,
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
      `-- More practice tasks for ${topic}: rows so attempts, XP and skill tracking have something to point at.\n-- Wording, hints and tests are in src/content/gcse-${topic}.json; every task's reference solution was run\n-- against its exact test cases in Pyodide 0.26.4. Idempotent.\ninsert into public.challenges (slug, track, topic, title, brief, difficulty, xp, practice_only) values\n${rows.join(",\n")}\non conflict (slug) do nothing;\n`,
    );
    console.log("wrote migration", name);
  }
  console.log("written:", contentPath);
}
process.exit(bad ? 1 : 0);
