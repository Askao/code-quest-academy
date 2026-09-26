// Runs reference solutions for the existing practice tasks in real Pyodide, checks
// they pass the tasks' existing tests (using the site's own output comparison),
// then appends extra test cases whose expected output comes from the solution.
import { loadPyodide } from "pyodide";
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const repo = new URL("../../", import.meta.url).href.replace("file:///", "");
const write = process.argv.includes("--write");
const modFile = process.argv[2];
const { topics, briefFixes = {}, testFixes = {} } = await import(pathToFileURL(modFile).href);

// same comparison the site uses
const { outputsMatch } = await import(pathToFileURL(repo + "src/lib/output-compare.ts").href);

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
    return { output: out.join("\n") };
  } catch (e) {
    return { output: out.join("\n"), error: String(e.message).split("\n").slice(-2).join(" | ") };
  }
}

let problems = 0, added = 0, wordingChanged = 0;
for (const [topic, fixes] of Object.entries(topics)) {
  const path = `${repo}src/content/gcse-${topic}.json`;
  const data = JSON.parse(fs.readFileSync(path, "utf8"));
  const pool = data.practiceTasks;
  for (const task of pool) {
    const key = task.slug.replace(`gcse-${topic}-`, "");
    // wording: "Report ..." -> "Print ..." (ambiguous verb) everywhere in the pool
    const tidy = task.brief.replace(/(^|\. |\n)Report /g, "$1Print ");
    if (tidy !== task.brief) { task.brief = tidy; wordingChanged++; }
    const fix = fixes[key];
    if (!fix) { console.log(`NOTE ${topic}/${key} has no hardening entry`); continue; }
    if (briefFixes[`${topic}/${key}`]) { task.brief = briefFixes[`${topic}/${key}`]; wordingChanged++; }
    for (const tf of testFixes[`${topic}/${key}`] ?? []) {
      const t = task.tests.find((x) => (x.stdin ?? "") === tf.from);
      if (t) { t.stdin = tf.to; wordingChanged++; console.log(`FIXED test in ${topic}/${key}`); }
    }
    let ok = true;
    for (const test of task.tests) {
      const r = await run(fix.solution, test.stdin ?? "");
      if (r.error || !outputsMatch(r.output, test.expect)) {
        ok = false;
        console.log(`  MISMATCH ${topic}/${key} stdin=${JSON.stringify(test.stdin)} expected=${JSON.stringify(test.expect)} got=${JSON.stringify(r.output)} ${r.error ?? ""}`);
      }
    }
    if (!ok) { problems++; continue; }
    const have = new Set(task.tests.map((t) => t.stdin ?? ""));
    for (const stdin of fix.extra ?? []) {
      if (have.has(stdin)) continue;
      const r = await run(fix.solution, stdin);
      if (r.error) { console.log(`  ERROR ${topic}/${key} extra ${JSON.stringify(stdin)}: ${r.error}`); problems++; continue; }
      task.tests.push({ stdin, expect: r.output.trim() });
      have.add(stdin); added++;
    }
    console.log(`ok   ${topic}/${key}: ${task.tests.length} tests`);
  }
  if (write) fs.writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}
console.log(`\n${problems} problem(s); ${added} test case(s) added; ${wordingChanged} brief(s) reworded${write ? " (written)" : " (dry run)"}`);
process.exit(problems ? 1 : 0);
