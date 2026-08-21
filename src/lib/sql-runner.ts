/**
 * Browser SQL runner built on sql.js (SQLite compiled to WebAssembly), the
 * same CDN-loaded WASM pattern as python-runner.ts. Used only by the
 * "databases" GCSE topic (AQA's one topic OCR doesn't have at all).
 *
 * Unlike Python tasks, a SQL task's starter code IS the sample database:
 * CREATE TABLE + INSERT statements the student can see, followed by a
 * comment marking where their own query goes. Running a submission means
 * executing the whole script - schema, seed data and the student's query -
 * against a fresh in-memory database each time, then reading off the
 * result rows of the *last* statement that returned any (i.e. their
 * SELECT). There's no stdin/output-stream concept here, so this is a much
 * smaller module than python-runner.ts - one shot in, one result set out.
 */

const SQLJS_VERSION = "1.11.0";
const SQLJS_BASE = `https://cdn.jsdelivr.net/npm/sql.js@${SQLJS_VERSION}/dist/`;

export type SqlTestCase = { expect: string };

export type SqlTestResult = {
  index: number;
  passed: boolean;
  /** Never set - SQL tests have no stdin equivalent. Present only so this
   * shape lines up structurally with python-runner's TestResult, letting
   * play.$slug.tsx render both through the same JSX without branching. */
  stdin?: undefined;
  expected: string;
  actual: string;
  error?: string;
};

export type SqlRunOutcome = {
  results: SqlTestResult[];
  passed: boolean;
  passedCount: number;
  total: number;
  durationMs: number;
};

type QueryExecResult = { columns: string[]; values: unknown[][] };

type SqlJsDatabase = {
  exec: (sql: string) => QueryExecResult[];
  close: () => void;
};

type SqlJsStatic = {
  Database: new () => SqlJsDatabase;
};

let sqlJsPromise: Promise<SqlJsStatic> | null = null;

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
    script.onerror = () => reject(new Error("Could not load the SQL engine"));
    document.head.appendChild(script);
  });
}

export function getSqlJs(): Promise<SqlJsStatic> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("SQL only runs in the browser"));
  }
  if (!sqlJsPromise) {
    sqlJsPromise = (async () => {
      await loadScript(`${SQLJS_BASE}sql-wasm.js`);
      const initSqlJs = (window as unknown as { initSqlJs: (o: unknown) => Promise<SqlJsStatic> })
        .initSqlJs;
      return initSqlJs({ locateFile: (file: string) => `${SQLJS_BASE}${file}` });
    })();
  }
  return sqlJsPromise;
}

/** One row per line, columns joined by ", " - plain and readable, and easy
 * for a task author to hand-write an `expect` string that matches exactly. */
function formatResult(result: QueryExecResult | undefined): string {
  if (!result) return "";
  return result.values.map((row) => row.map((cell) => String(cell ?? "")).join(", ")).join("\n");
}

/** Run the student's full script (schema + seed data + their query) once,
 * returning the formatted result of the last statement that produced rows. */
export async function runSqlOnce(script: string) {
  const SQL = await getSqlJs();
  const db = new SQL.Database();
  try {
    const results = db.exec(script);
    const last = results[results.length - 1];
    return { output: formatResult(last), error: undefined as string | undefined };
  } catch (err) {
    return { output: "", error: err instanceof Error ? err.message : String(err) };
  } finally {
    db.close();
  }
}

function normalise(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

/** Run every test case - each re-executes the full script from scratch
 * against its own fresh database, so an earlier test's INSERT/UPDATE can
 * never leak into a later one. */
export async function runSqlTests(script: string, tests: SqlTestCase[]): Promise<SqlRunOutcome> {
  const started = performance.now();
  const results: SqlTestResult[] = [];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i]!;
    const { output, error } = await runSqlOnce(script);
    const actual = normalise(output);
    const expected = normalise(test.expect);
    results.push({
      index: i,
      passed: !error && actual === expected,
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
