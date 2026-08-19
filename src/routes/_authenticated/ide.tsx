import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import CodeMirror from "@uiw/react-codemirror";
import type { EditorView } from "@codemirror/view";
import { Button } from "@/components/ui/button";
import { checkSyntax, getPyodide, runOnce } from "@/lib/python-runner";
import { highlightErrorLine, pythonEditorExtensions } from "@/lib/python-lint";

export const Route = createFileRoute("/_authenticated/ide")({
  head: () => ({
    meta: [
      { title: "IDE — H-Code" },
      { name: "description", content: "A free-form Python sandbox — write and run any program." },
      { property: "og:title", content: "IDE — H-Code" },
      {
        property: "og:description",
        content: "A free-form Python sandbox — write and run any program.",
      },
    ],
  }),
  component: Ide,
});

const STORAGE_KEY = "hcode-ide-code";
const STDIN_STORAGE_KEY = "hcode-ide-stdin";
const DEFAULT_CODE = 'print("Hello, world!")\n';

function loadStored(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function Ide() {
  const [code, setCode] = useState(() => loadStored(STORAGE_KEY, DEFAULT_CODE));
  const [stdin, setStdin] = useState(() => loadStored(STDIN_STORAGE_KEY, ""));
  const [output, setOutput] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [syntaxError, setSyntaxError] = useState<{ line: number; message: string } | null>(null);
  const [running, setRunning] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const editorViewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    void getPyodide()
      .then(() => setEngineReady(true))
      .catch(() => toast.error("Could not start the Python engine"));
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // storage unavailable (private browsing etc.) - not worth surfacing
    }
  }, [code]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STDIN_STORAGE_KEY, stdin);
    } catch {
      // storage unavailable - not worth surfacing
    }
  }, [stdin]);

  const run = async () => {
    setRunning(true);
    try {
      const syntaxIssue = await checkSyntax(code);
      setSyntaxError(syntaxIssue);
      if (editorViewRef.current) {
        highlightErrorLine(editorViewRef.current, syntaxIssue?.line ?? null);
      }

      const result = await runOnce(code, stdin);
      setOutput(result.output);
      setRunError(result.error ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Run failed");
    } finally {
      setRunning(false);
    }
  };

  const reset = () => {
    setCode(DEFAULT_CODE);
    setStdin("");
    setOutput(null);
    setRunError(null);
    setSyntaxError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">IDE</h1>
        <p className="mt-1 text-muted-foreground">
          A free-form Python sandbox — write and run anything, no challenge attached.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <div className="panel p-5">
            <h2 className="font-semibold">Input</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              If your program calls <code className="font-mono">input()</code>, add each value on
              its own line here before running — they're fed in one by one, in order.
            </p>
            <textarea
              className="code mt-3 h-28 w-full resize-y rounded-xl border border-border bg-card p-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              value={stdin}
              spellCheck={false}
              onChange={(e) => setStdin(e.target.value)}
              placeholder={"e.g.\n5\nAda"}
            />
          </div>

          <div className="panel p-5">
            <h2 className="font-semibold">Console</h2>
            {output == null && runError == null ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Output from your program will appear here after you run it.
              </p>
            ) : (
              <div className="mt-3 space-y-2 font-mono text-sm">
                {output ? <pre className="whitespace-pre-wrap">{output}</pre> : null}
                {runError ? <pre className="whitespace-pre-wrap text-destructive">{runError}</pre> : null}
                {!output && !runError ? (
                  <p className="text-muted-foreground">(no output)</p>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-border">
            <CodeMirror
              value={code}
              height="26rem"
              theme="dark"
              extensions={pythonEditorExtensions}
              onChange={(value) => {
                setCode(value);
                setSyntaxError(null);
              }}
              onCreateEditor={(view) => {
                editorViewRef.current = view;
              }}
              placeholder="# write your Python here"
              basicSetup={{ tabSize: 4 }}
            />
          </div>
          {syntaxError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 font-mono text-sm text-destructive">
              Line {syntaxError.line}: {syntaxError.message}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button onClick={run} disabled={running || !engineReady}>
              {!engineReady ? "Starting Python…" : running ? "Running…" : "Run"}
            </Button>
            <Button variant="secondary" onClick={reset}>
              Reset
            </Button>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            Python runs entirely in your browser — nothing is executed on the server. Your code is
            saved locally as you go.
          </p>
        </div>
      </div>
    </div>
  );
}
