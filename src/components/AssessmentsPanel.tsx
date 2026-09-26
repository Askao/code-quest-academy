import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuestionText } from "@/components/QuestionText";
import { topicLabel, topicsFor, type Board } from "@/lib/game";
import {
  ABILITY_LABEL,
  attemptStatus,
  buildPaper,
  DIFFICULTY_LABEL,
  replaceQuestion,
  suggestedMinutes,
  type BankQuestionMeta,
  type Difficulty,
} from "@/lib/assessments";
import {
  fetchBankMeta,
  fetchQuestions,
  sb,
  type AssessmentRow,
  type AttemptRow,
  type BoardKey,
} from "@/lib/assessments-db";
import { useAuth } from "@/hooks/useAuth";
import { teacherAssessmentArchiveReason } from "@/lib/archive";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

/** A <input type="datetime-local"> value -> ISO string (or null when empty). */
const localToIso = (v: string) => (v ? new Date(v).toISOString() : null);

export function AssessmentsPanel({
  classId,
  classBoard,
  studentCount,
}: {
  classId: string;
  classBoard: Board;
  studentCount: number;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [board, setBoard] = useState<BoardKey>(classBoard);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("mixed");
  const [count, setCount] = useState(8);
  const [minutes, setMinutes] = useState<number | "">("");
  const [minutesEdited, setMinutesEdited] = useState(false);
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [paper, setPaper] = useState<BankQuestionMeta[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const bankQuery = useQuery({
    queryKey: ["assessment-bank", board],
    staleTime: 5 * 60_000,
    queryFn: () => fetchBankMeta(board),
  });
  const bank = useMemo(() => bankQuery.data ?? [], [bankQuery.data]);

  // Only offer topics this board has questions for (and that the board teaches).
  const availableTopics = useMemo(() => {
    const per = new Map<string, number>();
    for (const q of bank) per.set(q.topic, (per.get(q.topic) ?? 0) + 1);
    return topicsFor("gcse", board)
      .filter((t) => per.has(t.key))
      .map((t) => ({ key: t.key as string, label: t.label as string, n: per.get(t.key) ?? 0 }));
  }, [bank, board]);

  const paperIds = (paper ?? []).map((q) => q.id);
  const { data: previews = [] } = useQuery({
    queryKey: ["assessment-preview", paperIds.join(",")],
    enabled: paperIds.length > 0,
    queryFn: () => fetchQuestions(paperIds),
  });
  const previewById = new Map(previews.map((q) => [q.id, q]));
  const totalMarks = (paper ?? []).reduce((s, q) => s + q.marks, 0);

  const setPaperAndTime = (next: BankQuestionMeta[] | null) => {
    setPaper(next);
    if (next && !minutesEdited) setMinutes(suggestedMinutes(next.reduce((s, q) => s + q.marks, 0)));
  };

  const build = () => {
    const poolSize = bank.filter((q) => topics.length === 0 || topics.includes(q.topic)).length;
    if (poolSize === 0) {
      toast.error("There are no questions for those topics yet.");
      return;
    }
    const next = buildPaper({ bank, topics, count, difficulty });
    if (next.length < count) {
      toast.info(
        `Only ${next.length} question${next.length === 1 ? "" : "s"} exist for those topics so far.`,
      );
    }
    setPaperAndTime(next);
  };

  const swap = (index: number) => {
    if (!paper) return;
    const next = replaceQuestion({ bank, topics, paper, index });
    if (!next) {
      toast.info("There isn't another question available to swap in.");
      return;
    }
    setPaperAndTime(next);
  };

  const remove = (index: number) => {
    if (!paper) return;
    setPaperAndTime(paper.filter((_, i) => i !== index));
  };

  const setAssessment = async () => {
    if (!user) return;
    if (!title.trim()) return void toast.error("Give the assessment a title");
    if (!paper || paper.length === 0) return void toast.error("Build a paper first");
    if (minutes === "" || minutes < 5 || minutes > 240)
      return void toast.error("Set a time limit between 5 and 240 minutes");
    if (opensAt && closesAt && new Date(closesAt) <= new Date(opensAt)) {
      return void toast.error("It must close after it opens");
    }
    if (studentCount === 0) return void toast.error("No students in this class yet");
    setSaving(true);
    const { data: created, error } = await sb
      .from("assessments")
      .insert({
        class_id: classId,
        title: title.trim(),
        instructions: instructions.trim(),
        board,
        topics,
        time_limit_minutes: minutes,
        question_count: paper.length,
        total_marks: totalMarks,
        opens_at: localToIso(opensAt),
        closes_at: localToIso(closesAt),
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error || !created) {
      setSaving(false);
      return void toast.error(error?.message ?? "Could not set the assessment");
    }
    const { error: itemsError } = await sb
      .from("assessment_items")
      .insert(
        paper.map((q, i) => ({ assessment_id: created.id, position: i + 1, question_id: q.id })),
      );
    if (itemsError) {
      await sb.from("assessments").delete().eq("id", created.id);
      setSaving(false);
      return void toast.error(itemsError.message);
    }
    setSaving(false);
    toast.success("Assessment set - students can see it on their dashboard");
    setTitle("");
    setInstructions("");
    setTopics([]);
    setPaper(null);
    setMinutes("");
    setMinutesEdited(false);
    setOpensAt("");
    setClosesAt("");
    void qc.invalidateQueries({ queryKey: ["class-assessments", classId] });
  };

  const { data: list, error: listError } = useQuery({
    queryKey: ["class-assessments", classId],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await sb
        .from("assessments")
        .select("*")
        .eq("class_id", classId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as AssessmentRow[];
      const attempts = rows.length
        ? await sb
            .from("assessment_attempts")
            .select("*")
            .in(
              "assessment_id",
              rows.map((r) => r.id),
            )
        : { data: [] };
      const byAssessment = new Map<string, AttemptRow[]>();
      for (const a of (attempts.data ?? []) as AttemptRow[]) {
        byAssessment.set(a.assessment_id, [...(byAssessment.get(a.assessment_id) ?? []), a]);
      }
      return rows.map((r) => ({ ...r, attempts: byAssessment.get(r.id) ?? [] }));
    },
  });

  const toggleRelease = async (a: AssessmentRow) => {
    const { error } = await sb
      .from("assessments")
      .update({ results_released: !a.results_released })
      .eq("id", a.id);
    if (error) return void toast.error(error.message);
    toast.success(a.results_released ? "Results hidden" : "Results released to students");
    void qc.invalidateQueries({ queryKey: ["class-assessments", classId] });
  };

  const del = async (a: AssessmentRow) => {
    const { error } = await sb.from("assessments").delete().eq("id", a.id);
    setConfirmDelete(null);
    if (error) return void toast.error(error.message);
    toast.success("Assessment deleted");
    void qc.invalidateQueries({ queryKey: ["class-assessments", classId] });
  };

  return (
    <div className="space-y-8">
      <section className="panel space-y-4 p-5">
        <div>
          <h2 className="text-xl font-semibold">Set an assessment</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A timed paper of exam-style questions. Nothing is marked automatically - you mark each
            answer against the mark scheme.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Title, e.g. Iteration & selection test"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div
            className="flex overflow-hidden rounded-md border border-border"
            role="group"
            aria-label="Exam board"
          >
            {(["ocr", "aqa"] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => {
                  setBoard(b);
                  setTopics([]);
                  setPaper(null);
                }}
                className={`flex-1 px-3 py-2 font-mono text-sm ${
                  board === b
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {b.toUpperCase()} style
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Topics</p>
          {bankQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading questions…</p>
          ) : null}
          {bankQuery.error ? (
            <p className="text-sm text-destructive">
              Couldn't load the question bank: {(bankQuery.error as Error).message}
            </p>
          ) : null}
          {!bankQuery.isLoading && !bankQuery.error && availableTopics.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              There are no {board.toUpperCase()} questions yet.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <label
                      className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-medium transition-colors ${
                        topics.length === 0
                          ? "border-primary/60 bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:bg-secondary/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={topics.length === 0}
                        onChange={() => {
                          setTopics([]);
                          setPaper(null);
                        }}
                      />
                      All topics
                    </label>
            {availableTopics.map((t) => {
              const checked = topics.includes(t.key);
              return (
                <label
                  key={t.key}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
                    checked ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={checked}
                    onChange={() => {
                      setTopics((prev) =>
                        checked ? prev.filter((k) => k !== t.key) : [...prev, t.key],
                      );
                      setPaper(null);
                    }}
                  />
                  {t.label}
                  <span className="font-mono text-xs text-muted-foreground">{t.n}</span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            "All topics" draws from every topic. Tick one or more topics to narrow it down.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Number of questions</span>
            <Input
              type="number"
              min={1}
              max={40}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(40, Number(e.target.value) || 1)))}
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-medium">Difficulty</span>
            <select
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABEL[d]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Button onClick={build} disabled={bankQuery.isLoading || bank.length === 0}>
          {paper ? "Build a different paper" : "Build paper"}
        </Button>

        {paper ? (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold">
                Paper preview · {paper.length} question{paper.length === 1 ? "" : "s"} ·{" "}
                {totalMarks} marks
              </h3>
              <p className="text-xs text-muted-foreground">
                Easiest first, like a real paper. Swap or remove anything you don't want.
              </p>
            </div>
            <ol className="space-y-2">
              {paper.map((q, i) => {
                const full = previewById.get(q.id);
                return (
                  <li key={q.id} className="rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-mono text-xs text-muted-foreground">
                        Q{i + 1} · {topicLabel(q.topic)} · {ABILITY_LABEL[q.ability]} · {q.marks}{" "}
                        mark{q.marks === 1 ? "" : "s"}
                      </p>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="secondary" onClick={() => swap(i)}>
                          Swap
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => remove(i)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-primary">
                        {full ? full.question.split("\n")[0]!.slice(0, 110) : "Loading question…"}
                        {full && full.question.split("\n")[0]!.length > 110 ? "…" : ""}
                      </summary>
                      {full ? <QuestionText text={full.question} className="mt-2 text-sm" /> : null}
                    </details>
                  </li>
                );
              })}
            </ol>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium">Time allowed (minutes)</span>
                <Input
                  type="number"
                  min={5}
                  max={240}
                  value={minutes}
                  onChange={(e) => {
                    setMinutesEdited(true);
                    setMinutes(e.target.value === "" ? "" : Number(e.target.value));
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  Suggested {suggestedMinutes(totalMarks)} for {totalMarks} marks.
                </span>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Opens (optional)</span>
                <Input
                  type="datetime-local"
                  value={opensAt}
                  onChange={(e) => setOpensAt(e.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Must be started by (optional)</span>
                <Input
                  type="datetime-local"
                  value={closesAt}
                  onChange={(e) => setClosesAt(e.target.value)}
                />
              </label>
            </div>
            <Input
              placeholder="Instructions for students (optional)"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Each student's clock starts when they press Start, and runs for the time above.
            </p>
            <Button onClick={setAssessment} disabled={saving || paper.length === 0}>
              {saving ? "Setting…" : "Set assessment"}
            </Button>
          </div>
        ) : null}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Assessments set</h2>
        {listError ? (
          <p className="text-sm text-destructive">
            Couldn't load assessments: {(listError as Error).message}
          </p>
        ) : null}
        {list && list.length === 0 ? (
          <p className="text-sm text-muted-foreground">None yet.</p>
        ) : null}
        <div className="space-y-3">
          {(() => {
            type Row = NonNullable<typeof list>[number];
            const statusesOf = (a: Row) =>
              a.attempts.map((t) =>
                attemptStatus(
                  { startedAt: t.started_at, submittedAt: t.submitted_at, markedAt: t.marked_at },
                  a.time_limit_minutes,
                ),
              );
            const renderAssessment = (a: Row) => {
              const statuses = statusesOf(a);
              const n = (s: string) => statuses.filter((x) => x === s).length;
              return (
                <div key={a.id} className="panel space-y-3 p-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{a.title}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {a.board.toUpperCase()} · {a.topics.map(topicLabel).join(", ") || "Mixed"} ·{" "}
                        {a.question_count} questions · {a.total_marks} marks ·{" "}
                        {a.time_limit_minutes} min
                      </p>
                      {a.opens_at || a.closes_at ? (
                        <p className="font-mono text-xs text-muted-foreground">
                          {a.opens_at ? `Opens ${fmt(a.opens_at)}` : ""}
                          {a.opens_at && a.closes_at ? " · " : ""}
                          {a.closes_at ? `Start by ${fmt(a.closes_at)}` : ""}
                        </p>
                      ) : null}
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {n("marked")} marked · {n("handed_in")} to mark · {n("writing")} writing ·{" "}
                      {Math.max(0, studentCount - a.attempts.length)} not started
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild size="sm">
                      <Link to="/mark/$assessmentId" params={{ assessmentId: a.id }}>
                        {n("handed_in") > 0 ? `Mark (${n("handed_in")} waiting)` : "Open marking"}
                      </Link>
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => void toggleRelease(a)}>
                      {a.results_released ? "Hide results" : "Release results"}
                    </Button>
                    {confirmDelete === a.id ? (
                      <>
                        <span className="text-xs text-destructive">
                          Deletes every student's answers and marks.
                        </span>
                        <Button size="sm" variant="destructive" onClick={() => void del(a)}>
                          Confirm delete
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setConfirmDelete(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(a.id)}>
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              );
            };
            // Moves to Archived once the marks have been released, or the
            // start window has closed with nothing left to mark. Still fully
            // openable - Mark, results and delete all work from there.
            const now = new Date();
            const isArchived = (a: Row) =>
              !!teacherAssessmentArchiveReason(
                {
                  resultsReleased: a.results_released,
                  closesAt: a.closes_at,
                  statuses: statusesOf(a),
                },
                now,
              );
            const all = list ?? [];
            const active = all.filter((a) => !isArchived(a));
            const archived = all.filter(isArchived);
            return (
              <>
                {active.map(renderAssessment)}
                {archived.length > 0 ? (
                  <details className="pt-2">
                    <summary className="cursor-pointer text-lg font-semibold select-none">
                      Archived{" "}
                      <span className="font-mono text-sm text-muted-foreground">
                        ({archived.length})
                      </span>
                    </summary>
                    <p className="mt-1 mb-3 text-sm text-muted-foreground">
                      Assessments whose results have been released, or that have closed with nothing
                      left to mark.
                    </p>
                    <div className="space-y-3">{archived.map(renderAssessment)}</div>
                  </details>
                ) : null}
              </>
            );
          })()}
        </div>
      </section>
    </div>
  );
}
