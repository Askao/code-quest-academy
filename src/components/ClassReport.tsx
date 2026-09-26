import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  assessmentMatrixRows,
  classSummary,
  EMPTY_REPORT_DATA,
  overallRows,
  questionLevelRows,
  studentReport,
  type ReportData,
  type ReportHomework,
  type ReportStudent,
  type StudentReport,
} from "@/lib/class-report";
import { downloadCsv } from "@/lib/csv";
import { levelFromXp, topicLabel } from "@/lib/game";
import { BAND_LABEL, bandFor, type Band } from "@/lib/results-analysis";
import { fetchQuestions, sb, type BankQuestion } from "@/lib/assessments-db";

// ------------------------------------------------------------ data

const PAGE = 1000;

async function pagedIn<T>(
  table: string,
  select: string,
  column: string,
  ids: string[],
): Promise<T[]> {
  const out: T[] = [];
  // 100 ids per request keeps the URL short; each request is paged past
  // PostgREST's 1000-row default so a big class can't be silently truncated.
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await sb
        .from(table)
        .select(select)
        .in(column, chunk)
        .range(from, from + PAGE - 1);
      if (error) throw new Error(error.message);
      out.push(...((data ?? []) as T[]));
      if ((data ?? []).length < PAGE) break;
    }
  }
  return out;
}

/**
 * Everything about a class's assessments the report needs. If the
 * assessment tables aren't there (or anything else fails) this resolves to
 * "no assessments" instead of throwing, so the report still shows practice
 * and homework rather than an error.
 */
function useClassAssessmentData(classId: string) {
  return useQuery({
    queryKey: ["class-report-data", classId],
    staleTime: 30_000,
    retry: false,
    queryFn: async (): Promise<ReportData> => {
      try {
        const { data: rows, error } = await sb
          .from("assessments")
          .select("id, title, board, time_limit_minutes, closes_at, results_released, created_at")
          .eq("class_id", classId);
        if (error) throw new Error(error.message);
        const assessments = (rows ?? []) as Omit<ReportData["assessments"][number], "items">[];
        if (assessments.length === 0) return EMPTY_REPORT_DATA;
        const ids = assessments.map((a) => a.id);

        const [items, attempts] = await Promise.all([
          pagedIn<{ assessment_id: string; position: number; question_id: string }>(
            "assessment_items",
            "assessment_id, position, question_id",
            "assessment_id",
            ids,
          ),
          pagedIn<ReportData["attempts"][number]>(
            "assessment_attempts",
            "id, assessment_id, student_id, started_at, submitted_at, marked_at",
            "assessment_id",
            ids,
          ),
        ]);
        const questionIds = [...new Set(items.map((i) => i.question_id))];
        const questions: BankQuestion[] = [];
        for (let i = 0; i < questionIds.length; i += 100) {
          questions.push(...(await fetchQuestions(questionIds.slice(i, i + 100))));
        }
        const answers = await pagedIn<ReportData["answers"][number]>(
          "assessment_answers",
          "attempt_id, question_id, marks_awarded, teacher_comment",
          "attempt_id",
          attempts.map((a) => a.id),
        );
        return {
          assessments: assessments.map((a) => ({
            ...a,
            items: items
              .filter((i) => i.assessment_id === a.id)
              .sort((x, y) => x.position - y.position)
              .map((i) => i.question_id),
          })),
          questions: Object.fromEntries(
            questions.map((q) => [
              q.id,
              {
                id: q.id,
                topic: q.topic,
                ability: q.ability,
                marks: q.marks,
                question: q.question,
              },
            ]),
          ),
          attempts,
          answers,
        };
      } catch {
        return EMPTY_REPORT_DATA;
      }
    },
  });
}

// ------------------------------------------------------------ small pieces

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

function Bar({ percent, band, label }: { percent: number; band: Band; label: string }) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-secondary"
      role="img"
      aria-label={`${label}: ${percent}%`}
    >
      <div className={`h-full ${BAND_BAR[band]}`} style={{ width: `${Math.max(percent, 2)}%` }} />
    </div>
  );
}

function Tile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string | undefined;
  tone?: Band | null;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${tone ? BAND_TEXT[tone] : ""}`}>{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

const STATUS_STYLE = {
  not_started: "bg-secondary text-muted-foreground",
  writing: "bg-warning/15 text-warning",
  handed_in: "bg-primary/15 text-primary",
  marked: "bg-success/15 text-success",
} as const;
const STATUS_LABEL = {
  not_started: "Not started",
  writing: "Writing",
  handed_in: "To mark",
  marked: "Marked",
} as const;

const fmtDay = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-GB") : "Not started";

const today = () => new Date().toISOString().slice(0, 10);

// ------------------------------------------------------------ the report

export type ClassReportProps = {
  classId: string;
  className: string;
  track: string;
  students: ReportStudent[];
  homework: ReportHomework[];
  /** The class's practice strength per topic, as the old Overview showed it. */
  practiceByTopic: {
    key: string;
    label: string;
    avgPercent: number | null;
    strugglingCount: number;
  }[];
};

export function ClassReport({
  classId,
  className,
  track,
  students,
  homework,
  practiceByTopic,
}: ClassReportProps) {
  const { data: assessmentData = EMPTY_REPORT_DATA } = useClassAssessmentData(classId);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const now = useMemo(() => new Date(), []);
  const summary = useMemo(
    () => classSummary(students, assessmentData, homework, track, now),
    [students, assessmentData, homework, track, now],
  );
  const reports = useMemo(
    () =>
      new Map(
        students.map((s) => [
          s.id,
          studentReport(s, assessmentData, homework, track, now, topicLabel),
        ]),
      ),
    [students, assessmentData, homework, track, now],
  );

  const toggle = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const selectedStudents = students.filter((s) => selected.has(s.id));
  const visible = students.filter((s) =>
    s.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const focusStudent = (id: string) => {
    setSelected((cur) => new Set(cur).add(id));
    setTimeout(
      () =>
        document
          .getElementById(`report-${id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      60,
    );
  };

  return (
    <section className="space-y-6 pt-4" id="class-report">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Class report</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            How {className} is getting on across assessments, homework and practice - then pick any
            students below to see exactly where each one is doing well and where to help.
          </p>
        </div>
      </div>

      <ClassSummaryBox
        summary={summary}
        practiceByTopic={practiceByTopic}
        onPickStudent={focusStudent}
      />

      <ExportBar
        className={className}
        track={track}
        students={students}
        selected={selectedStudents}
        data={assessmentData}
        homework={homework}
        now={now}
      />

      <div className="panel space-y-4 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Look at individual students</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Tick one or more students. {selected.size > 0 ? `${selected.size} selected.` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setSelected(new Set(students.map((s) => s.id)))}
            >
              Select everyone
            </Button>
            {summary.watchList.length > 0 ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelected(new Set(summary.watchList.map((w) => w.studentId)))}
              >
                Select those needing attention ({summary.watchList.length})
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setSelected(new Set())}
              disabled={selected.size === 0}
            >
              Clear
            </Button>
          </div>
        </div>

        {students.length > 12 ? (
          <Input
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search students"
          />
        ) : null}

        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">No students in this class yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Students">
            {visible.map((s) => {
              const on = selected.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(s.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    on
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {on ? "✓ " : ""}
                  {s.name}
                </button>
              );
            })}
            {visible.length === 0 ? (
              <p className="text-sm text-muted-foreground">No student matches "{search}".</p>
            ) : null}
          </div>
        )}
      </div>

      {selectedStudents.length === 0 && students.length > 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Choose a student above to see their assessments, the topics they are struggling with, and
          where they need to improve.
        </div>
      ) : null}

      {selectedStudents.length > 1 ? (
        <SelectionSummary reports={selectedStudents.map((s) => reports.get(s.id)!)} />
      ) : null}

      {selectedStudents.map((s) => (
        <StudentCard
          key={s.id}
          report={reports.get(s.id)!}
          defaultOpen={selectedStudents.length <= 3}
          onClose={() => toggle(s.id)}
        />
      ))}
    </section>
  );
}

// ------------------------------------------------------------ class summary

function ClassSummaryBox({
  summary,
  practiceByTopic,
  onPickStudent,
}: {
  summary: ReturnType<typeof classSummary>;
  practiceByTopic: ClassReportProps["practiceByTopic"];
  onPickStudent: (id: string) => void;
}) {
  const a = summary.assessments;
  // One row per topic, drawing on assessments AND practice, weakest first.
  const topicRows = useMemo(() => {
    const keys = new Set([
      ...summary.topics.map((t) => t.topic),
      ...practiceByTopic.filter((t) => t.avgPercent !== null).map((t) => t.key),
    ]);
    return [...keys]
      .map((key) => {
        const t = summary.topics.find((x) => x.topic === key);
        const p = practiceByTopic.find((x) => x.key === key);
        const lead = t ? t.percent : (p?.avgPercent ?? 0);
        return {
          key,
          assessmentPercent: t ? t.percent : null,
          assessmentBelow: t?.studentsBelow50 ?? 0,
          practicePercent: p?.avgPercent ?? null,
          practiceStruggling: p?.strugglingCount ?? 0,
          lead,
        };
      })
      .sort((x, y) => x.lead - y.lead || topicLabel(x.key).localeCompare(topicLabel(y.key)));
  }, [summary.topics, practiceByTopic]);

  return (
    <div className="panel space-y-6 p-5">
      <div>
        <h3 className="text-lg font-semibold">The whole class at a glance</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="Assessments"
          value={a.percent === null ? "—" : `${a.percent}%`}
          sub={
            a.percent === null
              ? "Nothing marked yet"
              : `${a.earned}/${a.available} marks · ${a.markedAttempts} marked`
          }
          tone={a.band}
        />
        <Tile
          label="Homework done"
          value={summary.homework.percent === null ? "—" : `${summary.homework.percent}%`}
          sub={
            summary.homework.percent === null
              ? "None set yet"
              : `${summary.homework.done}/${summary.homework.total} tasks`
          }
          tone={summary.homework.percent === null ? null : bandFor(summary.homework.percent)}
        />
        <Tile
          label="Struggling"
          value={String(summary.struggling)}
          sub={`of ${summary.students} student${summary.students === 1 ? "" : "s"} in practice`}
          tone={summary.struggling > 0 ? "needs_work" : "strong"}
        />
        <Tile
          label="Ready for more"
          value={String(summary.readyForMore)}
          sub="cleared their practice tasks"
        />
      </div>

      {topicRows.length > 0 ? (
        <div>
          <h4 className="font-semibold">Strength by topic</h4>
          <p className="mb-3 text-xs text-muted-foreground">
            Weakest first - the top of this list is what to re-teach.
          </p>
          <ul className="space-y-4">
            {topicRows.map((t) => (
              <li key={t.key}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{topicLabel(t.key)}</span>
                  <span className="flex flex-wrap gap-x-3 font-mono text-xs text-muted-foreground">
                    {t.assessmentBelow > 0 ? (
                      <span className="text-destructive">
                        {t.assessmentBelow} below 50% in assessments
                      </span>
                    ) : null}
                    {t.practiceStruggling > 0 ? (
                      <span className="text-destructive">
                        🔴 {t.practiceStruggling} struggling in practice
                      </span>
                    ) : null}
                  </span>
                </div>
                <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 sm:gap-4">
                  <div>
                    <p className="mb-0.5 flex justify-between text-xs text-muted-foreground">
                      <span>Assessments</span>
                      <span className="font-mono">
                        {t.assessmentPercent === null ? "not assessed" : `${t.assessmentPercent}%`}
                      </span>
                    </p>
                    {t.assessmentPercent !== null ? (
                      <Bar
                        percent={t.assessmentPercent}
                        band={bandFor(t.assessmentPercent)}
                        label={`${topicLabel(t.key)} assessments`}
                      />
                    ) : (
                      <div className="h-2 w-full rounded-full bg-secondary/50" />
                    )}
                  </div>
                  <div>
                    <p className="mb-0.5 flex justify-between text-xs text-muted-foreground">
                      <span>Practice (average skill)</span>
                      <span className="font-mono">
                        {t.practicePercent === null ? "no practice yet" : `${t.practicePercent}%`}
                      </span>
                    </p>
                    {t.practicePercent !== null ? (
                      <Bar
                        percent={t.practicePercent}
                        band={bandFor(t.practicePercent)}
                        label={`${topicLabel(t.key)} practice`}
                      />
                    ) : (
                      <div className="h-2 w-full rounded-full bg-secondary/50" />
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {a.list.length > 0 ? (
        <div>
          <h4 className="mb-2 font-semibold">Assessments</h4>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {a.list.map((x) => (
              <li
                key={x.assessmentId}
                className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium">{x.title}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {x.marked} marked
                    {x.waitingToMark > 0 ? ` · ${x.waitingToMark} to mark` : ""}
                    {x.writing > 0 ? ` · ${x.writing} writing` : ""}
                    {x.notStarted > 0 ? ` · ${x.notStarted} not started` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {x.avgPercent !== null ? (
                    <span className="text-right">
                      <span
                        className={`font-mono text-sm font-semibold ${BAND_TEXT[bandFor(x.avgPercent)]}`}
                      >
                        {x.avgPercent}% average
                      </span>
                      <span className="block font-mono text-xs text-muted-foreground">
                        {x.lowestPercent}% – {x.highestPercent}%
                      </span>
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-muted-foreground">nothing marked</span>
                  )}
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/mark/$assessmentId" params={{ assessmentId: x.assessmentId }}>
                      {x.waitingToMark > 0 ? "Mark" : "Open"}
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary.mostMissed.length > 0 ? (
        <div>
          <h4 className="font-semibold">Where the class needs to improve</h4>
          <p className="mb-2 text-xs text-muted-foreground">
            The questions the class found hardest.
          </p>
          <ul className="space-y-2">
            {summary.mostMissed.map((m) => (
              <li key={m.questionId} className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium">{m.label}</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {topicLabel(m.topic)} · {m.fullMarks} of {m.answered} got full marks ·{" "}
                  <span className={BAND_TEXT[bandFor(m.avgPercent)]}>{m.avgPercent}% average</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h4 className="font-semibold">Students to talk to</h4>
        {summary.watchList.length === 0 ? (
          <p className="mt-1 text-sm text-success">✓ Nobody is flagged right now.</p>
        ) : (
          <>
            <p className="mb-2 text-xs text-muted-foreground">
              Click a name to open their report below.
            </p>
            <ul className="space-y-2">
              {summary.watchList.map((w) => (
                <li key={w.studentId} className="flex flex-wrap items-center gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => onPickStudent(w.studentId)}
                    className="font-medium text-primary hover:underline"
                  >
                    {w.name}
                  </button>
                  {w.reasons.map((r) => (
                    <span
                      key={r}
                      className="rounded-full bg-destructive/10 px-2 py-0.5 font-mono text-xs text-destructive"
                    >
                      {r}
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ export

function ExportBar({
  className,
  track,
  students,
  selected,
  data,
  homework,
  now,
}: {
  className: string;
  track: string;
  students: ReportStudent[];
  selected: ReportStudent[];
  data: ReportData;
  homework: ReportHomework[];
  now: Date;
}) {
  const [scope, setScope] = useState<"class" | "selected">("class");
  const useSelected = scope === "selected" && selected.length > 0;
  const who = useSelected ? selected : students;
  const stamp = today();
  const base = className.replace(/[^\w-]+/g, "_");

  const go = (label: string, suffix: string, rows: string[][]) => {
    if (who.length === 0) return void toast.error("There are no students to export");
    downloadCsv(`${base}-${suffix}-${stamp}.csv`, rows);
    toast.success(`${label} downloaded (${who.length} student${who.length === 1 ? "" : "s"})`);
  };

  const options: { label: string; suffix: string; what: string; rows: () => string[][] }[] = [
    {
      label: "Assessment marks",
      suffix: "assessment-marks",
      what: "One row per student, one column per assessment, with their totals.",
      rows: () => assessmentMatrixRows(who, data, now),
    },
    {
      label: "Question-by-question detail",
      suffix: "assessment-questions",
      what: "One row per student per question: topic, marks and your comments.",
      rows: () => questionLevelRows(who, data, topicLabel),
    },
    {
      label: "Overall class data",
      suffix: "overall",
      what: "One row per student: practice, homework, assessments and flags.",
      rows: () => overallRows(who, data, homework, track, topicLabel, now),
    },
  ];

  return (
    <div className="panel space-y-3 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Download as a spreadsheet</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Opens in Excel or Google Sheets. Choose who to include, then what.
          </p>
        </div>
        <div
          className="flex overflow-hidden rounded-md border border-border text-sm"
          role="group"
          aria-label="Who to include"
        >
          <button
            type="button"
            onClick={() => setScope("class")}
            className={`px-3 py-1.5 ${scope === "class" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
          >
            Whole class ({students.length})
          </button>
          <button
            type="button"
            onClick={() => setScope("selected")}
            disabled={selected.length === 0}
            title={selected.length === 0 ? "Tick some students below first" : undefined}
            className={`px-3 py-1.5 disabled:opacity-40 ${scope === "selected" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
          >
            Selected students ({selected.length})
          </button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {options.map((o) => (
          <div
            key={o.suffix}
            className="flex flex-col justify-between gap-3 rounded-lg border border-border p-4"
          >
            <div>
              <p className="font-medium">{o.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{o.what}</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => go(o.label, o.suffix, o.rows())}
              disabled={who.length === 0}
            >
              ⬇ Download CSV
            </Button>
          </div>
        ))}
      </div>
      {scope === "selected" && selected.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Tick some students below to export just them.
        </p>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------ selected students

function SelectionSummary({ reports }: { reports: StudentReport[] }) {
  const marked = reports.filter((r) => r.analysis.overall.assessments > 0);
  const earned = marked.reduce((s, r) => s + r.analysis.overall.earned, 0);
  const available = marked.reduce((s, r) => s + r.analysis.overall.available, 0);
  const pct = available > 0 ? Math.round((earned / available) * 100) : null;
  const hwDone = reports.reduce((s, r) => s + r.homework.done, 0);
  const hwTotal = reports.reduce((s, r) => s + r.homework.total, 0);
  // Topics the selected students are weakest in, together.
  const byTopic = new Map<string, { earned: number; available: number }>();
  for (const r of reports) {
    for (const t of r.analysis.topics) {
      const e = byTopic.get(t.topic) ?? { earned: 0, available: 0 };
      e.earned += t.earned;
      e.available += t.available;
      byTopic.set(t.topic, e);
    }
  }
  const weak = [...byTopic.entries()]
    .map(([topic, e]) => ({
      topic,
      percent: e.available ? Math.round((e.earned / e.available) * 100) : 0,
    }))
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 3);

  return (
    <div className="panel space-y-3 border-primary/40 p-5">
      <h3 className="text-lg font-semibold">The {reports.length} selected students together</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile
          label="Assessments"
          value={pct === null ? "—" : `${pct}%`}
          sub={pct === null ? "Nothing marked yet" : `${earned}/${available} marks`}
          tone={pct === null ? null : bandFor(pct)}
        />
        <Tile
          label="Homework done"
          value={hwTotal > 0 ? `${Math.round((hwDone / hwTotal) * 100)}%` : "—"}
          sub={hwTotal > 0 ? `${hwDone}/${hwTotal} tasks` : "None set"}
          tone={hwTotal > 0 ? bandFor(Math.round((hwDone / hwTotal) * 100)) : null}
        />
        <Tile
          label="Weakest topics"
          value={weak.length ? topicLabel(weak[0]!.topic) : "—"}
          sub={
            weak.length > 1
              ? `then ${weak
                  .slice(1)
                  .map((w) => topicLabel(w.topic))
                  .join(", ")}`
              : undefined
          }
        />
      </div>
    </div>
  );
}

function StudentCard({
  report,
  defaultOpen,
  onClose,
}: {
  report: StudentReport;
  defaultOpen: boolean;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [showAll, setShowAll] = useState(false);
  const { student: s, analysis, rows, topics, homework, counts } = report;
  const revisit = showAll ? analysis.revisit : analysis.revisit.slice(0, 5);

  return (
    <article id={`report-${s.id}`} className="panel scroll-mt-4 space-y-5 p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="min-w-0 text-left"
          aria-expanded={open}
        >
          <h3 className="text-xl font-semibold">
            <span className="mr-1 text-muted-foreground">{open ? "▼" : "▶"}</span>
            {s.name}
            {s.struggling ? (
              <span className="ml-2 rounded-full bg-destructive/15 px-2 py-0.5 font-mono text-xs font-normal text-destructive">
                🔴 Struggling
              </span>
            ) : null}
            {s.readyForMore ? (
              <span className="ml-2 rounded-full bg-warning/15 px-2 py-0.5 font-mono text-xs font-normal text-warning">
                🟡 Ready for more
              </span>
            ) : null}
          </h3>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            Level {levelFromXp(s.xp).level} · {s.xp} XP · last active {fmtDay(s.lastActive)}
          </p>
        </button>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p
              className={`text-2xl font-semibold ${analysis.overall.assessments ? BAND_TEXT[analysis.overall.band] : "text-muted-foreground"}`}
            >
              {analysis.overall.assessments ? `${analysis.overall.percent}%` : "—"}
            </p>
            <p className="font-mono text-xs text-muted-foreground">assessments</p>
          </div>
          <div className="text-right">
            <p
              className={`text-2xl font-semibold ${homework.percent !== null ? BAND_TEXT[bandFor(homework.percent)] : "text-muted-foreground"}`}
            >
              {homework.percent !== null ? `${homework.percent}%` : "—"}
            </p>
            <p className="font-mono text-xs text-muted-foreground">homework</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            aria-label={`Remove ${s.name} from the report`}
          >
            ✕
          </Button>
        </div>
      </header>

      {open ? (
        <>
          <div className="rounded-lg bg-secondary/40 p-4">
            <p className="mb-1.5 font-mono text-xs tracking-wide text-muted-foreground uppercase">
              In a nutshell
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {report.summary.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 font-semibold">Assessments</h4>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No assessments have been set for this class.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border text-sm">
                {rows.map((r) => (
                  <li
                    key={r.assessmentId}
                    className="flex flex-wrap items-center justify-between gap-2 p-3"
                  >
                    <span className="min-w-0 font-medium">{r.title}</span>
                    <span className="flex items-center gap-3">
                      {r.percent !== null ? (
                        <span className={`font-mono text-xs ${BAND_TEXT[r.band!]}`}>
                          {r.earned}/{r.available} · {r.percent}%
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[0.68rem] ${STATUS_STYLE[r.status]}`}
                      >
                        {r.status === "not_started" && r.closed ? "Missed" : STATUS_LABEL[r.status]}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {counts.waitingToMark > 0 ? (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {counts.waitingToMark} handed in and waiting for you to mark.
              </p>
            ) : null}
          </div>

          <div>
            <h4 className="font-semibold">Topics</h4>
            <p className="mb-3 text-xs text-muted-foreground">
              Weakest first. Assessment results lead where there are any, otherwise practice.
            </p>
            {topics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No topic evidence yet - nothing marked and no practice done.
              </p>
            ) : (
              <ul className="space-y-3">
                {topics.map((t) => (
                  <li key={t.topic}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium">{topicLabel(t.topic)}</span>
                      <span className={`font-mono text-xs ${BAND_TEXT[t.band]}`}>
                        {BAND_LABEL[t.band]}
                      </span>
                    </div>
                    <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 sm:gap-4">
                      <div>
                        <p className="mb-0.5 flex justify-between text-xs text-muted-foreground">
                          <span>Assessments</span>
                          <span className="font-mono">
                            {t.assessmentPercent === null
                              ? "not assessed"
                              : `${t.assessmentEarned}/${t.assessmentAvailable} · ${t.assessmentPercent}%`}
                          </span>
                        </p>
                        {t.assessmentPercent !== null ? (
                          <Bar
                            percent={t.assessmentPercent}
                            band={bandFor(t.assessmentPercent)}
                            label={`${topicLabel(t.topic)} assessments`}
                          />
                        ) : (
                          <div className="h-2 w-full rounded-full bg-secondary/50" />
                        )}
                      </div>
                      <div>
                        <p className="mb-0.5 flex justify-between text-xs text-muted-foreground">
                          <span>Practice</span>
                          <span className="font-mono">
                            {t.practicePercent === null ? "none yet" : `${t.practicePercent}%`}
                          </span>
                        </p>
                        {t.practicePercent !== null ? (
                          <Bar
                            percent={t.practicePercent}
                            band={bandFor(t.practicePercent)}
                            label={`${topicLabel(t.topic)} practice`}
                          />
                        ) : (
                          <div className="h-2 w-full rounded-full bg-secondary/50" />
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="font-semibold">Where to improve</h4>
            {revisit.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {analysis.overall.assessments === 0
                  ? "Nothing marked yet, so there are no questions to point to."
                  : "✓ Full marks on every marked question."}
              </p>
            ) : (
              <>
                <p className="mb-2 text-xs text-muted-foreground">
                  Questions that lost the most marks first.
                </p>
                <ul className="space-y-2">
                  {revisit.map((q) => (
                    <li
                      key={`${q.assessmentId}-${q.questionId}`}
                      className="rounded-lg border border-border p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{q.label}</p>
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                            {topicLabel(q.topic)} · {q.assessmentTitle}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full bg-secondary px-2.5 py-0.5 font-mono text-xs ${q.earned === 0 ? "text-destructive" : "text-warning"}`}
                        >
                          {q.earned}/{q.marks}
                        </span>
                      </div>
                      {q.comment ? (
                        <p className="mt-2 rounded-md border border-primary/30 bg-primary/5 p-2 text-xs">
                          <span className="font-medium">Your comment: </span>
                          {q.comment}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {analysis.revisit.length > 5 ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={() => setShowAll((v) => !v)}
                  >
                    {showAll ? "Show fewer" : `Show all ${analysis.revisit.length}`}
                  </Button>
                ) : null}
              </>
            )}
          </div>

          {homework.items.length > 0 ? (
            <div>
              <h4 className="mb-2 font-semibold">Homework</h4>
              <ul className="divide-y divide-border rounded-lg border border-border text-sm">
                {homework.items.map((h, i) => (
                  <li key={i} className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <span className="min-w-0 font-medium">{h.title}</span>
                    <span className="flex items-center gap-3 font-mono text-xs">
                      <span
                        className={
                          h.total > 0 && h.done === h.total
                            ? "text-success"
                            : "text-muted-foreground"
                        }
                      >
                        {h.done}/{h.total} done
                      </span>
                      {h.overdue ? (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">
                          overdue
                        </span>
                      ) : null}
                      {h.dueAt ? (
                        <span className="text-muted-foreground">due {fmtDay(h.dueAt)}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </article>
  );
}
