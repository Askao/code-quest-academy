/**
 * Line-by-line variable trace for lesson worked examples, built on the same
 * Pyodide engine as python-runner.ts. Runs the real worked example once
 * (with canned demo answers standing in for input()) and records, after
 * every line finishes executing, a snapshot of every module-level variable -
 * so a lesson page can let a student step through and watch values appear
 * and change, rather than just reading a static code block.
 *
 * Deliberately module-level-only (no call-stack frames, no memory diagram):
 * research on notional-machine visualizations for novices (e.g. Python
 * Tutor) warns that highly detailed traces can anchor beginners to
 * low-level mechanics instead of the concept being taught - so this stays
 * as plain as the worked examples themselves, which are flat scripts.
 */
import { getPyodide } from "./python-runner";

export type TraceVar = { value: string; type: string };
/** `console` is the full terminal transcript (echoed input + printed output) up to and including this line. */
export type TraceStep = { line: number; vars: Record<string, TraceVar>; console: string };
export type TraceResult = { steps: TraceStep[]; error?: string };

const TRACE_SNIPPET = `
import sys, json as __json__, builtins as __builtins__

class __ConsoleBuffer__:
    def __init__(self):
        self.text = ""
    def write(self, s):
        self.text += s
    def flush(self):
        pass

__console__ = __ConsoleBuffer__()
__real_stdout__ = sys.stdout
sys.stdout = __console__

__demo_cursor__ = [0]
def __fake_input__(prompt=""):
    if prompt:
        __console__.write(str(prompt))
    i = __demo_cursor__[0]
    __demo_cursor__[0] += 1
    answer = __demo_inputs__[i] if i < len(__demo_inputs__) else ""
    # Echo the "typed" answer, same as a real terminal would - without this
    # the console would silently skip straight to whatever prints next.
    __console__.write(answer + "\\n")
    return answer
__builtins__.input = __fake_input__

__steps__ = []
__pending__ = [None]

def __snapshot_vars__(g):
    out = {}
    for k, v in g.items():
        if k.startswith("__"):
            continue
        if callable(v):
            continue
        try:
            out[k] = {"value": repr(v), "type": type(v).__name__}
        except Exception:
            out[k] = {"value": "?", "type": type(v).__name__}
    return out

def __tracer__(frame, event, arg):
    if frame.f_code.co_filename != "<worked_example>":
        return None
    if event == "line":
        if __pending__[0] is not None:
            __steps__.append({"line": __pending__[0], "vars": __snapshot_vars__(frame.f_globals), "console": __console__.text})
        __pending__[0] = frame.f_lineno
    elif event == "return":
        if __pending__[0] is not None:
            __steps__.append({"line": __pending__[0], "vars": __snapshot_vars__(frame.f_globals), "console": __console__.text})
            __pending__[0] = None
    return __tracer__

__trace_error__ = None
__ns__ = {"__name__": "__main__"}
sys.settrace(__tracer__)
try:
    exec(compile(__source__, "<worked_example>", "exec"), __ns__)
except Exception as __e__:
    __trace_error__ = str(__e__)
finally:
    sys.settrace(None)
    sys.stdout = __real_stdout__

__json__.dumps({"steps": __steps__, "error": __trace_error__})
`;

/**
 * Trace a worked example's execution. `demoInputs` stands in for whatever
 * input() would read at runtime - lesson content supplies these so the
 * trace tells a fixed, deliberately-chosen story (e.g. name="Ada", age=15)
 * rather than running with no input and erroring immediately.
 */
export async function traceWorkedExample(
  source: string,
  demoInputs: string[],
): Promise<TraceResult> {
  const pyodide = await getPyodide();
  pyodide.globals.set("__source__", source);
  pyodide.globals.set("__demo_inputs__", demoInputs);
  try {
    const raw = await pyodide.runPythonAsync(TRACE_SNIPPET);
    const parsed = JSON.parse(raw as string) as TraceResult;
    return parsed;
  } catch (err) {
    return { steps: [], error: err instanceof Error ? err.message : String(err) };
  }
}
