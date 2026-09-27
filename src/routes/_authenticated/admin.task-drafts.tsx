import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { sb } from "@/lib/assessments-db";
import { runOnce } from "@/lib/python-runner";
import { GCSE_TOPICS, ALEVEL_TOPICS, type TrackKey } from "@/lib/game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/task-drafts")({
  head: () => ({
    meta: [
      { title: "Task drafts — H-Code" },
      {
        name: "description",
        content: "Draft, test and hand off new practice tasks - nothing here reaches a student on its own.",
      },
    ],
  }),
  component: TaskDrafts,
});

type Test = { stdin: string; expect: string };

type Draft = {
  id: string;
  created_by: string;
  track: TrackKey;
  topic: string;
  title: string;
  tier: number;
  difficulty: number;
  xp: number;
  stretch: boolean;
  brief: string;
  starter: string;
  hints: string[];
  tests: Test[];
  status: "draft" | "ready" | "applied";
  created_at: string;
  updated_at: string;
};

type FormState = Omit<Draft, "id" | "created_by" | "status" | "created_at" | "updated_at">;

const BLANK: FormState = {
  track: "gcse",
  topic: "selection",
  title: "",
  tier: 2,
  difficulty: 2,
  xp: 15,
  stretch: false,
  brief: "",
  starter: "",
  hints: ["", ""],
  tests: [],
};

const TIER_LABEL = ["Direct instruction", "Short context", "Scenario wording", "Exam-style"];

function topicsFor(track: TrackKey) {
  return track === "alevel" ? ALEVEL_TOPICS : GCSE_TOPICS;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function TaskDrafts() {
  const { user, isTeacher } = useAuth();
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);
  const [solution, setSolution] = useState("");
  const [stdinDraft, setStdinDraft] = useState("");
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [topicFilter, setTopicFilter] = useState<string>("all");

  const { data: drafts } = useQuery({
    queryKey: ["content-drafts"],
    enabled: isTeacher,
    queryFn: async (): Promise<Draft[]> => {
      const { data, error } = await sb
        .from("content_drafts")
        .select("*")
        .order("status", { ascending: true })
        .order("updated_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Draft[];
    },
  });

  const filtered = useMemo(
    () => (drafts ?? []).filter((d) => topicFilter === "all" || d.topic === topicFilter),
    [drafts, topicFilter],
  );
  const readyDrafts = filtered.filter((d) => d.status !== "applied");

  const openNew = () => {
    setForm(BLANK);
    setSolution("");
    setStdinDraft("");
    setOpenId("new");
  };
  const openExisting = (d: Draft) => {
    setForm({
      track: d.track,
      topic: d.topic,
      title: d.title,
      tier: d.tier,
      difficulty: d.difficulty,
      xp: d.xp,
      stretch: d.stretch,
      brief: d.brief,
      starter: d.starter,
      hints: d.hints.length ? d.hints : ["", ""],
      tests: d.tests,
    });
    setSolution("");
    setStdinDraft("");
    setOpenId(d.id);
  };

  const runAll = async () => {
    if (!solution.trim()) {
      toast.error("Paste a reference solution first.");
      return;
    }
    const inputs = stdinDraft.split("\n---\n").map((s) => s.replace(/\n$/, ""));
    if (inputs.length === 0 || (inputs.length === 1 && inputs[0] === "")) {
      toast.error("Add at least one test input below (--- on its own line separates cases).");
      return;
    }
    setRunning(true);
    try {
      const results: Test[] = [];
      for (const stdin of inputs) {
        const { output, error } = await runOnce(solution, stdin);
        if (error) {
          toast.error(`Solution errored on input ${JSON.stringify(stdin)}: ${error}`);
          setRunning(false);
          return;
        }
        results.push({ stdin, expect: output });
      }
      setForm((f) => ({ ...f, tests: [...f.tests, ...results] }));
      toast.success(`Ran ${results.length} case${results.length === 1 ? "" : "s"} - review the outputs below before saving.`);
    } finally {
      setRunning(false);
    }
  };

  const removeTest = (i: number) => setForm((f) => ({ ...f, tests: f.tests.filter((_, j) => j !== i) }));
  const updateHint = (i: number, value: string) =>
    setForm((f) => ({ ...f, hints: f.hints.map((h, j) => (j === i ? value : h)) }));
  const addHint = () => setForm((f) => ({ ...f, hints: [...f.hints, ""] }));
  const removeHint = (i: number) => setForm((f) => ({ ...f, hints: f.hints.filter((_, j) => j !== i) }));

  const validate = (): string | null => {
    if (!form.title.trim()) return "Give it a title.";
    if (!form.brief.trim()) return "Write the brief.";
    if (form.tests.length < 3) return "Add at least 3 test cases (run the solution above, or add them by hand).";
    return null;
  };

  const save = async (status: Draft["status"]) => {
    if (status !== "draft") {
      const problem = validate();
      if (problem) {
        toast.error(problem);
        return;
      }
    }
    setSaving(true);
    try {
      const hints = form.hints.map((h) => h.trim()).filter(Boolean);
      const row = { ...form, hints, status, created_by: user!.id };
      if (openId === "new") {
        const { error } = await sb.from("content_drafts").insert(row);
        if (error) throw new Error(error.message);
      } else if (openId) {
        const { error } = await sb.from("content_drafts").update(row).eq("id", openId);
        if (error) throw new Error(error.message);
      }
      toast.success(status === "ready" ? "Marked ready to hand off." : "Draft saved.");
      void qc.invalidateQueries({ queryKey: ["content-drafts"] });
      setOpenId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await sb.from("content_drafts").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void qc.invalidateQueries({ queryKey: ["content-drafts"] });
    if (openId === id) setOpenId(null);
  };

  const markApplied = async (id: string) => {
    const { error } = await sb.from("content_drafts").update({ status: "applied" }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void qc.invalidateQueries({ queryKey: ["content-drafts"] });
  };

  const copyForHandoff = async (d: Draft) => {
    const payload = {
      topic: d.topic,
      track: d.track,
      title: d.title,
      tier: d.tier,
      difficulty: d.difficulty,
      xp: d.xp,
      ...(d.stretch ? { stretch: true } : {}),
      brief: d.brief,
      starter: d.starter,
      hints: d.hints,
      tests: d.tests,
    };
    const text = `// Draft task for ${d.topic} (${d.track}) - add to the practice pool.\n${JSON.stringify(payload, null, 2)}`;
    const ok = await copyToClipboard(text);
    toast[ok ? "success" : "error"](ok ? "Copied - paste it to Claude Code." : "Couldn't copy - select and copy the text yourself.");
  };

  if (!isTeacher) {
    return <p className="text-muted-foreground">This area is for teachers.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Task drafts</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Write a task, prove its test cases against a real solution in the same Python runner
          students use, then hand it off. Nothing here reaches a student by itself - a draft only
          becomes a real task once Claude Code (or you, editing the JSON by hand) adds it to the
          content files and commits.
        </p>
      </div>

      {openId ? (
        <DraftEditor
          form={form}
          setForm={setForm}
          solution={solution}
          setSolution={setSolution}
          stdinDraft={stdinDraft}
          setStdinDraft={setStdinDraft}
          running={running}
          saving={saving}
          isNew={openId === "new"}
          onRun={runAll}
          onRemoveTest={removeTest}
          onUpdateHint={updateHint}
          onAddHint={addHint}
          onRemoveHint={removeHint}
          onCancel={() => setOpenId(null)}
          onSaveDraft={() => save("draft")}
          onSaveReady={() => save("ready")}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <select
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
            >
              <option value="all">All topics</option>
              {[...GCSE_TOPICS, ...ALEVEL_TOPICS].map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
            <Button onClick={openNew}>+ New draft</Button>
          </div>

          <div className="panel divide-y divide-border">
            {readyDrafts.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                No drafts yet. Start with "+ New draft" above.
              </p>
            ) : (
              readyDrafts.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center gap-3 p-4">
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-xs ${
                      d.status === "ready"
                        ? "bg-success/15 text-success"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {d.status === "ready" ? "Ready" : "Draft"}
                  </span>
                  <span className="flex-1 font-medium">{d.title || "(untitled)"}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {d.topic} · T{d.tier} · ★{d.difficulty} · {d.tests.length} tests
                  </span>
                  {d.status === "ready" ? (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => copyForHandoff(d)}>
                        Copy for Claude Code
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => markApplied(d.id)}>
                        Mark applied
                      </Button>
                    </>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => openExisting(d)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(d.id)}>
                    Delete
                  </Button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DraftEditor({
  form,
  setForm,
  solution,
  setSolution,
  stdinDraft,
  setStdinDraft,
  running,
  saving,
  isNew,
  onRun,
  onRemoveTest,
  onUpdateHint,
  onAddHint,
  onRemoveHint,
  onCancel,
  onSaveDraft,
  onSaveReady,
}: {
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  solution: string;
  setSolution: (v: string) => void;
  stdinDraft: string;
  setStdinDraft: (v: string) => void;
  running: boolean;
  saving: boolean;
  isNew: boolean;
  onRun: () => void;
  onRemoveTest: (i: number) => void;
  onUpdateHint: (i: number, v: string) => void;
  onAddHint: () => void;
  onRemoveHint: (i: number) => void;
  onCancel: () => void;
  onSaveDraft: () => void;
  onSaveReady: () => void;
}) {
  return (
    <div className="panel space-y-5 p-5">
      <h2 className="text-lg font-semibold">{isNew ? "New draft" : "Edit draft"}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Track</label>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            value={form.track}
            onChange={(e) => {
              const track = e.target.value as TrackKey;
              const first = topicsFor(track)[0]!.key;
              setForm((f) => ({ ...f, track, topic: first }));
            }}
          >
            <option value="gcse">GCSE</option>
            <option value="alevel">A level</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Topic</label>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            value={form.topic}
            onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
          >
            {topicsFor(form.track).map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
        <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Wording tier</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                title={TIER_LABEL[n - 1]}
                onClick={() => setForm((f) => ({ ...f, tier: n }))}
                className={`flex-1 rounded-md border px-2 py-1.5 font-mono text-xs ${
                  form.tier === n
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Difficulty</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setForm((f) => ({ ...f, difficulty: n }))}
                className={`flex-1 rounded-md border px-2 py-1.5 text-xs ${
                  form.difficulty === n
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">XP</label>
          <Input
            type="number"
            min={5}
            value={form.xp}
            onChange={(e) => setForm((f) => ({ ...f, xp: Number(e.target.value) || 0 }))}
          />
        </div>
        <div className="flex items-end pb-1.5">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={form.stretch}
              onChange={(e) => setForm((f) => ({ ...f, stretch: e.target.checked }))}
            />
            Stretch task (🌟)
          </label>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Brief - what the student reads
        </label>
        <textarea
          className="w-full rounded-md border border-border bg-background p-3 text-sm"
          rows={5}
          value={form.brief}
          onChange={(e) => setForm((f) => ({ ...f, brief: e.target.value }))}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Starter code (usually left empty)
        </label>
        <textarea
          className="w-full rounded-md border border-border bg-background p-3 font-mono text-sm"
          rows={2}
          value={form.starter}
          onChange={(e) => setForm((f) => ({ ...f, starter: e.target.value }))}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Hints</label>
        <div className="space-y-2">
          {form.hints.map((h, i) => (
            <div key={i} className="flex gap-2">
              <span className="pt-2 font-mono text-xs text-muted-foreground">{i + 1}.</span>
              <Input value={h} onChange={(e) => onUpdateHint(i, e.target.value)} />
              <Button size="sm" variant="ghost" onClick={() => onRemoveHint(i)}>
                ✕
              </Button>
            </div>
          ))}
          <Button size="sm" variant="ghost" onClick={onAddHint}>
            + Add hint
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-dashed border-border p-4">
        <h3 className="text-sm font-semibold">Test it</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Paste a reference solution and some test inputs (one per line - separate cases with a line
          that just says <code className="font-mono">---</code>). "Run" plays each input through the
          same Pyodide runner students get, and captures the real output as the expected answer. This
          solution is only used here; it isn't saved with the draft.
        </p>
        <textarea
          className="mb-2 w-full rounded-md border border-border bg-background p-3 font-mono text-sm"
          rows={5}
          placeholder="age = int(input())&#10;print(...)"
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
        />
        <textarea
          className="mb-2 w-full rounded-md border border-border bg-background p-3 font-mono text-sm"
          rows={4}
          placeholder={"17\n---\n5\n---\n90"}
          value={stdinDraft}
          onChange={(e) => setStdinDraft(e.target.value)}
        />
        <Button size="sm" onClick={onRun} disabled={running}>
          {running ? "Running…" : "Run in Pyodide"}
        </Button>

        {form.tests.length > 0 ? (
          <table className="mt-4 w-full text-left text-xs">
            <thead className="text-muted-foreground">
              <tr>
                <th className="pb-1 pr-2 font-medium">stdin</th>
                <th className="pb-1 pr-2 font-medium">expected output</th>
                <th className="pb-1"></th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {form.tests.map((t, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="py-1 pr-2 align-top">{JSON.stringify(t.stdin)}</td>
                  <td className="py-1 pr-2 align-top">{JSON.stringify(t.expect)}</td>
                  <td className="py-1">
                    <button
                      type="button"
                      onClick={() => onRemoveTest(i)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">No test cases yet - run the solution above.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={onSaveReady} disabled={saving}>
          Mark ready to hand off
        </Button>
        <Button variant="secondary" onClick={onSaveDraft} disabled={saving}>
          Save as draft
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
