import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { traceWorkedExample, type TraceStep } from "@/lib/trace-runner";

const STEP_DELAY_MS = 1300;
const LOOP_PAUSE_MS = 1800;

/**
 * A step-through visualisation of a lesson's worked example: real code,
 * really executed (via Pyodide), one line at a time, with a small table
 * showing each variable's value at that point in the run.
 *
 * Deliberately narrow in scope - variables only, no output panel, no call
 * stack - on the research behind PRIMM (Sentance & Waite) that tracing code
 * before writing it is what builds a novice's mental model, and separate
 * work on notional-machine visualisations warning that packing in every
 * runtime detail at once (stack frames, memory addresses) can anchor
 * beginners to mechanics instead of the concept being taught. Manual
 * stepping is the default rather than autoplay, so a student predicts each
 * line before seeing the answer instead of just watching it go by.
 */
export function VariableTrace({
  source,
  demoInput,
}: {
  source: string;
  demoInput: string[];
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["worked-example-trace", source, demoInput],
    queryFn: () => traceWorkedExample(source, demoInput),
    staleTime: Infinity,
  });

  const lines = source.split("\n");
  const steps = data?.steps ?? [];
  // -1 = nothing has run yet; 0..steps.length-1 = that many lines executed.
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIndex(-1);
    setPlaying(false);
  }, [source, demoInput]);

  useEffect(() => {
    if (!playing || steps.length === 0) return;
    const delay = index >= steps.length - 1 ? LOOP_PAUSE_MS : STEP_DELAY_MS;
    timerRef.current = setTimeout(() => {
      setIndex((i) => (i >= steps.length - 1 ? -1 : i + 1));
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, index, steps.length]);

  if (isLoading) {
    return (
      <div className="mt-3 rounded-lg border border-border bg-secondary/40 p-4">
        <p className="font-mono text-xs text-muted-foreground">Loading the Python engine…</p>
      </div>
    );
  }

  // Falls back to the plain static block if tracing failed - this must
  // never be the reason a worked example doesn't render at all.
  if (!data || data.error || steps.length === 0) {
    return (
      <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-secondary/40 p-4 text-xs">
        <code>{source}</code>
      </pre>
    );
  }

  const currentLine = index === -1 ? steps[0]!.line : steps[index]!.line;
  const currentVars = index === -1 ? {} : steps[index]!.vars;
  const previousVars: TraceStep["vars"] = index <= 0 ? {} : steps[index - 1]!.vars;
  const started = index >= 0;
  const finished = index === steps.length - 1;

  const toggleLine = () => {
    setPlaying(false);
    setIndex((i) => Math.min(i + 1, steps.length - 1));
  };
  const back = () => {
    setPlaying(false);
    setIndex((i) => Math.max(i - 1, -1));
  };
  const restart = () => {
    setPlaying(false);
    setIndex(-1);
  };

  return (
    <div className="mt-3 rounded-lg border border-border bg-secondary/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {!started
            ? "Predict what the first line will do, then click Step."
            : finished
              ? "That's every line — Restart to watch it again."
              : "What do you think the next line changes?"}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={restart}
            disabled={!started}
            className="rounded-md border border-border px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            ↺ Restart
          </button>
          <button
            type="button"
            onClick={back}
            disabled={!started}
            className="rounded-md border border-border px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="rounded-md border border-primary/50 bg-primary/10 px-2 py-1 font-mono text-xs text-primary transition-colors hover:bg-primary/20"
          >
            {playing ? "⏸ Pause" : "▶ Play"}
          </button>
          <button
            type="button"
            onClick={toggleLine}
            disabled={finished}
            className="rounded-md bg-primary px-2.5 py-1 font-mono text-xs text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            Step →
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <pre className="overflow-x-auto rounded-md border border-border bg-background/60 p-3 text-xs leading-relaxed">
          <code>
            {lines.map((line, i) => (
              <div
                key={i}
                className={`px-1.5 -mx-1.5 rounded ${
                  i + 1 === currentLine ? "bg-primary/20" : ""
                }`}
              >
                {line || " "}
              </div>
            ))}
          </code>
        </pre>

        <div className="rounded-md border border-border bg-background/60 p-3">
          <p className="font-mono text-[0.65rem] tracking-wide text-muted-foreground uppercase">
            Variables
          </p>
          {!started ? (
            <p className="mt-2 text-xs text-muted-foreground">Nothing has run yet.</p>
          ) : Object.keys(currentVars).length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">No variables stored yet.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {Object.entries(currentVars).map(([name, v]) => {
                const changed = previousVars[name]?.value !== v.value;
                return (
                  <li
                    key={name}
                    className={`flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-xs transition-colors ${
                      changed
                        ? "border-primary/50 bg-primary/10"
                        : "border-border bg-transparent"
                    }`}
                  >
                    <span className="font-mono font-medium">{name}</span>
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="truncate font-mono text-foreground">{v.value}</span>
                      <span className="font-mono text-[0.65rem] text-muted-foreground">
                        {v.type}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <p className="mt-2 font-mono text-[0.65rem] text-muted-foreground">
        {started ? `Line ${currentLine} · step ${index + 1} of ${steps.length}` : "Not started"}
      </p>
    </div>
  );
}
