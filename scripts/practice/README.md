# Practice-task reference solutions

Every practice task's wording and test cases are in `src/content/gcse-<topic>.json`.
The files here are what those tests were checked against, so a task can be
re-checked (or extended) without guessing.

- `practice-ss.mjs`, `practice-robust.mjs` - the Searching & sorting and Robust
  programs pools as authored: each task has a Python `solution`, and each test's
  expected output was produced by an independent JavaScript implementation.
- `harden-a.mjs` ... `harden-d.mjs` - a reference solution for every older practice
  task (getting started through combining techniques) plus extra test inputs.
- `verify-practice.mjs <file>` - runs a pool's solutions in real Pyodide: every test
  passes, buggy starters fail, an empty program passes nothing.
- `harden.mjs <file> [--write]` - checks the solutions against the tasks' existing
  tests (using the site's own output comparison), and adds the extra tests.

Needs `npm i --no-save pyodide@0.26.4` (the version the site runs). Solutions are
for checking only and are never shipped to students.
