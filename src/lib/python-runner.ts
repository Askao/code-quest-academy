/**
 * Browser Python runner built on Pyodide (CPython compiled to WebAssembly).
 * Nothing is executed on the server, which keeps self-hosting trivial.
 */

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

import { normaliseOutput, outputsMatch } from "./output-compare";

export type TestCase = { stdin?: string; expect: string };

export type TestResult = {
  index: number;
  passed: boolean;
  stdin: string;
  expected: string;
  actual: string;
  error?: string;
};

export type RunOutcome = {
  results: TestResult[];
  passed: boolean;
  passedCount: number;
  total: number;
  durationMs: number;
};

type PyDict = { set: (key: string, value: unknown) => void };
type PyGuard = { destroy?: () => void };

type Pyodide = {
  runPython: (code: string, options?: { globals?: unknown }) => unknown;
  runPythonAsync: (
    code: string,
    options?: { globals?: unknown; filename?: string },
  ) => Promise<unknown>;
  setStdout: (options: { batched: (s: string) => void } | { raw: (byte: number) => void }) => void;
  setStderr: (options: { batched: (s: string) => void } | { raw: (byte: number) => void }) => void;
  globals: {
    get: (name: string) => ((...args: unknown[]) => unknown) | undefined;
    set: (name: string, value: unknown) => void;
  };
};

let pyodidePromise: Promise<Pyodide> | null = null;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the Python engine"));
    document.head.appendChild(script);
  });
}

export function getPyodide(): Promise<Pyodide> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Python only runs in the browser"));
  }
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      await loadScript(`${PYODIDE_URL}pyodide.js`);
      const loader = (window as unknown as { loadPyodide: (o: unknown) => Promise<Pyodide> })
        .loadPyodide;
      return loader({ indexURL: PYODIDE_URL });
    })();
  }
  return pyodidePromise;
}

// Pyodide is a single shared interpreter with global stdin/stdout/stderr
// hooks - there's no per-call isolation. The UI already disables Run/Test
// while either is in flight, but that's a render away from a fast
// double-click landing both dispatches before React commits the disabled
// state, and two overlapping executions clobber each other's I/O hooks
// mid-run (observed as one test's real pass ALSO reporting a stray
// exception from the other run). Queuing every Pyodide-touching call here,
// underneath the UI layer, closes that gap regardless of how it's triggered.
let pyodideQueue: Promise<unknown> = Promise.resolve();

function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const result = pyodideQueue.then(fn, fn);
  pyodideQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

const normalise = normaliseOutput;

function cleanTraceback(message: string) {
  const lines = message.split("\n").filter((l) => !l.includes("/lib/python") && l.trim() !== "");
  return lines.slice(-4).join("\n");
}

// input() is deliberately never satisfied via Pyodide's real stdin device
// (setStdin + sys.stdin). That stream is one persistent, buffered object
// shared by every run in this one interpreter, and it can silently serve a
// later run's input() from leftover internal state instead of ever calling
// back into JS for the stdin just configured for that run - confirmed by
// logging: the JS stdin callback was never invoked at all for a call that
// nonetheless returned "". Rebuilding sys.stdin fresh before each run was
// tried and did not fully close the gap either. Instead, input() itself is
// replaced with a plain Python closure injected straight into this run's
// own fresh namespace - it never touches sys.stdin, so there is no shared
// state left for a future run to accidentally inherit.
const MAKE_TEST_INPUT_SNIPPET = `
import json as __json__
def __make_test_input__(lines_json, state):
    __lines = __json__.loads(lines_json)
    __cursor = [0]
    def input(prompt=""):
        if __cursor[0] < len(__lines):
            __value = __lines[__cursor[0]]
            __cursor[0] += 1
            return __value
        # Past the end of the test's answers a program gets an empty line, so a
        # slip like reading once too often doesn't crash. But a loop that asks
        # until it is satisfied would be handed "" for ever.
        state["over"] += 1
        if state["over"] > state["max_over"]:
            state["kill"] = "input"
            raise EOFError("input")
        return ""
    return input
`;

// Pyodide runs on the page's own thread, so a student's loop that never
// finishes freezes the whole tab and nothing outside can interrupt it. Instead
// a tracer watches every line of the student's own code (nothing else) and
// raises RunLimit once the program has run too long, printed too much or been
// refused input too often. RunLimit is a BaseException so "except Exception"
// can't swallow it, and a flag makes the next line raise it again if a bare
// "except:" does - which is how a validation loop wrapped in try/except used
// to survive "no more input" for ever.
const RUN_SECONDS = 8;
const MAX_OUTPUT_CHARS = 100_000;
const MAX_OVER_READS = 100;
const STUDENT_FILENAME = "<student>";
// sys.monitoring tool ids 0-2 and 5 belong to debuggers, coverage, profilers and
// optimisers; 3 and 4 are free. Unlike sys.settrace, a monitoring callback keeps
// firing after the exception it raised has been caught by the student's code.
const GUARD_TOOL_ID = 3;

const GUARD_SNIPPET = `
import sys as __g_sys__, time as __g_time__

class __RunLimit__(BaseException):
    pass

class __GuardedOut__:
    def __init__(self, inner, state, limit):
        self._inner = inner
        self._state = state
        self._limit = limit
    def write(self, s):
        self._state["chars"] += len(s)
        if self._state["chars"] > self._limit:
            self._state["kill"] = "output"
            raise __RunLimit__("output")
        return self._inner.write(s)
    def flush(self):
        return self._inner.flush()
    def __getattr__(self, name):
        return getattr(self._inner, name)

def __guard_start__(seconds, max_chars, max_over):
    state = {"start": __g_time__.monotonic(), "lines": 0, "chars": 0, "kill": None, "over": 0, "max_over": max_over, "stdout": __g_sys__.stdout}
    mon = __g_sys__.monitoring
    def on_line(code, line):
        if code.co_filename != "${STUDENT_FILENAME}":
            return
        if state["kill"]:
            raise __RunLimit__(state["kill"])
        state["lines"] += 1
        if (state["lines"] & 255) == 0 and __g_time__.monotonic() - state["start"] > seconds:
            state["kill"] = "time"
            raise __RunLimit__("time")
    __g_sys__.stdout = __GuardedOut__(__g_sys__.stdout, state, max_chars)
    mon.use_tool_id(${GUARD_TOOL_ID}, "guard")
    mon.register_callback(${GUARD_TOOL_ID}, mon.events.LINE, on_line)
    mon.set_events(${GUARD_TOOL_ID}, mon.events.LINE)
    return state

def __guard_stop__(state):
    mon = __g_sys__.monitoring
    mon.set_events(${GUARD_TOOL_ID}, 0)
    mon.register_callback(${GUARD_TOOL_ID}, mon.events.LINE, None)
    mon.free_tool_id(${GUARD_TOOL_ID})
    __g_sys__.stdout = state["stdout"]
`;

const LIMIT_MESSAGES: Record<string, string> = {
  time: "Your program ran for too long and was stopped. Check that your loop changes something each time round, so that it can finish.",
  output: "Your program printed far too much and was stopped. Check that your loop can finish.",
  input:
    "Your program kept asking for more input than it was given and was stopped. Check that your loop stops when it should.",
};

/** A friendly message if the guard stopped the program, otherwise null. */
function limitMessage(message: string): string | null {
  const hit = /__RunLimit__: (\w+)/.exec(message);
  return hit ? (LIMIT_MESSAGES[hit[1]!] ?? LIMIT_MESSAGES["time"]!) : null;
}

// Files a program writes stay in the browser's in-memory folder until the page
// is closed, so without this a second Test click would find the files the first
// one left behind: a program that appends to log.txt would print the message
// twice, and one that reads a file it never wrote would seem to work. Each test
// starts from an empty folder, like a fresh computer.
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

/** Run the student's program once against a single stdin payload. */
export function runOnce(code: string, stdin: string) {
  return runExclusive(async () => {
    const pyodide = await getPyodide();
    pyodide.runPython(CLEAN_WORKDIR_SNIPPET);
    pyodide.runPython("__clean_workdir__()");
    const inputLines = stdin.length ? stdin.replace(/\r\n/g, "\n").split("\n") : [];
    const out: string[] = [];

    pyodide.setStdout({ batched: (s) => out.push(s) });
    pyodide.setStderr({ batched: (s) => out.push(s) });

    pyodide.runPython(GUARD_SNIPPET);
    pyodide.runPython(MAKE_TEST_INPUT_SNIPPET);
    const makeInput = pyodide.globals.get("__make_test_input__");
    const guardStart = pyodide.globals.get("__guard_start__");
    const guardStop = pyodide.globals.get("__guard_stop__");
    const makeDict = pyodide.globals.get("dict");
    const namespace = makeDict ? (makeDict() as PyDict) : undefined;
    const guard = guardStart
      ? (guardStart(RUN_SECONDS, MAX_OUTPUT_CHARS, MAX_OVER_READS) as PyGuard)
      : undefined;
    if (namespace && makeInput) {
      namespace.set("input", makeInput(JSON.stringify(inputLines), guard));
    }

    try {
      await pyodide.runPythonAsync(code, {
        ...(namespace ? { globals: namespace } : {}),
        filename: STUDENT_FILENAME,
      });
      return { output: out.join("\n"), error: undefined as string | undefined };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { output: out.join("\n"), error: limitMessage(message) ?? cleanTraceback(message) };
    } finally {
      if (guard && guardStop) guardStop(guard);
      guard?.destroy?.();
    }
  });
}

export type InteractiveOutcome = {
  output: string;
  error?: string;
  /** True if the program is paused on an input() call with no value supplied yet. */
  waiting: boolean;
};

// Unique marker so the "no more answers yet" case can be told apart from a
// genuine EOFError in the student's own code, without depending on it being
// the *only* exception in flight (see the JS-thrown-exception problem this
// replaced, below).
const STDIN_EXHAUSTED_MARKER = "__STDIN_EXHAUSTED__";

const MAKE_INTERACTIVE_INPUT_SNIPPET = `
import json as __json__
def __make_interactive_input__(known_json, echo, state):
    __known = __json__.loads(known_json)
    __cursor = [0]
    def input(prompt=""):
        if __cursor[0] < len(__known):
            __value = __known[__cursor[0]]
            __cursor[0] += 1
            echo(__value)
            return __value
        # Arm the kill switch as well as raising: a bare "except:" around
        # input() would swallow the EOFError and ask again for ever, but the
        # next line of the program then raises RunLimit carrying the marker.
        state["kill"] = "${STDIN_EXHAUSTED_MARKER}"
        raise EOFError("${STDIN_EXHAUSTED_MARKER}")
    return input
`;

/**
 * Run the student's program against a growing list of already-known input()
 * answers. If the program calls input() again after those are used up, the
 * run stops right there (rather than silently feeding it "") so the caller
 * can prompt for one more value and re-run with it appended - this is what
 * lets the IDE's console page ask for input right where the program needs
 * it, without a full Worker/SharedArrayBuffer-based pause/resume engine.
 *
 * Like runOnce, input() is a plain Python closure injected into this run's
 * own namespace rather than real stdin - see MAKE_TEST_INPUT_SNIPPET above
 * for why. Raising a real EOFError (tagged with a marker to identify it)
 * unwinds through the student's code exactly like a genuine one would,
 * which is more predictable than the previous approach of throwing a JS
 * error out of Pyodide's own C-level stdin-reading loop.
 */
export function runInteractive(code: string, answers: string[]): Promise<InteractiveOutcome> {
  return runExclusive(async () => {
    const pyodide = await getPyodide();
    const out: string[] = [];

    // Pyodide's "batched" stdout only flushes on a newline, so a prompt like
    // input("Name? ") - which never ends in \n - would sit stuck in its
    // internal buffer forever. Decode raw bytes instead so partial lines
    // (i.e. every input() prompt) show up immediately.
    const stdoutDecoder = new TextDecoder();
    const stderrDecoder = new TextDecoder();
    pyodide.setStdout({
      raw: (byte) => {
        const chunk = stdoutDecoder.decode(new Uint8Array([byte]), { stream: true });
        if (chunk) out.push(chunk);
      },
    });
    pyodide.setStderr({
      raw: (byte) => {
        const chunk = stderrDecoder.decode(new Uint8Array([byte]), { stream: true });
        if (chunk) out.push(chunk);
      },
    });

    pyodide.runPython(GUARD_SNIPPET);
    pyodide.runPython(MAKE_INTERACTIVE_INPUT_SNIPPET);
    const makeInput = pyodide.globals.get("__make_interactive_input__");
    const guardStart = pyodide.globals.get("__guard_start__");
    const guardStop = pyodide.globals.get("__guard_stop__");
    const makeDict = pyodide.globals.get("dict");
    const namespace = makeDict ? (makeDict() as PyDict) : undefined;
    const guard = guardStart
      ? (guardStart(RUN_SECONDS, MAX_OUTPUT_CHARS, MAX_OVER_READS) as PyGuard)
      : undefined;
    if (namespace && makeInput) {
      // A real terminal echoes what you type; our fake stdin doesn't, so
      // without this the typed answer never appears in the console at all
      // and whatever the program prints next looks like it's sharing the
      // prompt's line instead of following the (invisible) answer.
      const echo = (value: string) => out.push(`${value}\n`);
      namespace.set("input", makeInput(JSON.stringify(answers), echo, guard));
    }

    try {
      await pyodide.runPythonAsync(code, {
        ...(namespace ? { globals: namespace } : {}),
        filename: STUDENT_FILENAME,
      });
      return { output: out.join(""), waiting: false };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes(STDIN_EXHAUSTED_MARKER)) {
        return { output: out.join(""), waiting: true };
      }
      return {
        output: out.join(""),
        waiting: false,
        error: limitMessage(message) ?? cleanTraceback(message),
      };
    } finally {
      if (guard && guardStop) guardStop(guard);
      guard?.destroy?.();
    }
  });
}

const SYNTAX_CHECK_SNIPPET = `
import json as __json__
try:
    compile(__student_code__, "<student>", "exec")
    __check_result__ = None
except (SyntaxError, ValueError) as __e__:
    __check_result__ = __json__.dumps(
        {"line": getattr(__e__, "lineno", None) or 1, "message": str(getattr(__e__, "msg", __e__))}
    )
__check_result__
`;

/**
 * Compile-check (not execute) the student's code so syntax errors can be
 * shown live, before they hit "Run tests". Fails open (returns null) on any
 * unexpected runner error - this must never block editing.
 */
export function checkSyntax(code: string): Promise<{ line: number; message: string } | null> {
  return runExclusive(async () => {
    try {
      const pyodide = await getPyodide();
      pyodide.globals.set("__student_code__", code);
      const raw = await pyodide.runPythonAsync(SYNTAX_CHECK_SNIPPET);
      if (!raw) return null;
      return JSON.parse(raw as string) as { line: number; message: string };
    } catch {
      return null;
    }
  });
}

/** Run every hidden test case and mark the submission. */
export async function runTests(code: string, tests: TestCase[]): Promise<RunOutcome> {
  const started = performance.now();
  const results: TestResult[] = [];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i]!;
    const stdin = test.stdin ?? "";
    const { output, error } = await runOnce(code, stdin);
    const actual = normalise(output);
    const expected = normalise(test.expect);
    results.push({
      index: i,
      passed: !error && outputsMatch(actual, expected),
      stdin,
      expected,
      actual,
      ...(error ? { error } : {}),
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  return {
    results,
    passedCount,
    total: results.length,
    passed: results.length > 0 && passedCount === results.length,
    durationMs: Math.round(performance.now() - started),
  };
}
