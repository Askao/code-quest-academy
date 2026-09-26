import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { QuestionText } from "@/components/QuestionText";
import { QuestionAnswer, type SaveState } from "@/components/QuestionAnswer";
import { formatClock } from "@/lib/assessments";
import { sb } from "@/lib/assessments-db";
import { topicLabel } from "@/lib/game";
import { ABILITY_LABEL } from "@/lib/assessments";
import { BAND_LABEL, analyseResults, percentOf } from "@/lib/results-analysis";
import {
  decisionsOf,
  markingProgress,
  paperScore,
  pointsPayload,
  scoreOf,
  toAnalysed,
  type OpenedPaper,
  type RevisionQuestion,
} from "@/lib/revision";
import { createPaper, openPaper } from "@/lib/revision-db";

export const Route = createFileRoute("/_authenticated/revise/$paperId")({
  head: () => ({
    meta: [
      { title: "Revision paper — H-Code" },
      { name: "description", content: "Sit and mark your own revision paper." },
    ],
  }),
  component: PaperPage,
});

function PaperPage() {
  const { paperId } = Route.useParams();
  const { user } = useAuth();
  const { data, error } = useQuery({
    queryKey: ["revision-paper", paperId],
    enabled: !!user,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: () => openPaper(paperId),
  });

  if (error) {
    return (
      <div className="panel space-y-3 p-6">
        <p className="text-muted-foreground">
          That paper doesn't exist, or it isn't yours ({(error as Error).message}).
        </p>
        <Button asChild>
          <Link to="/revise">Back to revision</Link>
        </Button>
      </div>
    );
  }
  if (!data) return <p className="text-muted-foreground">Loading your paper…</p>;
  return <PaperView key={paperId} initial={data.paper} offset={data.offset} />;
}

function PaperView({ initial, offset }: { initial: OpenedPaper; offset: number }) {
  const qc = useQueryClient();
  const [paper, setPaper] = useState(initial);

  const refreshLists = () => {
    void qc.invalidateQueries({ queryKey: ["revision-papers"] });
    void qc.invalidateQueries({ queryKey: ["revision-topics"] });
    void qc.invalidateQueries({ queryKey: ["dashboard-revision"] });
  };

  if (!paper.submitted_at) {
    return (
      <Sitting
        paper={paper}
        offset={offset}
        onHandedIn={async () => {
          // Reopen: the mark scheme comes back now the paper is in.
          const fresh = await openPaper(paper.id);
          setPaper(fresh.paper);
          refreshLists();
        }}
      />
    );
  }
  return <Marking paper={paper} onChange={setPaper} onMarked={refreshLists} />;
}

// ------------------------------------------------------------------ sitting

function Sitting({
  paper,
  offset,
  onHandedIn,
}: {
  paper: OpenedPaper;
  offset: number;
  onHandedIn: () => Promise<void>;
}) {
  const limitMs = paper.time_limit_minutes ? paper.time_limit_minutes * 60_000 : null;
  const deadline = limitMs ? Date.parse(paper.started_at) + limitMs : null;
  const serverNow = useCallback(() => Date.now() + offset, [offset]);
  const [now, setNow] = useState(serverNow());
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(paper.questions.map((q) => [q.question_id, q.answer])),
  );
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const dirty = useRef(new Set<string>());
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const latest = useRef(answers);
  latest.current = answers;
  const autoSubmitted = useRef(false);

  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setNow(serverNow()), 500);
    return () => clearInterval(id);
  }, [deadline, serverNow]);

  const saveOne = useCallback(
    async (qid: string) => {
      clearTimeout(timers.current[qid]);
      if (!dirty.current.has(qid)) return true;
      dirty.current.delete(qid);
      setSaveState((s) => ({ ...s, [qid]: "saving" }));
      const { error } = await sb.rpc("save_revision_answer", {
        _paper_id: paper.id,
        _question_id: qid,
        _answer: latest.current[qid] ?? "",
      });
      if (error) {
        dirty.current.add(qid);
        setSaveState((s) => ({ ...s, [qid]: "error" }));
        return false;
      }
      setSaveState((s) => ({ ...s, [qid]: dirty.current.has(qid) ? "saving" : "saved" }));
      return true;
    },
    [paper.id],
  );

  const hand = useCallback(
    async (auto: boolean) => {
      setSubmitting(true);
      const ok = (await Promise.all([...dirty.current].map(saveOne))).every(Boolean);
      if (!ok) {
        setSubmitting(false);
        toast.error("Some answers didn't save - check your connection and try again.");
        return;
      }
      const { error } = await sb.rpc("submit_revision_paper", { _paper_id: paper.id });
      if (error) {
        setSubmitting(false);
        toast.error(error.message);
        return;
      }
      if (auto) toast.info("Time's up - your paper has been handed in.");
      await onHandedIn();
      setSubmitting(false);
    },
    [paper.id, saveOne, onHandedIn],
  );

  const remaining = deadline ? deadline - now : null;
  useEffect(() => {
    if (remaining === null || remaining > 0 || autoSubmitted.current) return;
    autoSubmitted.current = true;
    void hand(true);
  }, [remaining, hand]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current.size > 0) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const change = (qid: string, value: string) => {
    setAnswers((a) => ({ ...a, [qid]: value }));
    dirty.current.add(qid);
    setSaveState((s) => ({ ...s, [qid]: "saving" }));
    clearTimeout(timers.current[qid]);
    timers.current[qid] = setTimeout(() => void saveOne(qid), 800);
  };

  const answered = paper.questions.filter((q) => (answers[q.question_id] ?? "").trim() !== "").length;
  const unanswered = paper.questions.length - answered;
  const low = remaining !== null && remaining <= 5 * 60_000;
  const critical = remaining !== null && remaining <= 60_000;

  return (
    <div className="space-y-6">
      <div className="sticky top-14 z-30 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{paper.title}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {answered}/{paper.questions.length} answered · {paper.total_marks} marks
            </p>
          </div>
          {remaining !== null ? (
            <div
              role="timer"
              aria-label="Time remaining"
              className={`rounded-lg border px-4 py-1.5 font-mono text-2xl font-semibold tabular-nums ${
                critical
                  ? "border-destructive/60 bg-destructive/10 text-destructive"
                  : low
                    ? "border-warning/60 bg-warning/10 text-warning"
                    : "border-border"
              }`}
            >
              {formatClock(remaining)}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        <Link to="/revise" className="font-mono text-xs text-muted-foreground hover:text-foreground">
          ← Revision (your answers are saved as you go)
        </Link>
        <div className="panel p-4 text-sm text-muted-foreground">
          Write your answers without notes, as you would in the exam. When you hand in, you'll see
          the mark scheme and mark it yourself.
          {paper.weak_count > 0
            ? ` ${paper.weak_count} question${paper.weak_count === 1 ? "" : "s"} here ${paper.weak_count === 1 ? "is" : "are"} ones you lost marks on before.`
            : ""}
        </div>

        {paper.questions.map((q, i) => (
          <section key={q.question_id} className="panel space-y-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">Question {i + 1}</h2>
              <span className="flex shrink-0 items-center gap-2">
                {q.was_weak ? (
                  <span className="rounded-full bg-warning/15 px-2.5 py-1 font-mono text-xs text-warning">
                    revisit
                  </span>
                ) : null}
                <span className="rounded-full bg-secondary px-3 py-1 font-mono text-xs">
                  {q.marks} mark{q.marks === 1 ? "" : "s"}
                </span>
              </span>
            </div>
            <QuestionAnswer
              index={i}
              question={q.question}
              answerFormat={q.answer_format}
              marks={q.marks}
              value={answers[q.question_id] ?? ""}
              state={saveState[q.question_id]}
              onChange={(v) => change(q.question_id, v)}
              onSave={() => void saveOne(q.question_id)}
            />
          </section>
        ))}

        <div className="panel space-y-3 p-6">
          {confirmSubmit ? (
            <>
              <p className="font-medium">Hand in and see the mark scheme?</p>
              <p className="text-sm text-muted-foreground">
                {unanswered > 0
                  ? `${unanswered} question${unanswered === 1 ? " is" : "s are"} still blank. `
                  : ""}
                You can't change your answers after handing in.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => void hand(false)} disabled={submitting}>
                  {submitting ? "Handing in…" : "Yes, hand in"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setConfirmSubmit(false)}
                  disabled={submitting}
                >
                  Keep working
                </Button>
              </div>
            </>
          ) : (
            <Button onClick={() => setConfirmSubmit(true)}>Hand in</Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ marking

function Marking({
  paper,
  onChange,
  onMarked,
}: {
  paper: OpenedPaper;
  onChange: (p: OpenedPaper) => void;
  onMarked: () => void;
}) {
  const progress = markingProgress(paper.questions);
  const score = paperScore(paper.questions);

  const updateQuestion = (qid: string, patch: Partial<RevisionQuestion>) => {
    const questions = paper.questions.map((q) => (q.question_id === qid ? { ...q, ...patch } : q));
    const done = questions.every((q) => q.marked);
    onChange({
      ...paper,
      questions,
      marked_at: done ? (paper.marked_at ?? new Date().toISOString()) : paper.marked_at,
    });
    if (done && !paper.marked_at) onMarked();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/revise" className="font-mono text-xs text-muted-foreground hover:text-foreground">
        ← Revision
      </Link>

      <div className="panel space-y-2 p-6">
        <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
          {paper.board.toUpperCase()} revision · {progress.done ? "marked" : "mark it yourself"}
        </p>
        <h1 className="text-2xl font-semibold">{paper.title}</h1>
        <p className="text-4xl font-semibold text-primary">
          {score.earned}
          <span className="text-2xl text-muted-foreground"> / {score.available}</span>
          <span className="ml-3 text-lg text-muted-foreground">{score.percent}%</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {progress.done
            ? "All questions marked. Your marks are saved."
            : `Marked ${progress.marked} of ${progress.total} questions - the total updates as you go.`}
        </p>
        {!progress.done ? (
          <p className="rounded-md border border-border bg-secondary/30 p-3 text-sm">
            <strong>Mark like an examiner.</strong> Say YES to a point only if your answer clearly
            makes it, using the "accept" notes. It's your revision - being generous only hides where
            the marks are going.
          </p>
        ) : null}
      </div>

      {progress.done ? <Summary paper={paper} /> : null}

      {paper.questions.map((q, i) => (
        <MarkQuestion
          key={q.question_id}
          paperId={paper.id}
          index={i}
          q={q}
          onMarked={(score, scheme) =>
            updateQuestion(q.question_id, { marked: true, marks_awarded: score, mark_scheme: scheme })
          }
        />
      ))}
    </div>
  );
}

function MarkQuestion({
  paperId,
  index,
  q,
  onMarked,
}: {
  paperId: string;
  index: number;
  q: RevisionQuestion;
  onMarked: (score: number, scheme: NonNullable<RevisionQuestion["mark_scheme"]>) => void;
}) {
  const scheme = q.mark_scheme ?? [];
  const [decisions, setDecisions] = useState<Record<number, boolean | null>>(() =>
    decisionsOf(scheme),
  );
  const [saving, setSaving] = useState(false);

  const save = async (next: Record<number, boolean | null>) => {
    setDecisions(next);
    setSaving(true);
    const { data, error } = await sb.rpc("mark_revision_question", {
      _paper_id: paperId,
      _question_id: q.question_id,
      _points: pointsPayload(scheme, next),
    });
    setSaving(false);
    if (error) {
      toast.error(`Couldn't save that: ${error.message}`);
      return;
    }
    onMarked(
      data as number,
      scheme.map((p) => ({ ...p, awarded: next[p.position] === true })),
    );
  };

  const decide = (position: number, awarded: boolean) => {
    // Every point counts as decided once the question is touched - an
    // untouched one is NO, so a marked question never has undecided points.
    const filled = Object.fromEntries(scheme.map((p) => [p.position, decisions[p.position] ?? false]));
    void save({ ...filled, [position]: awarded });
  };
  const noneOfThese = () => void save(Object.fromEntries(scheme.map((p) => [p.position, false])));

  const shown = q.marked ? scoreOf(scheme, decisions, q.marks) : null;

  return (
    <section className="panel space-y-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Question {index + 1}</h2>
          <p className="font-mono text-xs text-muted-foreground">
            {topicLabel(q.topic)} · {ABILITY_LABEL[q.ability]}
            {q.was_weak ? " · you lost marks on this before" : ""}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 font-mono text-xs ${
            shown === null
              ? "bg-secondary"
              : shown === q.marks
                ? "bg-success/15 text-success"
                : "bg-secondary"
          }`}
        >
          {shown === null ? `– / ${q.marks}` : `${shown} / ${q.marks}`}
        </span>
      </div>

      <QuestionText text={q.question} />

      <div>
        <p className="mb-1 font-mono text-xs text-muted-foreground uppercase">Your answer</p>
        <pre
          className={`rounded-md border border-border bg-secondary/30 p-3 text-sm whitespace-pre-wrap ${
            q.answer_format === "code" ? "font-mono" : ""
          } ${q.answer.trim() ? "" : "text-muted-foreground italic"}`}
        >
          {q.answer.trim() ? q.answer : "(no answer given)"}
        </pre>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs text-muted-foreground uppercase">
            Mark scheme - did your answer make each point?
          </p>
          <Button size="sm" variant="secondary" onClick={noneOfThese} disabled={saving}>
            None of these
          </Button>
        </div>
        <ul className="divide-y divide-border rounded-md border border-border">
          {scheme.map((p) => {
            const d = decisions[p.position];
            const touched = q.marked;
            return (
              <li key={p.position} className="flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{p.text}</p>
                  {p.guidance ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{p.guidance}</p>
                  ) : null}
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {p.marks} mark{p.marks === 1 ? "" : "s"}
                </span>
                <div className="flex gap-1.5" role="group" aria-label={`Did you make this point? ${p.text}`}>
                  <button
                    type="button"
                    disabled={saving}
                    aria-pressed={d === true}
                    onClick={() => decide(p.position, true)}
                    className={`w-16 rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-40 ${
                      d === true
                        ? "border-success bg-success text-background"
                        : "border-border hover:border-success/60 hover:bg-success/10"
                    }`}
                  >
                    YES
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    aria-pressed={touched && d !== true}
                    onClick={() => decide(p.position, false)}
                    className={`w-16 rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-40 ${
                      touched && d !== true
                        ? "border-destructive bg-destructive text-background"
                        : "border-border hover:border-destructive/60 hover:bg-destructive/10"
                    }`}
                  >
                    NO
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ summary

function Summary({ paper }: { paper: OpenedPaper }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const analysis = analyseResults([toAnalysed(paper)], 6);
  const [building, setBuilding] = useState(false);

  const fixMistakes = async () => {
    setBuilding(true);
    try {
      const made = await createPaper({
        board: paper.board,
        topics: paper.topics,
        count: 10,
        focus: "weak",
        title: `${paper.board.toUpperCase()} revision: fix my mistakes`,
        minutes: null,
      });
      void qc.invalidateQueries({ queryKey: ["revision-papers"] });
      void navigate({ to: "/revise/$paperId", params: { paperId: made.paper_id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't build that paper");
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="panel space-y-5 p-6">
      <h2 className="text-lg font-semibold">How it went</h2>
      {analysis.topics.length > 0 ? (
        <ul className="space-y-2">
          {analysis.topics.map((t) => (
            <li key={t.topic} className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0 truncate">{topicLabel(t.topic)}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <span
                  className={`block h-full ${
                    t.band === "strong"
                      ? "bg-success"
                      : t.band === "developing"
                        ? "bg-warning"
                        : "bg-destructive"
                  }`}
                  style={{ width: `${t.percent}%` }}
                />
              </span>
              <span className="w-28 shrink-0 text-right font-mono text-xs text-muted-foreground">
                {t.earned}/{t.available} · {BAND_LABEL[t.band]}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {analysis.revisit.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Where the marks went</p>
          <ul className="space-y-1.5 text-sm">
            {analysis.revisit.map((r) => (
              <li key={r.questionId} className="rounded-md border border-border p-2.5">
                <span className="font-mono text-xs text-destructive">−{r.lost}</span>{" "}
                <span className="text-muted-foreground">{topicLabel(r.topic)} · </span>
                {r.label}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-success">Full marks — nothing to revisit from this paper.</p>
      )}

      <div className="flex flex-wrap gap-2">
        {analysis.revisit.length > 0 ? (
          <Button onClick={() => void fixMistakes()} disabled={building}>
            {building ? "Building…" : "Build a paper from my mistakes"}
          </Button>
        ) : null}
        <Button asChild variant="secondary">
          <Link to="/revise">Back to revision</Link>
        </Button>
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        Overall {percentOf(paperScore(paper.questions).earned, paper.total_marks)}% · saved to your
        results.
      </p>
    </div>
  );
}
