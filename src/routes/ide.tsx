import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import CodeMirror from "@uiw/react-codemirror";
import type { EditorView } from "@codemirror/view";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkSyntax, getPyodide, runInteractive } from "@/lib/python-runner";
import { highlightErrorLine, pythonEditorExtensions } from "@/lib/python-lint";

export const Route = createFileRoute("/ide")({
  ssr: false,
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
  component: () => (
    <AppShell>
      <Ide />
    </AppShell>
  ),
});

const DRAFT_KEY = "hcode-ide-draft";
const DEFAULT_CODE = 'print("Hello, world!")\n';

function loadDraft() {
  if (typeof window === "undefined") return DEFAULT_CODE;
  try {
    return window.localStorage.getItem(DRAFT_KEY) ?? DEFAULT_CODE;
  } catch {
    return DEFAULT_CODE;
  }
}

function Ide() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [code, setCode] = useState(loadDraft);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [currentName, setCurrentName] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [syntaxError, setSyntaxError] = useState<{ line: number; message: string } | null>(null);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState("");
  const editorViewRef = useRef<EditorView | null>(null);
  const inputFieldRef = useRef<HTMLInputElement | null>(null);

  const { data: programs } = useQuery({
    queryKey: ["ide-programs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("ide_programs")
        .select("id, name, updated_at")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    void getPyodide()
      .then(() => setEngineReady(true))
      .catch(() => toast.error("Could not start the Python engine"));
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_KEY, code);
    } catch {
      // storage unavailable (private browsing etc.) - not worth surfacing
    }
  }, [code]);

  const execute = async (nextAnswers: string[]) => {
    setRunning(true);
    try {
      const result = await runInteractive(code, nextAnswers);
      setOutput(result.output);
      setRunError(result.error ?? null);
      setWaitingForInput(result.waiting);
      if (result.waiting) {
        setPendingAnswer("");
        requestAnimationFrame(() => inputFieldRef.current?.focus());
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Run failed");
    } finally {
      setRunning(false);
    }
  };

  const run = async () => {
    const syntaxIssue = await checkSyntax(code);
    setSyntaxError(syntaxIssue);
    if (editorViewRef.current) {
      highlightErrorLine(editorViewRef.current, syntaxIssue?.line ?? null);
    }
    setAnswers([]);
    await execute([]);
  };

  const submitAnswer = async () => {
    const next = [...answers, pendingAnswer];
    setAnswers(next);
    await execute(next);
  };

  const reset = () => {
    setCode(DEFAULT_CODE);
    setCurrentId(null);
    setCurrentName("");
    setOutput(null);
    setRunError(null);
    setSyntaxError(null);
    setAnswers([]);
    setWaitingForInput(false);
    setPendingAnswer("");
  };

  const loadProgram = async (id: string) => {
    const { data } = await supabase
      .from("ide_programs")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!data) return;
    setCode(data.code);
    setCurrentId(data.id);
    setCurrentName(data.name);
    setOutput(null);
    setRunError(null);
    setSyntaxError(null);
    setAnswers([]);
    setWaitingForInput(false);
    setPendingAnswer("");
  };

  const saveProgram = async () => {
    if (!user) return;
    const name = currentName.trim();
    if (!name) {
      toast.error("Give your program a name first");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("ide_programs")
      .upsert({ user_id: user.id, name, code }, { onConflict: "user_id,name" })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCurrentId(data.id);
    toast.success("Saved");
    void qc.invalidateQueries({ queryKey: ["ide-programs", user.id] });
  };

  const deleteProgram = async (id: string) => {
    if (!user) return;
    await supabase.from("ide_programs").delete().eq("id", id);
    if (id === currentId) {
      setCurrentId(null);
      setCurrentName("");
    }
    void qc.invalidateQueries({ queryKey: ["ide-programs", user.id] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">IDE</h1>
        <p className="mt-1 text-muted-foreground">
          A free-form Python sandbox — write and run anything, no challenge attached.
        </p>
      </div>

      {user ? (
        <div className="panel flex flex-wrap items-center gap-2 p-4">
          <select
            className="rounded-md border border-border bg-card px-3 py-2 text-sm"
            value={currentId ?? ""}
            onChange={(e) => {
              if (e.target.value) void loadProgram(e.target.value);
            }}
          >
            <option value="">My programs…</option>
            {(programs ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Input
            className="max-w-[12rem]"
            placeholder="Program name"
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
          />
          <Button size="sm" onClick={saveProgram} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button size="sm" variant="secondary" onClick={reset}>
            New
          </Button>
          {currentId ? (
            <Button size="sm" variant="ghost" onClick={() => void deleteProgram(currentId)}>
              Delete
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-muted-foreground">
            You're not logged in — your code runs fine, but it won't be saved anywhere. Log in to
            save and come back to your programs later.
          </p>
          <Button asChild size="sm">
            <Link to="/auth">Log in</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
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
                setWaitingForInput(false);
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
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            Python runs entirely in your browser — nothing is executed on the server.
          </p>
        </div>

        <div className="panel p-5">
          <h2 className="font-semibold">Console</h2>
          {output == null && runError == null && !waitingForInput ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Output from your program will appear here after you run it. If it calls{" "}
              <code className="font-mono">input()</code>, you'll be prompted right here.
            </p>
          ) : (
            <div className="mt-3 space-y-1 font-mono text-sm">
              {output ? <pre className="whitespace-pre-wrap">{output}</pre> : null}
              {waitingForInput ? (
                <div className="flex items-center gap-1">
                  <span className="text-primary">›</span>
                  <input
                    ref={inputFieldRef}
                    className="flex-1 border-none bg-transparent font-mono text-sm text-foreground outline-none"
                    value={pendingAnswer}
                    onChange={(e) => setPendingAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void submitAnswer();
                    }}
                    autoFocus
                  />
                </div>
              ) : null}
              {runError ? <pre className="whitespace-pre-wrap text-destructive">{runError}</pre> : null}
              {!output && !runError && !waitingForInput ? (
                <p className="text-muted-foreground">(no output)</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
