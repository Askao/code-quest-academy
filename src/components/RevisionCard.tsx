import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { sb } from "@/lib/assessments-db";
import { topicLabel } from "@/lib/game";
import { BAND_LABEL, analyseResults, type AnalysedAttempt } from "@/lib/results-analysis";

/**
 * A small box on the student dashboard: a way into revision papers and, once
 * they've marked some, how those have gone. Kept apart from "My results",
 * which is teacher-marked work only - these marks are the student's own.
 */
export function RevisionCard() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["dashboard-revision", user?.id],
    enabled: !!user,
    retry: false,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await sb.rpc("my_revision_analysis");
      if (error) throw new Error(error.message);
      return analyseResults((data ?? []) as AnalysedAttempt[]);
    },
  });

  const papers = data?.overall.assessments ?? 0;
  const weakest = data?.topics[0];

  return (
    <section className="panel flex flex-wrap items-center justify-between gap-4 p-6">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold">Revision papers</h2>
        {papers === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Build your own exam-style paper, mark it yourself and see which topics need work.
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            {papers} paper{papers === 1 ? "" : "s"} marked · {data!.overall.percent}% overall (
            {BAND_LABEL[data!.overall.band]})
            {weakest && weakest.band !== "strong"
              ? ` · weakest topic: ${topicLabel(weakest.topic)}`
              : ""}
            .
          </p>
        )}
      </div>
      <Button asChild>
        <Link to="/revise">{papers === 0 ? "Build a paper" : "Revise"}</Link>
      </Button>
    </section>
  );
}
