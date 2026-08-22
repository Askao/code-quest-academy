import { useState } from "react";

/**
 * A small illustrated stand-in for the real practice IDE - the same visual
 * language as the homepage's CodeMock, reused here so "the editor", "Run"
 * and "the Console" in lesson notes point at something a student has
 * actually seen, not just words. Not wired to Pyodide: the output is
 * authored alongside the code, revealed on tap rather than executed, since
 * the point is showing what running code *looks like*, not re-running the
 * lesson's real worked example a second time in miniature.
 */
export function IdeMock({
  code,
  output,
  error = false,
}: {
  code: string;
  output: string;
  error?: boolean;
}) {
  const [ran, setRan] = useState(false);
  const lines = code.split("\n");

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-secondary/20">
      <div className="flex items-center justify-between border-b border-border bg-background/40 px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">practice.py</span>
        <button
          type="button"
          onClick={() => setRan((r) => !r)}
          className="rounded-md bg-primary px-2.5 py-1 font-mono text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {ran ? "↺ Reset" : "▶ Run"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-left font-mono text-xs leading-relaxed">
        <code>
          {lines.map((line, i) => (
            <div key={i}>
              <span className="mr-3 inline-block w-3 select-none text-muted-foreground/40">
                {i + 1}
              </span>
              {line || " "}
            </div>
          ))}
        </code>
      </pre>
      <div
        className={`border-t px-3 py-2 ${error ? "border-destructive/30 bg-destructive/10" : "border-border bg-background/40"}`}
      >
        <p className="font-mono text-[0.65rem] tracking-wide text-muted-foreground uppercase">
          Console
        </p>
        {ran ? (
          <pre
            className={`mt-1 overflow-x-auto font-mono text-xs whitespace-pre-wrap ${error ? "text-destructive" : "text-foreground"}`}
          >
            {output}
          </pre>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Click Run to see what happens.</p>
        )}
      </div>
    </div>
  );
}
