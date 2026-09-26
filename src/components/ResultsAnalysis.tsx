import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { sb } from "@/lib/assessments-db";
import { topicLabel } from "@/lib/game";
import {
  analyseResults,
  BAND_LABEL,
  type AnalysedAttempt,
  type Band,
} from "@/lib/results-analysis";

const BAND_BAR: Record<Band, string> = {
  needs_work: "bg-destructive",
  developing: "bg-warning",
  strong: "bg-success",
};
const BAND_TEXT: Record<Band, string> = {
  needs_work: "text-destructive",
  developing: "text-warning",
  strong: "text-success",
};

const REVISIT_SHOWN = 5;
const ASSESSMENTS_SHOWN = 5;

/**
 * "My results": a student's marked assessments, analysed - the overall
 * mark, how they're doing in each topic (weakest first), and which
 * questions lost them marks, with the teacher's comment where there is one.
 * Only work the teacher has marked AND released counts. Renders nothing
 * until there is some (and if the feature's database function isn't there),
 * so it never clutters or breaks the dashboard around it.
 */
export function ResultsAnalysis() {
  const { user } = useAuth();
  const [showAllRevisit, setShowAllRevisit] = useState(false);

  const { data } = useQuery({
    queryKey: ["my-results", user?.id],
    enabled: !!user,
    retry: false,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await sb.rpc("my_assessment_analysis");
      if (error) throw new Error(error.message);
      return analyseResults((data ?? []) as AnalysedAttempt[]);
    },
  });

  if (!data || data.overall.assessments === 0) return null;
  const { overall, topics, revisit, assessments } = data;
  const shownRevisit = showAllRevisit ? revisit : revisit.slice(0, REVISIT_SHOWN);

  return (
    <section className="panel space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">My results</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            From {overall.assessments} marked assessment{overall.assessments === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-semibold text-primary">
            {overall.earned}
            <span className="text-2xl text-muted-foreground"> / {overall.available}</span>
          </p>
          <p className={`font-mono text-sm ${BAND_TEXT[overall.band]}`}>
            {overall.percent}% · {BAND_LABEL[overall.band]}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold">By topic</h3>
        <p className="mb-3 text-xs text-muted-foreground">Weakest first - start with the top.</p>
        <ul className="space-y-3">
          {topics.map((t) => (
            <li key={t.topic}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">{topicLabel(t.topic)}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {t.earned}/{t.available} marks · {t.percent}% ·{" "}
                  <span className={BAND_TEXT[t.band]}>{BAND_LABEL[t.band]}</span>
                </span>
              </div>
              <div
                className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary"
                role="img"
                aria-label={`${topicLabel(t.topic)}: ${t.percent}%`}
              >
                <div
                  className={`h-full ${BAND_BAR[t.band]}`}
                  style={{ width: `${Math.max(t.percent, 2)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-base font-semibold">Questions to revisit</h3>
        {revisit.length === 0 ? (
          <p className="mt-1 text-sm text-success">
            ✓ Full marks on every question so far - well done.
          </p>
        ) : (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              The questions that lost you the most marks first.
            </p>
            <ul className="space-y-2">
              {shownRevisit.map((r) => (
                <li
                  key={`${r.assessmentId}-${r.questionId}`}
                  className="rounded-lg border border-border p-3 text-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{r.label}</p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {topicLabel(r.topic)} · {r.assessmentTitle}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full bg-secondary px-2.5 py-0.5 font-mono text-xs ${
                        r.earned === 0 ? "text-destructive" : "text-warning"
                      }`}
                    >
                      {r.earned}/{r.marks}
                    </span>
                  </div>
                  {r.comment ? (
                    <p className="mt-2 rounded-md border border-primary/30 bg-primary/5 p-2 text-xs">
                      <span className="font-medium">Teacher: </span>
                      {r.comment}
                    </p>
                  ) : null}
                  <Link
                    to="/sit/$assessmentId"
                    params={{ assessmentId: r.assessmentId }}
                    className="mt-2 inline-block text-xs text-primary hover:underline"
                  >
                    See your answer →
                  </Link>
                </li>
              ))}
            </ul>
            {revisit.length > REVISIT_SHOWN ? (
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => setShowAllRevisit((v) => !v)}
              >
                {showAllRevisit ? "Show fewer" : `Show all ${revisit.length}`}
              </Button>
            ) : null}
          </>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-base font-semibold">Your assessments</h3>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {assessments.slice(0, ASSESSMENTS_SHOWN).map((a) => (
            <li key={a.assessmentId}>
              <Link
                to="/sit/$assessmentId"
                params={{ assessmentId: a.assessmentId }}
                className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm transition-colors hover:bg-secondary/40"
              >
                <span className="min-w-0 font-medium">{a.title}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {a.earned}/{a.available} · <span className={BAND_TEXT[a.band]}>{a.percent}%</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
