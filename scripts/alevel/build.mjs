// Builds an A level topic from its authoring file, checking every task in the
// real Python engine the site uses (Pyodide 0.26.4) before anything is written.
//
//   npm i --no-save pyodide@0.26.4
//   node scripts/alevel/build.mjs scripts/alevel/topics/oop.mjs          # check and print
//   node scripts/alevel/build.mjs scripts/alevel/topics/oop.mjs --write  # also write the JSON
//
// An authoring file exports `topic` and `lessons`. Each lesson has title,
// summary, notes, worked_example, worked_example_note (and optionally
// worked_example_demo_input), quiz [{question, options, answer, explanation}],
// tasks and homework. Each task has title, brief, starter, hints [a, b],
// tier, difficulty, xp, optional stretch, a reference `solution` and `inputs`
// (one stdin string per test).
//
// Every test's expected output is what the reference solution prints for that
// input, so a test can never disagree with a working answer. The checks:
//   - the solution runs without error and prints something for every input;
//   - the starter code, and an empty program, fail at least one test;
//   - at least three tests, and no two tests with the same input;
//   - every quiz answer is one of its options.
// The printed table (input -> output for every test) is for reading each task
// through against its brief; it is the human check that the brief is right.
//
// Solutions stay in scripts/ and are never shipped to students.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadPyodide } from "pyodide";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const [file] = process.argv.slice(2);
const write = process.argv.includes("--write");
const quiet = process.argv.includes("--quiet");
const { topic, lessons } = await import(pathToFileURL(path.resolve(file)).href);

// --- the site's own marking, copied from src/lib/python-runner.ts and
// src/lib/output-compare.ts so a pass here is a pass in the browser ---------
const MAKE_TEST_INPUT_SNIPPET = `
import json as __json__
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
`;
const CLEAN_WORKDIR_SNIPPET = `
import os as __os__
def __clean_workdir__():
    for __name in __os__.listdir("."):
        __path = __os__.path.join(".", __name)
        if __os__.path.isfile(__path):
            try:
                __os__.remove(__path)
            except OSError:
                pass
`;
const normaliseOutput = (t) =>
  t
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n")
    .trim();
const canonicalNumbers = (t) => t.replace(/-?\d+\.\d+/g, (m) => String(parseFloat(m)));
const outputsMatch = (a, e) => {
  const x = normaliseOutput(a);
  const y = normaliseOutput(e);
  return x === y || canonicalNumbers(x) === canonicalNumbers(y);
};

const py = await loadPyodide();
py.FS.mkdirTree("/home/pyodide/work");
py.FS.chdir("/home/pyodide/work");

async function run(code, stdin) {
  py.runPython(CLEAN_WORKDIR_SNIPPET);
  py.runPython("__clean_workdir__()");
  const lines = stdin.length ? stdin.replace(/\r\n/g, "\n").split("\n") : [];
  const out = [];
  py.setStdout({ batched: (s) => out.push(s) });
  py.setStderr({ batched: (s) => out.push(s) });
  py.runPython(MAKE_TEST_INPUT_SNIPPET);
  const ns = py.globals.get("dict")();
  ns.set("input", py.globals.get("__make_test_input__")(JSON.stringify(lines)));
  // A runaway loop in a solution would hang the build; the browser has its own guard.
  try {
    await py.runPythonAsync(code, { globals: ns });
    return { output: out.join("\n"), error: null };
  } catch (err) {
    return { output: out.join("\n"), error: String(err.message ?? err).split("\n").slice(-2).join(" ") };
  }
}

const problems = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

async function buildTask(t, where) {
  if (!t.title || !t.brief || !t.solution) fail(where, "needs title, brief and solution");
  if (!Array.isArray(t.hints) || t.hints.length < 2) fail(where, "needs two hints");
  if (!Array.isArray(t.inputs) || t.inputs.length < 3) fail(where, "needs at least three test inputs");
  if (new Set(t.inputs).size !== t.inputs.length) fail(where, "two tests have the same input");
  const tests = [];
  for (const stdin of t.inputs ?? []) {
    const r = await run(t.solution, stdin);
    if (r.error) fail(where, `solution errors on ${JSON.stringify(stdin)}: ${r.error}`);
    if (!normaliseOutput(r.output)) fail(where, `solution prints nothing for ${JSON.stringify(stdin)}`);
    tests.push(stdin === "" ? { expect: normaliseOutput(r.output) } : { stdin, expect: normaliseOutput(r.output) });
  }
  const passesAll = async (code) => {
    for (const test of tests) {
      const r = await run(code, test.stdin ?? "");
      if (r.error || !outputsMatch(r.output, test.expect)) return false;
    }
    return true;
  };
  if (await passesAll("")) fail(where, "an empty program passes every test");
  if (t.starter && (await passesAll(t.starter))) fail(where, "the starter code already passes every test");
  if (!quiet) {
    console.log(`\n  ${where}  "${t.title}"  (tier ${t.tier}, difficulty ${t.difficulty}${t.stretch ? ", stretch" : ""})`);
    for (const test of tests) {
      const input = (test.stdin ?? "(no input)").replace(/\n/g, " | ");
      console.log(`    ${input}\n      -> ${test.expect.replace(/\n/g, "\n         ")}`);
    }
  }
  return tests;
}

const out = { track: "alevel", topic, lessons: [], quiz: [], tasks: [], homeworkTasks: [] };
for (const [i, lesson] of lessons.entries()) {
  const n = i + 1;
  const slug = `alevel-${topic}-${n}`;
  if (!quiet) console.log(`\nLESSON ${n}: ${lesson.title}`);
  const l = {
    slug,
    title: lesson.title,
    summary: lesson.summary,
    notes: lesson.notes.trim(),
    worked_example: lesson.worked_example.trim(),
    worked_example_note: lesson.worked_example_note,
  };
  if (lesson.worked_example_demo_input) {
    l.worked_example_demo_input = lesson.worked_example_demo_input;
    const r = await run(l.worked_example, lesson.worked_example_demo_input.join("\n"));
    if (r.error) fail(slug, `worked example errors: ${r.error}`);
  } else if (!/^\s*(--|<|\/\/)/.test(l.worked_example)) {
    const r = await run(l.worked_example, "");
    if (r.error) fail(slug, `worked example errors: ${r.error}`);
  }
  out.lessons.push(l);
  for (const q of lesson.quiz ?? []) {
    if (!q.options.includes(q.answer)) fail(slug, `quiz answer not among options: ${q.question}`);
    if (new Set(q.options).size !== q.options.length) fail(slug, `duplicate quiz options: ${q.question}`);
    out.quiz.push({ lessonSlug: slug, ...q });
  }
  if ((lesson.quiz ?? []).length < 2) fail(slug, "needs at least two quiz questions");
  let k = 0;
  for (const t of lesson.tasks) {
    const tslug = t.stretch ? `alevel-${topic}-t${n}-stretch` : `alevel-${topic}-t${n}-${String(++k).padStart(2, "0")}`;
    const tests = await buildTask(t, tslug);
    out.tasks.push({
      slug: tslug,
      lesson: n,
      tier: t.tier,
      difficulty: t.difficulty,
      xp: t.xp,
      ...(t.stretch ? { stretch: true } : {}),
      title: t.title,
      brief: t.brief.trim(),
      starter: t.starter ?? "",
      hints: t.hints,
      tests,
    });
  }
  for (const t of lesson.homework ?? []) {
    const hslug = `alevel-${topic}-hw-${String(out.homeworkTasks.length + 1).padStart(2, "0")}`;
    const tests = await buildTask(t, hslug);
    out.homeworkTasks.push({
      slug: hslug,
      lesson: n,
      tier: t.tier,
      difficulty: t.difficulty,
      xp: t.xp,
      title: t.title,
      brief: t.brief.trim(),
      starter: t.starter ?? "",
      hints: t.hints,
      tests,
    });
  }
}

const slugs = [...out.tasks, ...out.homeworkTasks].map((t) => t.slug);
if (new Set(slugs).size !== slugs.length) fail(topic, "duplicate task slugs");

console.log(
  `\n${topic}: ${out.lessons.length} lessons, ${out.tasks.length} lesson tasks, ${out.homeworkTasks.length} homework tasks, ${out.quiz.length} quiz questions`,
);
if (problems.length) {
  console.log(`\n${problems.length} PROBLEM(S):\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log("All checks passed.");
if (write) {
  const dest = path.join(root, `src/content/alevel-${topic}.json`);
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${path.relative(root, dest)}`);

  // The database only holds each task's identity and metadata (attempts, XP
  // and skill levels point at it); wording and tests come from the JSON. A
  // topic keeps one migration, rewritten in place when the topic is rebuilt.
  const migrations = path.join(root, "supabase/migrations");
  const suffix = `_alevel_${topic.replace(/-/g, "_")}.sql`;
  const existing = fs.readdirSync(migrations).find((f) => f.endsWith(suffix));
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const migration = path.join(migrations, existing ?? `${stamp}${suffix}`);
  // Dollar quoting, so no title can end a string early (the quoting bug
  // CLAUDE.md warns about).
  const q = (v) => {
    if (String(v).includes("$t$")) throw new Error(`text contains the quote tag: ${v}`);
    return `$t$${v}$t$`;
  };
  const rows = [
    ...out.tasks.map((t) => ({ ...t, homework: false })),
    ...out.homeworkTasks.map((t) => ({ ...t, homework: true })),
  ].map(
    (t) =>
      `(${q(t.slug)}, 'alevel', ${q(topic)}, ${q(t.title)}, 'See lesson content.', ${t.difficulty}, ${t.xp}, ${t.homework})`,
  );
  const sql = `-- GENERATED by scripts/alevel/build.mjs from ${path.relative(root, file)}.
-- A level topic "${topic}": one row per lesson task and homework task, so
-- attempts, XP and skill levels have something to point at. Wording, hints and
-- tests live in src/content/alevel-${topic}.json. Safe to run more than once.
insert into public.challenges (slug, track, topic, title, brief, difficulty, xp, homework_only) values
${rows.join(",\n")}
on conflict (slug) do update set
  title = excluded.title,
  difficulty = excluded.difficulty,
  xp = excluded.xp,
  homework_only = excluded.homework_only;
`;
  fs.writeFileSync(migration, sql);
  console.log(`Wrote ${path.relative(root, migration)}`);
}
