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

type Pyodide = {
  runPythonAsync: (code: string, options?: { globals?: unknown }) => Promise<unknown>;
  setStdin: (options: { stdin: () => string; isatty?: boolean }) => void;
  setStdout: (options: { batched: (s: string) => void } | { raw: (byte: number) => void }) => void;
  setStderr: (options: { batched: (s: string) => void } | { raw: (byte: number) => void }) => void;
  globals: {
    get: (name: string) => (() => unknown) | undefined;
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

/** Run the student's program once against a single stdin payload. */
export async function runOnce(code: string, stdin: string) {
  const pyodide = await getPyodide();
  const inputLines = stdin.length ? stdin.replace(/\r\n/g, "\n").split("\n") : [];
  let cursor = 0;
  const out: string[] = [];

  pyodide.setStdin({ stdin: () => (cursor < inputLines.length ? inputLines[cursor++]! : "") });
  pyodide.setStdout({ batched: (s) => out.push(s) });
  pyodide.setStderr({ batched: (s) => out.push(s) });

  const makeDict = pyodide.globals.get("dict");
  const namespace = makeDict ? makeDict() : undefined;

  try {
    await pyodide.runPythonAsync(code, namespace ? { globals: namespace } : undefined);
    return { output: out.join("\n"), error: undefined as string | undefined };
  } catch (err) {
    return {
      output: out.join("\n"),
      error: cleanTraceback(err instanceof Error ? err.message : String(err)),
    };
  }
}

class StdinExhausted extends Error {}

export type InteractiveOutcome = {
  output: string;
  error?: string;
  /** True if the program is paused on an input() call with no value supplied yet. */
  waiting: boolean;
};

/**
 * Run the student's program against a growing list of already-known input()
 * answers. If the program calls input() again after those are used up, the
 * run stops right there (rather than silently feeding it "") so the caller
 * can prompt for one more value and re-run with it appended - this is what
 * lets the IDE's console page ask for input right where the program needs
 * it, without a full Worker/SharedArrayBuffer-based pause/resume engine.
 */
export async function runInteractive(code: string, answers: string[]): Promise<InteractiveOutcome> {
  const pyodide = await getPyodide();
  let cursor = 0;
  let waiting = false;
  const out: string[] = [];

  pyodide.setStdin({
    stdin: () => {
      if (cursor < answers.length) {
        const value = answers[cursor++]!;
        // A real terminal echoes what you type; our fake stdin doesn't, so
        // without this the typed answer never appears in the console at
        // all and whatever the program prints next looks like it's sharing
        // the prompt's line instead of following the (invisible) answer.
        out.push(`${value}\n`);
        return value;
      }
      waiting = true;
      throw new StdinExhausted();
    },
  });
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

  const makeDict = pyodide.globals.get("dict");
  const namespace = makeDict ? makeDict() : undefined;

  try {
    await pyodide.runPythonAsync(code, namespace ? { globals: namespace } : undefined);
    return { output: out.join(""), waiting: false };
  } catch (err) {
    if (waiting) {
      return { output: out.join(""), waiting: true };
    }
    return {
      output: out.join(""),
      waiting: false,
      error: cleanTraceback(err instanceof Error ? err.message : String(err)),
    };
  }
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
export async function checkSyntax(code: string): Promise<{ line: number; message: string } | null> {
  try {
    const pyodide = await getPyodide();
    pyodide.globals.set("__student_code__", code);
    const raw = await pyodide.runPythonAsync(SYNTAX_CHECK_SNIPPET);
    if (!raw) return null;
    return JSON.parse(raw as string) as { line: number; message: string };
  } catch {
    return null;
  }
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
