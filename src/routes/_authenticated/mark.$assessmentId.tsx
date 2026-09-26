import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { QuestionText } from "@/components/QuestionText";
import { attemptStatus, questionScore, type AttemptStatus } from "@/lib/assessments";
import { supabase } from "@/integrations/supabase/client";
import { topicLabel } from "@/lib/game";
import {
  fetchQuestions,
  sb,
  type AssessmentRow,
  type AttemptRow,
  type BankQuestion,
  type MarkPointRow,
} from "@/lib/assessments-db";

export const Route = createFileRoute("/_authenticated/mark/$assessmentId")({
  head: () => ({
    meta: [
      { title: "Mark assessment — H-Code" },
      { name: "description", content: "Mark a class's assessment against the mark scheme." },
    ],
  }),
  component: MarkPage,
});

type Student = { id: string; name: string };

const STATUS_LABEL: Record<AttemptStatus, string> = {
  not_started: "Not started",
  writing: "Writing now",
  handed_in: "To mark",
  marked: "Marked",
};
const STATUS_STYLE: Record<AttemptStatus, string> = {
  not_started: "bg-secondary text-muted-foreground",
  writing: "bg-warning/15 text-warning",
  handed_in: "bg-primary/15 text-primary",
  marked: "bg-success/15 text-success",
};

function MarkPage() {
  const { assessmentId } = Route.useParams();
  const { isTeacher } = useAuth();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [releasing, setReleasing] = useState(false);

  const { data: setup, error: setupError } = useQuery({
    queryKey: ["mark-setup", assessmentId],
    enabled: isTeacher,
    queryFn: async () => {
      const { data: a, error } = await sb
        .from("assessments")
        .select("*, classes(name)")
        .eq("id", assessmentId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!a) return null;
      const assessment = a as AssessmentRow & { classes: { name: string } | null };

      const { data: items } = await sb
        .from("assessment_items")
        .select("position, question_id")
        .eq("assessment_id", assessmentId)
        .order("position");
      const ids = (items ?? []).map((i: { question_id: string }) => i.question_id);
      const [bank, pointsRes] = await Promise.all([
        fetchQuestions(ids),
        ids.length
          ? sb.from("assessment_mark_points").select("*").in("question_id", ids).order("position")
          : Promise.resolve({ data: [] }),
      ]);
      const byId = new Map(bank.map((q) => [q.id, q]));
      const questions = ids
        .map((id: string) => byId.get(id))
        .filter((q: BankQuestion | undefined): q is BankQuestion => !!q);
      const points = new Map<string, MarkPointRow[]>();
      for (const p of (pointsRes.data ?? []) as MarkPointRow[]) {
        points.set(p.question_id, [...(points.get(p.question_id) ?? []), p]);
      }

      // The class's students, same rule as the class page: staff who happen to
      // have a membership row are not students.
      const { data: members } = await supabase
        .from("class_members")
        .select("student_id")
        .eq("class_id", assessment.class_id);
      const memberIds = (members ?? []).map((m) => m.student_id);
      const { data: staff } = memberIds.length
        ? await supabase
            .from("user_roles")
            .select("user_id")
            .in("user_id", memberIds)
            .in("role", ["teacher", "admin"])
        : { data: [] };
      const staffIds = new Set((staff ?? []).map((r) => r.user_id));
      const studentIds = memberIds.filter((id) => !staffIds.has(id));
      const { data: profiles } = studentIds.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", studentIds)
        : { data: [] };
      // Alphabetical, like the class roster.
      const byName = new Intl.Collator("en-GB", { sensitivity: "base", numeric: true });
      const students: Student[] = (profiles ?? [])
        .map((p) => ({ id: p.id, name: p.full_name ?? p.email ?? "Student" }))
        .sort((x, y) => byName.compare(x.name, y.name));

      return { assessment, questions, points, students };
    },
  });

  const { data: progress } = useQuery({
    queryKey: ["mark-attempts", assessmentId],
    enabled: isTeacher && !!setup,
    refetchInterval: 20_000,
    queryFn: async () => {
      const { data: attempts, error } = await sb
        .from("assessment_attempts")
        .select("*")
        .eq("assessment_id", assessmentId);
      if (error) throw new Error(error.message);
      const rows = (attempts ?? []) as AttemptRow[];
      const scores = new Map<string, number>();
      if (rows.length > 0) {
        const { data: answers } = await sb
          .from("assessment_answers")
          .select("attempt_id, marks_awarded")
          .in(
            "attempt_id",
            rows.map((r) => r.id),
          )
          .limit(5000);
        for (const a of (answers ?? []) as { attempt_id: string; marks_awarded: number }[]) {
          scores.set(a.attempt_id, (scores.get(a.attempt_id) ?? 0) + a.marks_awarded);
        }
      }
      return { attempts: new Map(rows.map((r) => [r.student_id, r])), scores };
    },
  });

  if (!isTeacher)
    return <p className="text-muted-foreground">Only teachers can mark assessments.</p>;
  if (setupError)
    return <p className="text-destructive">Couldn't load this assessment: {setupError.message}</p>;
  if (setup === undefined) return <p className="text-muted-foreground">Loading…</p>;
  if (setup === null) {
    return (
      <div className="panel p-6">
        <p className="text-muted-foreground">
          That assessment doesn't exist, or you don't teach the class it was set for.
        </p>
      </div>
    );
  }

  const { assessment, questions, points, students } = setup;
  const attempts = progress?.attempts ?? new Map<string, AttemptRow>();
  const scores = progress?.scores ?? new Map<string, number>();
  const statusOf = (studentId: string) =>
    attemptStatus(
      attempts.get(studentId)
        ? {
            startedAt: attempts.get(studentId)!.started_at,
            submittedAt: attempts.get(studentId)!.submitted_at,
            markedAt: attempts.get(studentId)!.marked_at,
          }
        : null,
      assessment.time_limit_minutes,
    );
  const counts = students.reduce(
    (acc, s) => {
      acc[statusOf(s.id)] += 1;
      return acc;
    },
    { not_started: 0, writing: 0, handed_in: 0, marked: 0 } as Record<AttemptStatus, number>,
  );

  const toggleRelease = async () => {
    setReleasing(true);
    const { error } = await sb
      .from("assessments")
      .update({ results_released: !assessment.results_released })
      .eq("id", assessmentId);
    setReleasing(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      assessment.results_released ? "Results hidden from students" : "Results released to students",
    );
    void qc.invalidateQueries({ queryKey: ["mark-setup", assessmentId] });
    void qc.invalidateQueries({ queryKey: ["class-assessments"] });
  };

  const nextToMark = () => {
    const i = students.findIndex((s) => s.id === selected);
    const ordered = [...students.slice(i + 1), ...students.slice(0, Math.max(0, i))];
    const next = ordered.find((s) => statusOf(s.id) === "handed_in");
    if (next) setSelected(next.id);
    else toast.info("No more handed-in work waiting to be marked");
  };

  const chosen = students.find((s) => s.id === selected) ?? null;
  const chosenAttempt = chosen ? (attempts.get(chosen.id) ?? null) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/teacher/$classId"
            params={{ classId: assessment.class_id }}
            className="font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            ← {assessment.classes?.name ?? "Class"}
          </Link>
          <h1 className="mt-1 text-3xl font-semibold">{assessment.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {assessment.board.toUpperCase()} ·{" "}
            {assessment.topics.map(topicLabel).join(", ") || "Mixed topics"} ·{" "}
            {assessment.time_limit_minutes} min · {assessment.total_marks} marks
          </p>
        </div>
        <div className="space-y-2 text-right">
          <p className="font-mono text-xs text-muted-foreground">
            {counts.marked} marked · {counts.handed_in} to mark · {counts.writing} writing ·{" "}
            {counts.not_started} not started
          </p>
          <Button
            variant={assessment.results_released ? "secondary" : "default"}
            size="sm"
            onClick={toggleRelease}
            disabled={releasing}
          >
            {assessment.results_released
              ? "Hide results from students"
              : "Release results to students"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
        <aside className="panel h-fit divide-y divide-border overflow-hidden text-sm md:sticky md:top-4">
          {students.length === 0 ? (
            <p className="p-4 text-muted-foreground">No students in this class yet.</p>
          ) : null}
          {students.map((s) => {
            const status = statusOf(s.id);
            const att = attempts.get(s.id);
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-secondary/50 ${
                  s.id === selected ? "bg-secondary/70" : ""
                }`}
              >
                <span className="min-w-0 truncate font-medium">{s.name}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {att && (status === "marked" || scores.has(att.id)) ? (
                    <span className="font-mono text-xs text-muted-foreground">
                      {scores.get(att.id) ?? 0}/{assessment.total_marks}
                    </span>
                  ) : null}
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[0.68rem] ${STATUS_STYLE[status]}`}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                </span>
              </button>
            );
          })}
        </aside>

        <div>
          {!chosen ? (
            <div className="panel p-8 text-center text-muted-foreground">
              Choose a student to see their answers and mark them against the mark scheme.
            </div>
          ) : !chosenAttempt ? (
            <div className="panel p-8 text-center text-muted-foreground">
              {chosen.name} hasn't started this assessment.
            </div>
          ) : (
            <AttemptMarking
              key={chosenAttempt.id}
              attempt={chosenAttempt}
              student={chosen}
              assessment={assessment}
              questions={questions}
              points={points}
              onChanged={() =>
                void qc.invalidateQueries({ queryKey: ["mark-attempts", assessmentId] })
              }
              onNext={nextToMark}
            />
          )}
        </div>
      </div>
    </div>
  );
}

type QState = { decisions: Record<number, boolean>; comment: string; touched: boolean };

function AttemptMarking({
  attempt,
  student,
  assessment,
  questions,
  points,
  onChanged,
  onNext,
}: {
  attempt: AttemptRow;
  student: Student;
  assessment: AssessmentRow;
  questions: BankQuestion[];
  points: Map<string, MarkPointRow[]>;
  onChanged: () => void;
  onNext: () => void;
}) {
  const status = attemptStatus(
    {
      startedAt: attempt.started_at,
      submittedAt: attempt.submitted_at,
      markedAt: attempt.marked_at,
    },
    assessment.time_limit_minutes,
  );
  const canMark = status !== "writing";
  const [markedAt, setMarkedAt] = useState(attempt.marked_at);

  const { data: saved } = useQuery({
    queryKey: ["mark-answers", attempt.id],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const [answers, marks] = await Promise.all([
        sb
          .from("assessment_answers")
          .select("question_id, answer, teacher_comment")
          .eq("attempt_id", attempt.id),
        sb
          .from("assessment_marks")
          .select("question_id, position, awarded")
          .eq("attempt_id", attempt.id),
      ]);
      return {
        answers: (answers.data ?? []) as {
          question_id: string;
          answer: string;
          teacher_comment: string;
        }[],
        marks: (marks.data ?? []) as { question_id: string; position: number; awarded: boolean }[],
      };
    },
  });

  if (!saved) return <p className="text-muted-foreground">Loading {student.name}'s answers…</p>;

  return (
    <MarkingForm
      attempt={attempt}
      student={student}
      assessment={assessment}
      questions={questions}
      points={points}
      saved={saved}
      status={status}
      canMark={canMark}
      markedAt={markedAt}
      setMarkedAt={setMarkedAt}
      onChanged={onChanged}
      onNext={onNext}
    />
  );
}

function MarkingForm({
  attempt,
  student,
  assessment,
  questions,
  points,
  saved,
  status,
  canMark,
  markedAt,
  setMarkedAt,
  onChanged,
  onNext,
}: {
  attempt: AttemptRow;
  student: Student;
  assessment: AssessmentRow;
  questions: BankQuestion[];
  points: Map<string, MarkPointRow[]>;
  saved: {
    answers: { question_id: string; answer: string; teacher_comment: string }[];
    marks: { question_id: string; position: number; awarded: boolean }[];
  };
  status: AttemptStatus;
  canMark: boolean;
  markedAt: string | null;
  setMarkedAt: (v: string | null) => void;
  onChanged: () => void;
  onNext: () => void;
}) {
  const answerOf = useMemo(() => new Map(saved.answers.map((a) => [a.question_id, a])), [saved]);
  const [state, setState] = useState<Record<string, QState>>(() => {
    const out: Record<string, QState> = {};
    for (const q of questions) {
      const rows = saved.marks.filter((m) => m.question_id === q.id);
      out[q.id] = {
        decisions: Object.fromEntries(rows.map((m) => [m.position, m.awarded])),
        comment: answerOf.get(q.id)?.teacher_comment ?? "",
        touched: rows.length > 0,
      };
    }
    return out;
  });
  const [saveState, setSaveState] = useState<Record<string, "saved" | "saving" | "error">>({});
  const [finishing, setFinishing] = useState(false);
  const latest = useRef(state);
  latest.current = state;
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  const save = useCallback(
    async (qid: string) => {
      const st = latest.current[qid]!;
      const pts = points.get(qid) ?? [];
      setSaveState((s) => ({ ...s, [qid]: "saving" }));
      const { error } = await sb.rpc("mark_assessment_answer", {
        _attempt_id: attempt.id,
        _question_id: qid,
        _points: pts.map((p) => ({ position: p.position, awarded: !!st.decisions[p.position] })),
        _comment: st.comment,
      });
      if (error) {
        setSaveState((s) => ({ ...s, [qid]: "error" }));
        toast.error(error.message);
        return;
      }
      setSaveState((s) => ({ ...s, [qid]: "saved" }));
      onChanged();
    },
    [attempt.id, points, onChanged],
  );

  const update = (qid: string, patch: (s: QState) => QState, delay = 500) => {
    setState((cur) => ({ ...cur, [qid]: patch(cur[qid]!) }));
    setSaveState((s) => ({ ...s, [qid]: "saving" }));
    clearTimeout(timers.current[qid]);
    timers.current[qid] = setTimeout(() => void save(qid), delay);
  };

  const decide = (q: BankQuestion, position: number, yes: boolean) =>
    update(q.id, (s) => {
      // The first click on a question rules on every point: any point not yet
      // clicked is a NO, so a marked question never has undecided points.
      const base = s.touched
        ? s.decisions
        : Object.fromEntries((points.get(q.id) ?? []).map((p) => [p.position, false]));
      return { ...s, touched: true, decisions: { ...base, [position]: yes } };
    });

  const setAll = (q: BankQuestion, yes: boolean) =>
    update(
      q.id,
      (s) => ({
        ...s,
        touched: true,
        decisions: Object.fromEntries((points.get(q.id) ?? []).map((p) => [p.position, yes])),
      }),
      100,
    );

  const scoreOf = (q: BankQuestion) => {
    const st = state[q.id]!;
    const awarded = new Set(
      Object.entries(st.decisions)
        .filter(([, v]) => v)
        .map(([k]) => Number(k)),
    );
    return questionScore(points.get(q.id) ?? [], awarded, q.marks);
  };
  const total = questions.reduce((s, q) => s + scoreOf(q), 0);
  const unmarkedCount = questions.filter((q) => !state[q.id]!.touched).length;

  const finish = async (marked: boolean) => {
    setFinishing(true);
    // Make sure nothing typed a moment ago is still waiting to save.
    await Promise.all(
      Object.keys(timers.current).map((qid) => {
        clearTimeout(timers.current[qid]);
        return saveState[qid] === "saving" ? save(qid) : Promise.resolve();
      }),
    );
    const { error } = await sb.rpc("set_assessment_marked", {
      _attempt_id: attempt.id,
      _marked: marked,
    });
    setFinishing(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMarkedAt(marked ? new Date().toISOString() : null);
    onChanged();
    if (marked) toast.success(`${student.name}: ${total}/${assessment.total_marks} - marked`);
  };

  return (
    <div className="space-y-5">
      <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-lg font-semibold">{student.name}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {STATUS_LABEL[status]}
            {attempt.submitted_at
              ? ` · handed in ${new Date(attempt.submitted_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`
              : ""}
          </p>
        </div>
        <p className="text-3xl font-semibold text-primary">
          {total}
          <span className="text-xl text-muted-foreground"> / {assessment.total_marks}</span>
        </p>
      </div>

      {!canMark ? (
        <div className="rounded-lg border border-warning/40 bg-warning/5 p-4 text-sm">
          {student.name} is still writing. You can read their answers as they save, but marking
          opens once they hand in or their time runs out.
        </div>
      ) : null}

      {questions.map((q, i) => {
        const st = state[q.id]!;
        const pts = points.get(q.id) ?? [];
        const answer = answerOf.get(q.id)?.answer ?? "";
        const raw = pts.filter((p) => st.decisions[p.position]).reduce((s, p) => s + p.marks, 0);
        const score = scoreOf(q);
        return (
          <section key={q.id} className="panel space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-lg font-semibold">
                Question {i + 1}{" "}
                <span className="font-mono text-xs font-normal text-muted-foreground">
                  {topicLabel(q.topic)} · {q.marks} mark{q.marks === 1 ? "" : "s"}
                </span>
              </h2>
              <span
                className={`rounded-full px-3 py-1 font-mono text-sm ${
                  !st.touched
                    ? "bg-secondary text-muted-foreground"
                    : score === q.marks
                      ? "bg-success/15 text-success"
                      : "bg-primary/15 text-primary"
                }`}
              >
                {st.touched ? `${score} / ${q.marks}` : `Not marked · ${q.marks}`}
              </span>
            </div>

            <QuestionText text={q.question} />

            <div>
              <p className="mb-1 font-mono text-xs text-muted-foreground uppercase">
                Student's answer
              </p>
              <pre
                className={`rounded-md border border-border bg-secondary/30 p-3 text-sm whitespace-pre-wrap ${
                  q.answer_format === "code" ? "font-mono" : ""
                } ${answer.trim() ? "" : "text-muted-foreground italic"}`}
              >
                {answer.trim() ? answer : "(no answer given)"}
              </pre>
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-xs text-muted-foreground uppercase">Mark scheme</p>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!canMark}
                    onClick={() => setAll(q, true)}
                  >
                    All YES
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!canMark}
                    onClick={() => setAll(q, false)}
                  >
                    All NO
                  </Button>
                </div>
              </div>
              <ul className="divide-y divide-border rounded-md border border-border">
                {pts.map((p) => {
                  const d = st.decisions[p.position];
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
                      <div
                        className="flex gap-1.5"
                        role="group"
                        aria-label={`Award this point? ${p.text}`}
                      >
                        <button
                          type="button"
                          disabled={!canMark}
                          aria-pressed={d === true}
                          onClick={() => decide(q, p.position, true)}
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
                          disabled={!canMark}
                          aria-pressed={st.touched && d !== true}
                          onClick={() => decide(q, p.position, false)}
                          className={`w-16 rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-40 ${
                            st.touched && d !== true
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
              {raw > q.marks ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  The points add up to {raw}, but the question is only worth {q.marks} - the score
                  is capped.
                </p>
              ) : null}
            </div>

            <div>
              <Textarea
                aria-label={`Comment on question ${i + 1}`}
                placeholder="Comment for the student (optional)"
                rows={2}
                value={st.comment}
                disabled={!canMark}
                onChange={(e) => update(q.id, (s) => ({ ...s, comment: e.target.value }), 900)}
              />
              <p className="mt-1 h-4 font-mono text-xs text-muted-foreground" aria-live="polite">
                {saveState[q.id] === "saving"
                  ? "Saving…"
                  : saveState[q.id] === "saved"
                    ? "✓ Saved"
                    : saveState[q.id] === "error"
                      ? "Not saved"
                      : ""}
              </p>
            </div>
          </section>
        );
      })}

      <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-muted-foreground">
          {unmarkedCount > 0
            ? `${unmarkedCount} question${unmarkedCount === 1 ? "" : "s"} not marked yet (they count as 0).`
            : "Every question has been marked."}
        </p>
        <div className="flex gap-2">
          {markedAt ? (
            <Button variant="secondary" onClick={() => void finish(false)} disabled={finishing}>
              Reopen marking
            </Button>
          ) : (
            <Button onClick={() => void finish(true)} disabled={!canMark || finishing}>
              {finishing ? "Saving…" : "Mark as complete"}
            </Button>
          )}
          <Button variant="secondary" onClick={onNext}>
            Next student to mark →
          </Button>
        </div>
      </div>
    </div>
  );
}
