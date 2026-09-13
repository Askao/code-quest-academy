/**
 * Browser Python runner built on Pyodide (CPython compiled to WebAssembly).
 * Nothing is executed on the server, which keeps self-hosting trivial.
 */

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

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

type Pyodide = {
  runPython: (code: string, options?: { globals?: unknown }) => unknown;
  runPythonAsync: (code: string, options?: { globals?: unknown }) => Promise<unknown>;
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

function normalise(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

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

/** Run the student's program once against a single stdin payload. */
export function runOnce(code: string, stdin: string) {
  return runExclusive(async () => {
    const pyodide = await getPyodide();
    const inputLines = stdin.length ? stdin.replace(/\r\n/g, "\n").split("\n") : [];
    const out: string[] = [];

    pyodide.setStdout({ batched: (s) => out.push(s) });
    pyodide.setStderr({ batched: (s) => out.push(s) });

    pyodide.runPython(MAKE_TEST_INPUT_SNIPPET);
    const makeInput = pyodide.globals.get("__make_test_input__");
    const makeDict = pyodide.globals.get("dict");
    const namespace = makeDict ? (makeDict() as PyDict) : undefined;
    if (namespace && makeInput) {
      namespace.set("input", makeInput(JSON.stringify(inputLines)));
    }

    try {
      await pyodide.runPythonAsync(code, namespace ? { globals: namespace } : undefined);
      return { output: out.join("\n"), error: undefined as string | undefined };
    } catch (err) {
      return {
        output: out.join("\n"),
        error: cleanTraceback(err instanceof Error ? err.message : String(err)),
      };
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
def __make_interactive_input__(known_json, echo):
    __known = __json__.loads(known_json)
    __cursor = [0]
    def input(prompt=""):
        if __cursor[0] < len(__known):
            __value = __known[__cursor[0]]
            __cursor[0] += 1
            echo(__value)
            return __value
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

    pyodide.runPython(MAKE_INTERACTIVE_INPUT_SNIPPET);
    const makeInput = pyodide.globals.get("__make_interactive_input__");
    const makeDict = pyodide.globals.get("dict");
    const namespace = makeDict ? (makeDict() as PyDict) : undefined;
    if (namespace && makeInput) {
      // A real terminal echoes what you type; our fake stdin doesn't, so
      // without this the typed answer never appears in the console at all
      // and whatever the program prints next looks like it's sharing the
      // prompt's line instead of following the (invisible) answer.
      const echo = (value: string) => out.push(`${value}\n`);
      namespace.set("input", makeInput(JSON.stringify(answers), echo));
    }

    try {
      await pyodide.runPythonAsync(code, namespace ? { globals: namespace } : undefined);
      return { output: out.join(""), waiting: false };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes(STDIN_EXHAUSTED_MARKER)) {
        return { output: out.join(""), waiting: true };
      }
      return { output: out.join(""), waiting: false, error: cleanTraceback(message) };
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
      passed: !error && actual === expected,
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
