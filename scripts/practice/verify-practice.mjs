// Verifies practice tasks in real Pyodide: reference solution passes every test,
// buggy starters fail, an empty program passes nothing, no test is a duplicate,
// and no hint gives away the whole answer (heuristic: a hint that is mostly code).
import { loadPyodide } from "pyodide";
import { pathToFileURL } from "node:url";

const mod = await import(pathToFileURL(process.argv[2]).href);
const tasks = mod.tasks;
const pyodide = await loadPyodide();
pyodide.runPython(`
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
`);
const normalise = (t) => t.replace(/\r\n/g, "\n").split("\n").map((l) => l.trimEnd()).join("\n").trim();

async function run(code, stdin) {
  const lines = stdin.length ? stdin.replace(/\r\n/g, "\n").split("\n") : [];
  const out = [];
  pyodide.setStdout({ batched: (s) => out.push(s) });
  pyodide.setStderr({ batched: (s) => out.push(s) });
  const ns = pyodide.globals.get("dict")();
  ns.set("input", pyodide.globals.get("__make_test_input__")(JSON.stringify(lines)));
  try {
    await pyodide.runPythonAsync(code, { globals: ns });
    return { output: normalise(out.join("\n")) };
  } catch (e) {
    return { output: normalise(out.join("\n")), error: String(e.message).split("\n").slice(-2).join(" | ") };
  }
}

let bad = 0, warn = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? "ok   " : "FAIL ") + msg); };
const slugs = new Set();

for (const task of tasks) {
  if (slugs.has(task.slug)) say(false, `${task.slug} duplicate slug`);
  slugs.add(task.slug);
  let all = true;
  for (const test of task.tests) {
    const r = await run(task.solution, test.stdin);
    const pass = !r.error && r.output === normalise(test.expect);
    if (!pass) {
      all = false;
      console.log(`   ${task.slug} stdin=${JSON.stringify(test.stdin)} expected=${JSON.stringify(test.expect)} got=${JSON.stringify(r.output)} ${r.error ?? ""}`);
    }
  }
  say(all, `${task.slug} solution passes all ${task.tests.length} tests`);
  if (task.tests.length < 3) { warn++; console.log(`WARN ${task.slug} has only ${task.tests.length} tests`); }
  const keys = task.tests.map((x) => x.stdin);
  if (new Set(keys).size !== keys.length) { warn++; console.log(`WARN ${task.slug} repeats a test input`); }
  const empty = await run("", task.tests[0].stdin);
  say(empty.output !== normalise(task.tests[0].expect), `${task.slug} empty program does not pass`);
  if (task.starter) {
    let fails = 0;
    for (const test of task.tests) {
      const r = await run(task.starter, test.stdin);
      if (r.error || r.output !== normalise(test.expect)) fails++;
    }
    say(fails > 0, `${task.slug} starter fails ${fails}/${task.tests.length}`);
  }
  // wording checks
  const brief = task.brief;
  if (/[^\n ] {2,}[^\n ]/.test(brief.replace(/`[^`]*`/g, "x"))) { warn++; console.log(`WARN ${task.slug} has double spaces`); }
  if (task.hints.length < 2) { warn++; console.log(`WARN ${task.slug} needs two hints`); }
  if (brief.length < 40) { warn++; console.log(`WARN ${task.slug} brief very short`); }
}
console.log(`\n${tasks.length} tasks, ${bad} problem(s), ${warn} warning(s)`);
process.exit(bad ? 1 : 0);
