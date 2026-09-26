import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { attemptStatus, deadlineOf, formatClock } from "@/lib/assessments";
import { sb, type AssessmentRow, type AttemptRow } from "@/lib/assessments-db";
import { topicLabel } from "@/lib/game";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

/**
 * The assessments set for a student's classes, on their dashboard. Renders
 * nothing when there are none (or if the feature's tables aren't there yet),
 * so it can never break the dashboard around it.
 */
export function StudentAssessments() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["student-assessments", user?.id],
    enabled: !!user,
    retry: false,
    refetchInterval: 60_000,
    queryFn: async () => {
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

  const now = Date.now();
  const items = (data ?? []).filter((a) => {
    // An assessment that closed before they ever started it is just noise.
    const closed = a.closes_at ? now > new Date(a.closes_at).getTime() : false;
    return a.attempt || !closed;
  });
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">Assessments</h2>
      <div className="space-y-3">
        {items.map((a) => {
          const status = attemptStatus(
            a.attempt
              ? {
                  startedAt: a.attempt.started_at,
                  submittedAt: a.attempt.submitted_at,
                  markedAt: a.attempt.marked_at,
                }
              : null,
            a.time_limit_minutes,
          );
          const notOpen = a.opens_at ? now < new Date(a.opens_at).getTime() : false;
          const remaining =
            status === "writing" && a.attempt
              ? deadlineOf(a.attempt.started_at, a.time_limit_minutes).getTime() - now
              : 0;
          const resultsReady = status === "marked" && a.results_released;
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
                  {status === "not_started"
                    ? notOpen
                      ? `Opens ${fmt(a.opens_at!)}`
                      : a.closes_at
                        ? `Start by ${fmt(a.closes_at)}`
                        : "Ready when you are"
                    : status === "writing"
                      ? `In progress · ${formatClock(remaining)} left`
                      : resultsReady
                        ? "Marked - your results are ready"
                        : status === "marked"
                          ? "Handed in and marked - results not shared yet"
                          : "Handed in - waiting to be marked"}
                </p>
              </div>
              <Button
                asChild
                size="sm"
                variant={status === "not_started" || status === "writing" ? "default" : "secondary"}
                disabled={status === "not_started" && notOpen}
              >
                <Link to="/sit/$assessmentId" params={{ assessmentId: a.id }}>
                  {status === "not_started"
                    ? "Start"
                    : status === "writing"
                      ? "Continue"
                      : resultsReady
                        ? "View results"
                        : "View"}
                </Link>
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
