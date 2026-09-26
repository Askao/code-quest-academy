import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { sb } from "@/lib/assessments-db";
import { topicLabel } from "@/lib/game";
import {
  QUIET_AFTER_DAYS,
  activityOf,
  classTotals,
  percent,
  weakestTopic,
  type Activity,
  type RevisionSummaryRow,
} from "@/lib/revision-summary";

const ACTIVITY_LABEL: Record<Activity, string> = {
  never: "Not started",
  recent: "Active",
  quiet: "Gone quiet",
};
const ACTIVITY_STYLE: Record<Activity, string> = {
  never: "bg-muted text-muted-foreground",
  recent: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  quiet: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

function lastRevised(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * How a class is using the revision-paper feature: a summary only. Students
 * make these papers privately, so a teacher sees counts, the students' own
 * self-marked scores and their weakest topic, never the questions or answers.
 */
export function RevisionSummaryPanel({
  classId,
  students,
}: {
  classId: string;
  students: { id: string; name: string }[];
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["class-revision-summary", classId],
    staleTime: 30_000,
    retry: false,
    queryFn: async (): Promise<RevisionSummaryRow[]> => {
      const { data, error } = await sb.rpc("class_revision_summary", { _class_id: classId });
      if (error) throw new Error(error.message);
      return (data ?? []) as RevisionSummaryRow[];
    },
  });

  const nameOf = useMemo(() => new Map(students.map((s) => [s.id, s.name])), [students]);
  const rows = useMemo(
    () =>
      [...(data ?? [])].sort((a, b) =>
        (nameOf.get(a.student_id) ?? "").localeCompare(nameOf.get(b.student_id) ?? "", "en-GB"),
      ),
    [data, nameOf],
  );
  const totals = useMemo(() => classTotals(rows), [rows]);

  return (
    <section className="panel space-y-4 p-5">
      <div>
        <h2 className="text-lg font-semibold">Revision papers</h2>
        <p className="text-sm text-muted-foreground">
          Students can build their own revision papers and mark them themselves. You see a summary
          only: how much they've done and how they scored themselves. The questions and their
          answers stay private, and students are told this on the Revise page.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="text-sm text-muted-foreground">
          Couldn't load the revision summary. Try refreshing the page.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students in this class yet.</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Have made a paper" value={`${totals.started} of ${totals.students}`} />
            <Stat label="Papers made" value={String(totals.papers)} />
            <Stat
              label="Self-marked score"
              value={totals.percent === null ? "-" : `${totals.percent}%`}
            />
            <Stat label={`Quiet ${QUIET_AFTER_DAYS}+ days`} value={String(totals.quiet)} />
          </dl>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3 font-medium">Student</th>
                  <th className="px-3 py-2 font-medium">Papers</th>
                  <th className="px-3 py-2 font-medium">Handed in</th>
                  <th className="px-3 py-2 font-medium">Self-marked</th>
                  <th className="px-3 py-2 font-medium">Weakest topic</th>
                  <th className="px-3 py-2 font-medium">Last revised</th>
                  <th className="py-2 pl-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => {
                  const activity = activityOf(r.last_active);
                  const score = percent(r.marks_awarded, r.marks_available);
                  const weak = weakestTopic(r);
                  return (
                    <tr key={r.student_id}>
                      <td className="py-2 pr-3 font-medium">
                        {nameOf.get(r.student_id) ?? "Student"}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{r.papers_made}</td>
                      <td className="px-3 py-2 tabular-nums">{r.papers_handed_in}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {score === null ? "-" : `${score}%`}
                      </td>
                      <td className="px-3 py-2">
                        {weak ? `${topicLabel(weak.topic)} (${weak.percent}%)` : "-"}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{lastRevised(r.last_active)}</td>
                      <td className="py-2 pl-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTIVITY_STYLE[activity]}`}
                        >
                          {ACTIVITY_LABEL[activity]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Scores are the students' own marking, so treat them as a guide. "Weakest topic" needs at
            least a few marks' worth of answers before it appears.
          </p>
        </>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
