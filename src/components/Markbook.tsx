import { useMemo, useState } from "react";
import { useClassAssessmentData } from "@/components/ClassReport";
import { EMPTY_REPORT_DATA, studentReport, type ReportHomework, type ReportStudent } from "@/lib/class-report";
import { downloadCsv } from "@/lib/csv";
import { topicLabel, topicsFor, type Board, type TrackKey } from "@/lib/game";
import { strugglingTooltip } from "@/lib/flags";

/**
 * The Stage 3 markbook: students by topic, in one grid, instead of skill
 * level, homework, assessments and revision living on four separate pages.
 * Nothing here is new data - it's the same numbers class-report.ts and
 * ClassReport already compute, laid out so a teacher can scan for who's
 * weakest where at a glance, and sort on it.
 */
export function Markbook({
  classId,
  track,
  board,
  students,
  homework,
}: {
  classId: string;
  track: TrackKey;
  board: Board;
  students: ReportStudent[];
  homework: ReportHomework[];
}) {
  const { data: assessmentData = EMPTY_REPORT_DATA } = useClassAssessmentData(classId);
  const [sortWeakest, setSortWeakest] = useState(false);
  const now = useMemo(() => new Date(), []);

  const topics = useMemo(() => topicsFor(track, board), [track, board]);

  const rows = useMemo(() => {
    return students.map((s) => {
      const levels = topics.map((t) => {
        const raw = s.skills.find((k) => k.topic === t.key && k.track === track)?.level;
        return raw === undefined ? null : Number(raw);
      });
      const report = studentReport(s, assessmentData, homework, track, now);
      const withData = levels.filter((l): l is number => l !== null);
      return {
        student: s,
        levels,
        weakest: withData.length ? Math.min(...withData) : null,
        assessPercent: report.analysis.overall.percent,
        homeworkPercent: report.homework.total > 0 ? report.homework.percent : null,
      };
    });
  }, [students, topics, track, assessmentData, homework, now]);

  const sorted = useMemo(() => {
    if (!sortWeakest) return rows;
    return [...rows].sort((a, b) => (a.weakest ?? 99) - (b.weakest ?? 99));
  }, [rows, sortWeakest]);

  const exportCsv = () => {
    const header = [
      "Student",
      ...topics.map((t) => t.label),
      "Assessment %",
      "Homework %",
      "Struggling",
      "Ready for more",
      "Last active",
    ];
    const body = sorted.map((r) => [
      r.student.name,
      ...r.levels.map((l) => (l === null ? "" : String(l))),
      r.assessPercent === null ? "" : String(r.assessPercent),
      r.homeworkPercent === null ? "" : String(r.homeworkPercent),
      r.student.struggling ? "Yes" : "No",
      r.student.readyForMore ? "Yes" : "No",
      r.student.lastActive ? new Date(r.student.lastActive).toLocaleDateString("en-GB") : "",
    ]);
    downloadCsv("markbook.csv", [header, ...body]);
  };

  if (students.length === 0) {
    return (
      <section className="panel space-y-2 p-5">
        <h2 className="text-lg font-semibold">Markbook</h2>
        <p className="text-sm text-muted-foreground">No students in this class yet.</p>
      </section>
    );
  }

  return (
    <section className="panel space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Markbook</h2>
          <p className="text-sm text-muted-foreground">
            Skill level per topic (1 to 5), plus assessment and homework percentages, in one grid.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSortWeakest((v) => !v)}
            className={`rounded-md border px-3 py-1.5 font-mono text-xs ${
              sortWeakest
                ? "border-primary bg-secondary text-foreground"
                : "border-border text-muted-foreground"
            }`}
          >
            ↓ Sort: weakest topic
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-md border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" style={{ minWidth: `${420 + topics.length * 56}px` }}>
          <thead className="text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="py-2 pr-3 font-medium">Student</th>
              {topics.map((t) => (
                <th key={t.key} className="px-1 py-2 text-center font-medium" title={t.label}>
                  {abbreviate(t.label)}
                </th>
              ))}
              <th className="px-3 py-2 text-center font-medium">Assess.</th>
              <th className="px-3 py-2 text-center font-medium">HW</th>
              <th className="px-3 py-2 text-center font-medium">Flags</th>
              <th className="py-2 pl-3 font-medium">Last active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((r) => (
              <tr key={r.student.id}>
                <td className="py-2 pr-3 font-medium">{r.student.name}</td>
                {r.levels.map((level, i) => (
                  <td key={topics[i]!.key} className="px-1 py-2 text-center">
                    <LevelChip level={level} />
                  </td>
                ))}
                <td className="px-3 py-2 text-center tabular-nums">
                  {r.assessPercent === null ? "-" : `${r.assessPercent}%`}
                </td>
                <td className="px-3 py-2 text-center tabular-nums">
                  {r.homeworkPercent === null ? "-" : `${r.homeworkPercent}%`}
                </td>
                <td className="px-3 py-2 text-center text-sm">
                  {r.student.struggling ? (
                    <span title={strugglingTooltip(r.student.strugglingTopics, topicLabel)}>🔴</span>
                  ) : null}
                  {r.student.readyForMore ? <span title="Ready for more">🟡</span> : null}
                  {!r.student.struggling && !r.student.readyForMore ? (
                    <span className="text-muted-foreground">—</span>
                  ) : null}
                </td>
                <td className="py-2 pl-3 tabular-nums text-muted-foreground">
                  {r.student.lastActive
                    ? new Date(r.student.lastActive).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Skill level: 1 (new to the topic) to 5 (confident). A blank cell means no attempt yet.
      </p>
    </section>
  );
}

function LevelChip({ level }: { level: number | null }) {
  if (level === null) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }
  const rounded = Math.max(1, Math.min(5, Math.round(level)));
  const opacity = [0, 12, 28, 46, 66, 88][rounded];
  return (
    <span
      className="mx-auto flex h-5 w-6 items-center justify-center rounded font-mono text-xs font-semibold"
      style={{ background: `hsl(var(--primary) / ${opacity}%)` }}
    >
      {rounded}
    </span>
  );
}

/** Short column headers for topic keys, so eight-plus topics fit without the
 * grid needing to scroll on a laptop screen. Falls back to the first four
 * letters for anything not called out here. */
function abbreviate(label: string): string {
  const known: Record<string, string> = {
    "Getting started": "Start",
    "Data types & variables": "Types",
    Sequencing: "Seq",
    Selection: "Sel",
    Iteration: "Iter",
    "Combining techniques": "Comb",
    "Lists & arrays": "Lists",
    Strings: "Str",
    Subprograms: "Subp",
    "File handling": "Files",
    "Searching & Sorting": "S&S",
    "Robust programs": "Robust",
    "Databases & SQL": "DB",
    "Capstone Projects": "Capst.",
    Recursion: "Recur",
    "Object-oriented": "OOP",
    Algorithms: "Algo",
    "Data structures": "Data",
  };
  return known[label] ?? label.slice(0, 4);
}
