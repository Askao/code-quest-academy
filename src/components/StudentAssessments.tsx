import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { attemptStatus, deadlineOf, formatClock } from "@/lib/assessments";
import {
  assessmentReasonLabel,
  HOMEWORK_REASON_LABEL,
  studentAssessmentArchiveReason,
  type HomeworkArchiveReason,
} from "@/lib/archive";
import { sb, type AssessmentRow, type AttemptRow } from "@/lib/assessments-db";
import { topicLabel } from "@/lib/game";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-GB");

type StudentAssessment = AssessmentRow & {
  classes: { name: string } | null;
  attempt: AttemptRow | null;
};

/**
 * The assessments set for the signed-in student's classes, with their own
 * attempt at each. Undefined while loading, or if the feature's tables
 * aren't there yet - callers render nothing in that case, so it can never
 * break the dashboard around it.
 */
function useStudentAssessments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["student-assessments", user?.id],
    enabled: !!user,
    retry: false,
    refetchInterval: 60_000,
    queryFn: async (): Promise<StudentAssessment[]> => {
      const { data: rows, error } = await sb
        .from("assessments")
        .select("*, classes(name)")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      const assessments = (rows ?? []) as (AssessmentRow & { classes: { name: string } | null })[];
      const { data: attempts } = assessments.length
        ? await sb
            .from("assessment_attempts")
            .select("*")
            .eq("student_id", user!.id)
            .in(
              "assessment_id",
              assessments.map((a) => a.id),
            )
        : { data: [] };
      const mine = new Map(((attempts ?? []) as AttemptRow[]).map((t) => [t.assessment_id, t]));
      return assessments.map((a) => ({ ...a, attempt: mine.get(a.id) ?? null }));
    },
  });
}

const statusOf = (a: StudentAssessment) =>
  attemptStatus(
    a.attempt
      ? {
          startedAt: a.attempt.started_at,
          submittedAt: a.attempt.submitted_at,
          markedAt: a.attempt.marked_at,
        }
      : null,
    a.time_limit_minutes,
  );

/** The assessments a student still has to do: not yet handed in, and not
 * closed. Everything else lives in the Archive. */
export function StudentAssessments() {
  const { data } = useStudentAssessments();
  const now = new Date();
  const items = (data ?? []).filter(
    (a) => !studentAssessmentArchiveReason({ status: statusOf(a), closesAt: a.closes_at }, now),
  );
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">Assessments</h2>
      <div className="space-y-3">
        {items.map((a) => {
          const status = statusOf(a);
          const notOpen = a.opens_at ? now.getTime() < new Date(a.opens_at).getTime() : false;
          const remaining =
            status === "writing" && a.attempt
              ? deadlineOf(a.attempt.started_at, a.time_limit_minutes).getTime() - now.getTime()
              : 0;
          return (
            <div key={a.id} className="panel flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-muted-foreground">
                  {a.classes?.name ? `${a.classes.name} · ` : ""}
                  {a.topics.map(topicLabel).join(", ") || "Mixed topics"} · {a.time_limit_minutes}{" "}
                  min · {a.total_marks} marks
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {status === "writing"
                    ? `In progress · ${formatClock(remaining)} left`
                    : notOpen
                      ? `Opens ${fmt(a.opens_at!)}`
                      : a.closes_at
                        ? `Start by ${fmt(a.closes_at)}`
                        : "Ready when you are"}
                </p>
              </div>
              <Button asChild size="sm" disabled={status === "not_started" && notOpen}>
                <Link to="/sit/$assessmentId" params={{ assessmentId: a.id }}>
                  {status === "writing" ? "Continue" : "Start"}
                </Link>
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export type ArchivedHomework = {
  id: string;
  title: string;
  className: string | null;
  dueAt: string | null;
  createdAt: string;
  completed: number;
  total: number;
  reason: HomeworkArchiveReason;
};

type ArchiveRow = {
  key: string;
  kind: "Homework" | "Assessment";
  title: string;
  detail: string;
  badge: string;
  good: boolean;
  date: string;
  action: { label: string; render: (label: string) => React.ReactNode };
};

/**
 * Finished work: homework that's complete or past its deadline, and
 * assessments that are handed in, marked or missed. It stays fully open -
 * this is only a tidier place for it than the "to do" lists - so a student
 * can always go back to their work and their marks. Collapsed by default.
 */
export function StudentArchive({ homework }: { homework: ArchivedHomework[] }) {
  const { data } = useStudentAssessments();
  const now = new Date();

  const rows: ArchiveRow[] = [
    ...homework.map<ArchiveRow>((hw) => ({
      key: `hw-${hw.id}`,
      kind: "Homework",
      title: hw.title,
      detail: [
        hw.className,
        hw.dueAt ? `Due ${fmtDay(hw.dueAt)}` : null,
        `${hw.completed}/${hw.total} done`,
      ]
        .filter(Boolean)
        .join(" · "),
      badge: HOMEWORK_REASON_LABEL[hw.reason],
      good: hw.reason === "completed",
      date: hw.dueAt ?? hw.createdAt,
      action: {
        label: "Review",
        render: (label) => (
          <Link to="/homework/$homeworkId" params={{ homeworkId: hw.id }}>
            {label}
          </Link>
        ),
      },
    })),
    ...(data ?? []).flatMap<ArchiveRow>((a) => {
      const status = statusOf(a);
      const reason = studentAssessmentArchiveReason({ status, closesAt: a.closes_at }, now);
      if (!reason) return [];
      const resultsReady = reason === "marked" && a.results_released;
      return [
        {
          key: `as-${a.id}`,
          kind: "Assessment",
          title: a.title,
          detail: [a.classes?.name, `${a.time_limit_minutes} min`, `${a.total_marks} marks`]
            .filter(Boolean)
            .join(" · "),
          badge: assessmentReasonLabel(reason, a.results_released),
          good: resultsReady,
          date: a.attempt?.submitted_at ?? a.closes_at ?? a.created_at,
          action: {
            label: resultsReady ? "View results" : reason === "missed" ? "Details" : "View",
            render: (label) => (
              <Link to="/sit/$assessmentId" params={{ assessmentId: a.id }}>
                {label}
              </Link>
            ),
          },
        },
      ];
    }),
  ].sort((x, y) => y.date.localeCompare(x.date));

  if (rows.length === 0) return null;

  return (
    <section>
      <details className="group">
        <summary className="mb-3 cursor-pointer text-xl font-semibold select-none">
          Archive <span className="font-mono text-sm text-muted-foreground">({rows.length})</span>
        </summary>
        <p className="mb-3 text-sm text-muted-foreground">
          Finished homework and assessments. You can still open any of them to look back at your
          work.
        </p>
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.key} className="panel flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {r.title}{" "}
                  <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 font-mono text-[0.68rem] font-normal text-muted-foreground">
                    {r.kind}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">{r.detail}</p>
                <p
                  className={`mt-0.5 font-mono text-xs ${
                    r.good ? "text-success" : "text-muted-foreground"
                  }`}
                >
                  {r.good ? "✓ " : ""}
                  {r.badge}
                </p>
              </div>
              <Button asChild size="sm" variant="secondary">
                {r.action.render(r.action.label)}
              </Button>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
