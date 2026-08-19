import { linter, type Diagnostic } from "@codemirror/lint";
import { checkSyntax } from "@/lib/python-runner";

/**
 * Live syntax checking for the student's code, backed by the same Pyodide
 * instance used to run tests (compile()-only, nothing is executed). Debounced
 * by @codemirror/lint's own `delay` so it doesn't run on every keystroke.
 */
export const pythonSyntaxLinter = linter(
  async (view) => {
    const code = view.state.doc.toString();
    if (!code.trim()) return [];
    const issue = await checkSyntax(code);
    if (!issue) return [];
    const lineNumber = Math.min(Math.max(1, issue.line), view.state.doc.lines);
    const line = view.state.doc.line(lineNumber);
    const diagnostic: Diagnostic = {
      from: line.from,
      to: line.to,
      severity: "error",
      message: issue.message,
    };
    return [diagnostic];
  },
  { delay: 600 },
);
