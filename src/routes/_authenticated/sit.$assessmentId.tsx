import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { QuestionText } from "@/components/QuestionText";
import { formatClock, GRACE_MS } from "@/lib/assessments";
import { topicLabel } from "@/lib/game";
import {
  sb,
  type AssessmentRow,
  type AttemptRow,
  type Paper,
  type Result,
} from "@/lib/assessments-db";

export const Route = createFileRoute("/_authenticated/sit/$assessmentId")({
  head: () => ({
    meta: [
      { title: "Assessment — H-Code" },
      { name: "description", content: "A timed assessment set by your teacher." },
    ],
  }),
  component: SitPage,
});

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

function SitPage() {
  const { assessmentId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [starting, setStarting] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);

  const { data: assessment, isLoading } = useQuery({
    queryKey: ["assessment", assessmentId],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await sb
        .from("assessments")
        .select("*")
        .eq("id", assessmentId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as AssessmentRow | null;
    },
  });

  const { data: attempt } = useQuery({
    queryKey: ["my-attempt", assessmentId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await sb
        .from("assessment_attempts")
        .select("*")
        .eq("assessment_id", assessmentId)
        .eq("student_id", user!.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as AttemptRow | null;
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!assessment) {
    return (
      <div className="panel p-6">
        <p className="text-muted-foreground">
          That assessment doesn't exist, or it isn't for one of your classes.
        </p>
        <Button asChild className="mt-4">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  if (attempt) return <PaperView attemptId={attempt.id} assessment={assessment} />;

  const now = Date.now();
  const notOpen = assessment.opens_at ? now < new Date(assessment.opens_at).getTime() : false;
  const closed = assessment.closes_at ? now > new Date(assessment.closes_at).getTime() : false;

  const start = async () => {
    setStarting(true);
    const { error } = await sb.rpc("start_assessment", { _assessment_id: assessmentId });
    setStarting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["my-attempt", assessmentId, user?.id] });
    void qc.invalidateQueries({ queryKey: ["student-assessments"] });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/dashboard"
        className="font-mono text-xs text-muted-foreground hover:text-foreground"
      >
        ← Dashboard
      </Link>
      <div className="panel space-y-4 p-6">
        <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
          Assessment · {assessment.board.toUpperCase()} style
        </p>
        <h1 className="text-3xl font-semibold">{assessment.title}</h1>
        <p className="text-sm text-muted-foreground">
          {assessment.topics.map(topicLabel).join(", ") || "Mixed topics"}
        </p>
        {assessment.instructions ? <p>{assessment.instructions}</p> : null}

        <dl className="grid grid-cols-3 gap-3 text-center">
          {[
            ["Time", `${assessment.time_limit_minutes} min`],
            ["Questions", String(assessment.question_count)],
            ["Marks", String(assessment.total_marks)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border p-3">
              <dt className="font-mono text-xs text-muted-foreground uppercase">{k}</dt>
              <dd className="mt-1 text-xl font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>The clock starts when you press Start and can't be paused or restarted.</li>
          <li>Your answers save automatically as you type.</li>
          <li>If time runs out, your work is handed in for you.</li>
          <li>Your teacher marks your answers - nothing is marked by the computer.</li>
          <li>Write on your own: no notes, no looking things up, no asking for help.</li>
        </ul>

        {assessment.opens_at || assessment.closes_at ? (
          <p className="text-sm text-muted-foreground">
            {assessment.opens_at ? `Opens ${fmt(assessment.opens_at)}. ` : ""}
            {assessment.closes_at ? `Start it before ${fmt(assessment.closes_at)}.` : ""}
          </p>
        ) : null}

        {notOpen ? (
          <p className="text-sm font-medium text-warning">Not open yet.</p>
        ) : closed ? (
          <p className="text-sm font-medium text-destructive">This assessment has closed.</p>
        ) : confirmStart ? (
          <div className="space-y-3 rounded-lg border border-warning/40 bg-warning/5 p-4">
            <p className="text-sm font-medium">
              Ready? You'll have {assessment.time_limit_minutes} minutes from now.
            </p>
            <div className="flex gap-2">
              <Button onClick={start} disabled={starting}>
                {starting ? "Starting…" : "Yes, start the clock"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfirmStart(false)}
                disabled={starting}
              >
                Not yet
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setConfirmStart(true)}>Start assessment</Button>
        )}
      </div>
    </div>
  );
}

type SaveState = "saved" | "saving" | "error";

function PaperView({ attemptId, assessment }: { attemptId: string; assessment: AssessmentRow }) {
  const qc = useQueryClient();
  const { data: paper, error: paperError } = useQuery({
    queryKey: ["paper", attemptId],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await sb.rpc("assessment_paper", { _attempt_id: attemptId });
      if (error) throw new Error(error.message);
      // The countdown follows the server's clock, not the device's, so a
      // wrong laptop clock can't give a student more (or less) time.
      const offset = Date.parse((data as Paper).server_now) - Date.now();
      return { paper: data as Paper, offset };
    },
  });

  if (paperError)
    return <p className="text-destructive">Couldn't load the assessment: {paperError.message}</p>;
  if (!paper) return <p className="text-muted-foreground">Loading your paper…</p>;

  return (
    <Sitting
      key={attemptId}
      attemptId={attemptId}
      assessment={assessment}
      paper={paper.paper}
      offset={paper.offset}
      onHandedIn={() => {
        void qc.invalidateQueries({ queryKey: ["my-attempt", assessment.id] });
        void qc.invalidateQueries({ queryKey: ["student-assessments"] });
        void qc.invalidateQueries({ queryKey: ["paper", attemptId] });
      }}
    />
  );
}

function Sitting({
  attemptId,
  assessment,
  paper,
  offset,
  onHandedIn,
}: {
  attemptId: string;
  assessment: AssessmentRow;
  paper: Paper;
  offset: number;
  onHandedIn: () => void;
}) {
  const deadline = Date.parse(paper.deadline);
  const serverNow = useCallback(() => Date.now() + offset, [offset]);
  const [now, setNow] = useState(serverNow());
  const [handedIn, setHandedIn] = useState(
    !!paper.submitted_at || serverNow() > deadline + GRACE_MS,
  );
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(paper.questions.map((q) => [q.question_id, q.answer])),
  );
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // What's been changed since it was last saved, and the pending timers.
  const dirty = useRef(new Set<string>());
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const latest = useRef(answers);
  latest.current = answers;
  const autoSubmitted = useRef(false);

  useEffect(() => {
    if (handedIn) return;
    const id = setInterval(() => setNow(serverNow()), 250);
    return () => clearInterval(id);
  }, [handedIn, serverNow]);

  const saveOne = useCallback(
    async (qid: string) => {
      clearTimeout(timers.current[qid]);
      if (!dirty.current.has(qid)) return true;
      dirty.current.delete(qid);
      setSaveState((s) => ({ ...s, [qid]: "saving" }));
      const { error } = await sb.rpc("save_assessment_answer", {
        _attempt_id: attemptId,
        _question_id: qid,
        _answer: latest.current[qid] ?? "",
      });
      if (error) {
        dirty.current.add(qid);
        setSaveState((s) => ({ ...s, [qid]: "error" }));
        return false;
      }
      // Typed more while that was in flight? It'll be saved by its own timer.
      setSaveState((s) => ({ ...s, [qid]: dirty.current.has(qid) ? "saving" : "saved" }));
      return true;
    },
    [attemptId],
  );

  const flushAll = useCallback(async () => {
    const ids = [...dirty.current];
    const results = await Promise.all(ids.map(saveOne));
    return results.every(Boolean);
  }, [saveOne]);

  const hand = useCallback(
    async (auto: boolean) => {
      setSubmitting(true);
      await flushAll();
      const { error } = await sb.rpc("submit_assessment", { _attempt_id: attemptId });
      setSubmitting(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      setHandedIn(true);
      if (auto) toast.info("Time's up - your work has been handed in.");
      onHandedIn();
    },
    [attemptId, flushAll, onHandedIn],
  );

  const remaining = deadline - now;
  useEffect(() => {
    if (handedIn || remaining > 0 || autoSubmitted.current) return;
    autoSubmitted.current = true;
    void hand(true);
  }, [handedIn, remaining, hand]);

  // Don't let a stray refresh or closed tab lose unsaved typing.
  useEffect(() => {
    if (handedIn) return;
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current.size > 0) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [handedIn]);

  const change = (qid: string, value: string) => {
    setAnswers((a) => ({ ...a, [qid]: value }));
    dirty.current.add(qid);
    setSaveState((s) => ({ ...s, [qid]: "saving" }));
    clearTimeout(timers.current[qid]);
    timers.current[qid] = setTimeout(() => void saveOne(qid), 800);
  };

  const answered = paper.questions.filter(
    (q) => (answers[q.question_id] ?? "").trim() !== "",
  ).length;
  const unanswered = paper.questions.length - answered;

  if (handedIn) return <HandedIn attemptId={attemptId} assessment={assessment} />;

  const low = remaining <= 5 * 60_000;
  const critical = remaining <= 60_000;

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-30 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{paper.title}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {answered}/{paper.questions.length} answered · {paper.total_marks} marks
            </p>
          </div>
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
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        {paper.instructions ? <div className="panel p-4 text-sm">{paper.instructions}</div> : null}

        {paper.questions.map((q, i) => {
          const state = saveState[q.question_id];
          return (
            <section key={q.question_id} className="panel space-y-4 p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold">Question {i + 1}</h2>
                <span className="shrink-0 rounded-full bg-secondary px-3 py-1 font-mono text-xs">
                  {q.marks} mark{q.marks === 1 ? "" : "s"}
                </span>
              </div>
              <QuestionText text={q.question} />
              <div>
                <Textarea
                  aria-label={`Answer to question ${i + 1}`}
                  value={answers[q.question_id] ?? ""}
                  onChange={(e) => change(q.question_id, e.target.value)}
                  onBlur={() => void saveOne(q.question_id)}
                  onKeyDown={(e) => {
                    // Code answers: Tab indents instead of jumping to the next box.
                    if (q.answer_format !== "code" || e.key !== "Tab") return;
                    e.preventDefault();
                    const el = e.currentTarget;
                    const { selectionStart: s, selectionEnd: en } = el;
                    const next = el.value.slice(0, s) + "    " + el.value.slice(en);
                    change(q.question_id, next);
                    requestAnimationFrame(() => el.setSelectionRange(s + 4, s + 4));
                  }}
                  rows={
                    q.answer_format === "code" ? Math.max(8, q.marks + 4) : Math.max(3, q.marks + 1)
                  }
                  spellCheck={q.answer_format !== "code"}
                  autoCapitalize="off"
                  autoCorrect="off"
                  className={q.answer_format === "code" ? "font-mono text-sm" : ""}
                  placeholder={
                    q.answer_format === "code"
                      ? "Write your program here…"
                      : "Write your answer here…"
                  }
                />
                <p
                  className={`mt-1.5 h-4 font-mono text-xs ${
                    state === "error" ? "text-destructive" : "text-muted-foreground"
                  }`}
                  aria-live="polite"
                >
                  {state === "saving"
                    ? "Saving…"
                    : state === "saved"
                      ? "✓ Saved"
                      : state === "error"
                        ? "Couldn't save - check your connection; it will try again"
                        : ""}
                </p>
              </div>
            </section>
          );
        })}

        <div className="panel space-y-3 p-6">
          {confirmSubmit ? (
            <>
              <p className="font-medium">Hand in your assessment?</p>
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

function HandedIn({ attemptId, assessment }: { attemptId: string; assessment: AssessmentRow }) {
  const { data: result } = useQuery({
    queryKey: ["assessment-result", attemptId],
    queryFn: async () => {
      const { data, error } = await sb.rpc("my_assessment_result", { _attempt_id: attemptId });
      if (error) throw new Error(error.message);
      return data as Result;
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/dashboard"
        className="font-mono text-xs text-muted-foreground hover:text-foreground"
      >
        ← Dashboard
      </Link>
      <div className="panel space-y-2 p-6">
        <h1 className="text-2xl font-semibold">{assessment.title}</h1>
        {result?.available ? (
          <>
            <p className="text-4xl font-semibold text-primary">
              {result.marks_awarded}
              <span className="text-2xl text-muted-foreground"> / {result.total_marks}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {Math.round((result.marks_awarded / Math.max(1, result.total_marks)) * 100)}%
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-medium text-success">✓ Handed in</p>
            <p className="text-sm text-muted-foreground">
              Your teacher will mark it. You'll see your marks here once they've shared the results.
            </p>
          </>
        )}
      </div>

      {result?.available
        ? result.questions.map((q, i) => (
            <section key={q.position} className="panel space-y-3 p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold">Question {i + 1}</h2>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 font-mono text-xs ${
                    q.marks_awarded === q.marks ? "bg-success/15 text-success" : "bg-secondary"
                  }`}
                >
                  {q.marks_awarded} / {q.marks}
                </span>
              </div>
              <QuestionText text={q.question} />
              <div>
                <p className="mb-1 font-mono text-xs text-muted-foreground uppercase">
                  Your answer
                </p>
                <pre className="rounded-md border border-border bg-secondary/30 p-3 text-sm whitespace-pre-wrap">
                  {q.answer.trim() ? q.answer : "(no answer)"}
                </pre>
              </div>
              {q.comment ? (
                <p className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                  <span className="font-medium">Teacher: </span>
                  {q.comment}
                </p>
              ) : null}
            </section>
          ))
        : null}
    </div>
  );
}
