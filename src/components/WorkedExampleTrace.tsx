import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { traceWorkedExample } from "@/lib/trace-runner";

const STEP_DELAY_MS = 1300;
const LOOP_PAUSE_MS = 1800;
const TYPE_MS_PER_CHAR = 18;

/**
 * A step-through visualisation of a lesson's worked example: real code,
 * really executed (via Pyodide), one line at a time, next to a console
 * that fills in as the program actually runs - the same console the
 * practice IDE uses (play.$slug.tsx), so it looks like something students
 * already recognise rather than a new abstraction to learn. Started as a
 * variables table; swapped to this after piloting, since a concrete
 * "what does it print" view reads as more approachable than an abstract
 * variable-state table for a first pass at this lesson.
 *
 * Manual stepping stays the default over autoplay - PRIMM-style research
 * (Sentance & Waite) on tracing before writing code favours the student
 * predicting each line before seeing the answer, not just watching it run.
 */
export function WorkedExampleTrace({
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

  const targetConsole = index === -1 ? "" : (steps[index]?.console ?? "");
  const [displayed, setDisplayed] = useState("");
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setIndex(-1);
    setPlaying(false);
    setDisplayed("");
  }, [source, demoInput]);

  // Types out only the newly-revealed tail when stepping forward; jumps
  // straight there on Back/Restart, since un-typing text reads as a glitch
  // rather than a rewind.
  useEffect(() => {
    if (typingRef.current) clearInterval(typingRef.current);
    if (displayed === targetConsole) return;
    // Anything that isn't a straightforward "type on the new tail" - going
    // back, restarting, or jumping - snaps instantly instead of animating.
    if (!targetConsole.startsWith(displayed)) {
      setDisplayed(targetConsole);
      return;
    }
    typingRef.current = setInterval(() => {
      setDisplayed((d) => {
        if (d.length >= targetConsole.length) {
          if (typingRef.current) clearInterval(typingRef.current);
          return d;
        }
        return targetConsole.slice(0, d.length + 1);
      });
    }, TYPE_MS_PER_CHAR);
    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetConsole]);

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
              : "What do you think this line will print or ask for?"}
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

      <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
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
          <p className="text-sm font-semibold">Console</p>
          <div className="mt-2 font-mono text-xs">
            {displayed ? (
              <pre className="whitespace-pre-wrap">
                {displayed}
                <span className="animate-pulse text-primary">▍</span>
              </pre>
            ) : (
              <p className="text-muted-foreground">Nothing has run yet.</p>
            )}
          </div>
        </div>
      </div>

      <p className="mt-2 font-mono text-[0.65rem] text-muted-foreground">
        {started ? `Line ${currentLine} · step ${index + 1} of ${steps.length}` : "Not started"}
      </p>
    </div>
  );
}
