/**
 * The teacher's class report: turns everything known about a class -
 * assessments, homework and practice - into a class summary, a per-student
 * analysis and the rows for the CSV exports. Pure (no Supabase/React) so the
 * maths is testable (class-report.test.ts); the report component only
 * gathers the data and displays what this returns.
 */
import { attemptStatus, type AttemptStatus } from "./assessments.ts";
import { levelFromXp, skillPercent } from "./game.ts";
import {
  analyseResults,
  bandFor,
  percentOf,
  questionLabel,
  type AnalysedAttempt,
  type Analysis,
  type Band,
  type TopicResult,
} from "./results-analysis.ts";

// ------------------------------------------------------------ input

export type ReportAssessment = {
  id: string;
  title: string;
  board: string;
  time_limit_minutes: number;
  closes_at: string | null;
  results_released: boolean;
  created_at: string;
  /** Question ids in paper order. */
  items: string[];
};

export type ReportQuestion = {
  id: string;
  topic: string;
  ability: 1 | 2 | 3;
  marks: number;
  question: string;
};

export type ReportAttempt = {
  id: string;
  assessment_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  marked_at: string | null;
};

export type ReportAnswer = {
  attempt_id: string;
  question_id: string;
  marks_awarded: number;
  teacher_comment: string;
};

export type ReportData = {
  assessments: ReportAssessment[];
  questions: Record<string, ReportQuestion>;
  attempts: ReportAttempt[];
  answers: ReportAnswer[];
};

export const EMPTY_REPORT_DATA: ReportData = {
  assessments: [],
  questions: {},
  attempts: [],
  answers: [],
};

export type ReportStudent = {
  id: string;
  name: string;
  xp: number;
  streak?: number;
  accuracy: number;
  avg: number;
  lastActive: string | null | undefined;
  struggling: boolean;
  readyForMore: boolean;
  skills: { topic: string; track: string; level: number | string }[];
  practiceTotals: { done: number; total: number };
  projectTotals: { done: number; total: number };
};

export type ReportHomework = {
  id: string;
  title: string;
  due_at: string | null;
  completion: { id: string; done: number; total: number }[];
};

const passed = (iso: string | null | undefined, now: Date) =>
  !!iso && now.getTime() > new Date(iso).getTime();

const earnedOn = (marks: number, awarded: number) => Math.max(0, Math.min(awarded, marks));

// ------------------------------------------------------------ per student

/** A student's marked attempts, in the shape analyseResults() understands
 * (a teacher sees marked work whether or not results have been released). */
export function markedAttemptsFor(studentId: string, data: ReportData): AnalysedAttempt[] {
  const byAssessment = new Map(data.assessments.map((a) => [a.id, a]));
  const out: AnalysedAttempt[] = [];
  for (const t of data.attempts) {
    if (t.student_id !== studentId || !t.marked_at) continue;
    const a = byAssessment.get(t.assessment_id);
    if (!a) continue;
    const answers = new Map(
      data.answers.filter((x) => x.attempt_id === t.id).map((x) => [x.question_id, x]),
    );
    const questions = a.items.flatMap((qid, i) => {
      const q = data.questions[qid];
      if (!q) return [];
      const ans = answers.get(qid);
      return [
        {
          position: i + 1,
          question_id: qid,
          topic: q.topic,
          ability: q.ability,
          marks: q.marks,
          marks_awarded: earnedOn(q.marks, ans?.marks_awarded ?? 0),
          question: q.question,
          comment: ans?.teacher_comment ?? "",
        },
      ];
    });
    out.push({
      assessment_id: a.id,
      title: a.title,
      board: a.board,
      marked_at: t.marked_at,
      total_marks: questions.reduce((s, q) => s + q.marks, 0),
      marks_awarded: questions.reduce((s, q) => s + q.marks_awarded, 0),
      questions,
    });
  }
  return out;
}

export type AssessmentRow = {
  assessmentId: string;
  title: string;
  status: AttemptStatus;
  /** Only known once the teacher has marked it. */
  earned: number | null;
  available: number;
  percent: number | null;
  band: Band | null;
  /** Whether the assessment's window has closed. */
  closed: boolean;
};

/** Every assessment set for the class, newest first, with this student's
 * standing in each. */
export function studentAssessmentRows(
  studentId: string,
  data: ReportData,
  now: Date = new Date(),
): AssessmentRow[] {
  const marked = new Map(markedAttemptsFor(studentId, data).map((a) => [a.assessment_id, a]));
  return [...data.assessments]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((a) => {
      const t = data.attempts.find((x) => x.assessment_id === a.id && x.student_id === studentId);
      const status = attemptStatus(
        t ? { startedAt: t.started_at, submittedAt: t.submitted_at, markedAt: t.marked_at } : null,
        a.time_limit_minutes,
        now,
      );
      const available = a.items.reduce((s, qid) => s + (data.questions[qid]?.marks ?? 0), 0);
      const m = marked.get(a.id);
      const earned = m ? m.marks_awarded : null;
      const percent = earned === null ? null : percentOf(earned, available);
      return {
        assessmentId: a.id,
        title: a.title,
        status,
        earned,
        available,
        percent,
        band: percent === null ? null : bandFor(percent),
        closed: passed(a.closes_at, now),
      };
    });
}

export type StudentHomework = {
  done: number;
  total: number;
  percent: number | null;
  overdueUnfinished: number;
  /** Overdue with less than half the tasks done - the ones worth a conversation. */
  overdueBehind: number;
  items: { title: string; done: number; total: number; dueAt: string | null; overdue: boolean }[];
};

export function studentHomework(
  studentId: string,
  homework: ReportHomework[],
  now: Date = new Date(),
): StudentHomework {
  const items = homework.flatMap((h) => {
    const c = h.completion.find((x) => x.id === studentId);
    if (!c) return [];
    return [
      {
        title: h.title,
        done: c.done,
        total: c.total,
        dueAt: h.due_at,
        overdue: passed(h.due_at, now) && c.total > 0 && c.done < c.total,
      },
    ];
  });
  const done = items.reduce((s, i) => s + i.done, 0);
  const total = items.reduce((s, i) => s + i.total, 0);
  return {
    done,
    total,
    percent: total > 0 ? percentOf(done, total) : null,
    overdueUnfinished: items.filter((i) => i.overdue).length,
    overdueBehind: items.filter((i) => i.overdue && i.done * 2 < i.total).length,
    items,
  };
}

export type TopicOverviewRow = {
  topic: string;
  assessmentPercent: number | null;
  assessmentEarned: number;
  assessmentAvailable: number;
  practicePercent: number | null;
  band: Band;
};

/**
 * One row per topic the student has any evidence for, weakest first. It
 * blends the two sources a teacher cares about: how they did on assessment
 * questions in the topic, and their practice skill level. The band (and so
 * the "needs work" call) follows the assessment result where there is one,
 * otherwise practice.
 */
export function topicOverview(
  assessmentTopics: TopicResult[],
  skills: ReportStudent["skills"],
  track: string,
): TopicOverviewRow[] {
  const topics = new Set<string>([
    ...assessmentTopics.map((t) => t.topic),
    ...skills.filter((k) => k.track === track).map((k) => k.topic),
  ]);
  const rows: TopicOverviewRow[] = [];
  for (const topic of topics) {
    const a = assessmentTopics.find((t) => t.topic === topic);
    const skill = skills.find((k) => k.topic === topic && k.track === track);
    const practicePercent = skill ? skillPercent(Number(skill.level)) : null;
    const lead = a ? a.percent : practicePercent;
    if (lead === null) continue;
    rows.push({
      topic,
      assessmentPercent: a ? a.percent : null,
      assessmentEarned: a?.earned ?? 0,
      assessmentAvailable: a?.available ?? 0,
      practicePercent,
      band: bandFor(lead),
    });
  }
  return rows.sort(
    (x, y) =>
      (x.assessmentPercent ?? x.practicePercent ?? 0) -
        (y.assessmentPercent ?? y.practicePercent ?? 0) || x.topic.localeCompare(y.topic),
  );
}

export type StudentReport = {
  student: ReportStudent;
  rows: AssessmentRow[];
  analysis: Analysis;
  topics: TopicOverviewRow[];
  homework: StudentHomework;
  counts: { marked: number; waitingToMark: number; writing: number; notStarted: number };
  summary: string[];
};

/** Plain-English bullets summarising one student. Written with the name, not
 * a pronoun, so it reads correctly for anyone. */
export function studentSummary(
  r: Omit<StudentReport, "summary">,
  topicLabel: (topic: string) => string = (t) => t,
): string[] {
  const out: string[] = [];
  const name = r.student.name;
  const { overall } = r.analysis;
  if (overall.assessments === 0) {
    out.push(
      r.counts.waitingToMark > 0
        ? `${name} has handed in ${r.counts.waitingToMark} assessment${r.counts.waitingToMark === 1 ? "" : "s"} that ${r.counts.waitingToMark === 1 ? "is" : "are"} waiting to be marked.`
        : `${name} has no marked assessments yet.`,
    );
  } else {
    out.push(
      `${name} has scored ${overall.earned}/${overall.available} (${overall.percent}%) across ${overall.assessments} marked assessment${overall.assessments === 1 ? "" : "s"}.`,
    );
  }
  const withAssessment = r.topics.filter((t) => t.assessmentPercent !== null);
  if (withAssessment.length > 0) {
    const weak = withAssessment.filter((t) => t.band === "needs_work").slice(0, 3);
    const strongest = [...withAssessment].sort(
      (a, b) => (b.assessmentPercent ?? 0) - (a.assessmentPercent ?? 0),
    )[0]!;
    if (weak.length > 0) {
      out.push(
        `Needs most help with: ${weak.map((t) => `${topicLabel(t.topic)} (${t.assessmentPercent}%)`).join(", ")}.`,
      );
    } else {
      out.push("No assessment topic is below 50%.");
    }
    if ((strongest.assessmentPercent ?? 0) >= 75) {
      out.push(`Strongest in ${topicLabel(strongest.topic)} (${strongest.assessmentPercent}%).`);
    }
  } else if (r.topics.some((t) => t.band === "needs_work")) {
    const weak = r.topics.filter((t) => t.band === "needs_work").slice(0, 3);
    out.push(
      `Practice suggests they need help with: ${weak.map((t) => `${topicLabel(t.topic)} (${t.practicePercent}%)`).join(", ")}.`,
    );
  }
  if (r.homework.total > 0) {
    out.push(
      `Homework: ${r.homework.done} of ${r.homework.total} tasks done (${r.homework.percent}%)` +
        (r.homework.overdueUnfinished > 0
          ? `, with ${r.homework.overdueUnfinished} overdue and unfinished.`
          : "."),
    );
  }
  if (r.student.struggling) out.push("Flagged as struggling in practice.");
  if (r.student.readyForMore) out.push("Has cleared the practice tasks - ready for more.");
  return out;
}

export function studentReport(
  student: ReportStudent,
  data: ReportData,
  homework: ReportHomework[],
  track: string,
  now: Date = new Date(),
  topicLabel: (topic: string) => string = (t) => t,
): StudentReport {
  const rows = studentAssessmentRows(student.id, data, now);
  const analysis = analyseResults(markedAttemptsFor(student.id, data));
  const count = (s: AttemptStatus) => rows.filter((r) => r.status === s).length;
  const base = {
    student,
    rows,
    analysis,
    topics: topicOverview(analysis.topics, student.skills, track),
    homework: studentHomework(student.id, homework, now),
    counts: {
      marked: count("marked"),
      waitingToMark: count("handed_in"),
      writing: count("writing"),
      notStarted: count("not_started"),
    },
  };
  return { ...base, summary: studentSummary(base, topicLabel) };
}

// ------------------------------------------------------------ whole class

export type ClassAssessmentSummary = {
  assessmentId: string;
  title: string;
  marked: number;
  waitingToMark: number;
  writing: number;
  notStarted: number;
  avgPercent: number | null;
  lowestPercent: number | null;
  highestPercent: number | null;
};

export type MostMissed = {
  questionId: string;
  topic: string;
  label: string;
  marks: number;
  /** How many marked answers, and how many got full marks. */
  answered: number;
  fullMarks: number;
  avgPercent: number;
};

export type WatchEntry = { studentId: string; name: string; reasons: string[] };

export type ClassSummary = {
  students: number;
  assessments: {
    earned: number;
    available: number;
    percent: number | null;
    band: Band | null;
    markedAttempts: number;
    list: ClassAssessmentSummary[];
  };
  topics: (TopicResult & { studentsBelow50: number; studentsWithData: number })[];
  mostMissed: MostMissed[];
  homework: { done: number; total: number; percent: number | null };
  struggling: number;
  readyForMore: number;
  watchList: WatchEntry[];
};

export function classSummary(
  students: ReportStudent[],
  data: ReportData,
  homework: ReportHomework[],
  track: string,
  now: Date = new Date(),
  mostMissedLimit = 5,
): ClassSummary {
  const reports = students.map((s) => studentReport(s, data, homework, track, now));

  // Assessments: totals, and one line per assessment.
  const allMarked = students.flatMap((s) => markedAttemptsFor(s.id, data));
  const overall = analyseResults(allMarked);
  const list: ClassAssessmentSummary[] = [...data.assessments]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((a) => {
      const rows = reports.map((r) => r.rows.find((x) => x.assessmentId === a.id)!).filter(Boolean);
      const pcts = rows.filter((x) => x.percent !== null).map((x) => x.percent as number);
      const n = (s: AttemptStatus) => rows.filter((x) => x.status === s).length;
      return {
        assessmentId: a.id,
        title: a.title,
        marked: n("marked"),
        waitingToMark: n("handed_in"),
        writing: n("writing"),
        notStarted: n("not_started"),
        avgPercent: pcts.length ? Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length) : null,
        lowestPercent: pcts.length ? Math.min(...pcts) : null,
        highestPercent: pcts.length ? Math.max(...pcts) : null,
      };
    });

  // Topics across the class, with how many individual students are below 50%.
  const topics = overall.topics.map((t) => {
    const per = reports
      .map((r) => r.analysis.topics.find((x) => x.topic === t.topic))
      .filter((x): x is TopicResult => !!x);
    return {
      ...t,
      studentsBelow50: per.filter((x) => x.percent < 50).length,
      studentsWithData: per.length,
    };
  });

  // Questions the class found hardest.
  const perQuestion = new Map<
    string,
    { topic: string; text: string; marks: number; answered: number; full: number; earned: number }
  >();
  for (const a of allMarked) {
    for (const q of a.questions) {
      const e = perQuestion.get(q.question_id) ?? {
        topic: q.topic,
        text: q.question,
        marks: q.marks,
        answered: 0,
        full: 0,
        earned: 0,
      };
      e.answered += 1;
      e.earned += q.marks_awarded;
      if (q.marks_awarded >= q.marks) e.full += 1;
      perQuestion.set(q.question_id, e);
    }
  }
  const minAnswered = Math.min(2, Math.max(1, reports.filter((r) => r.counts.marked > 0).length));
  const mostMissed = [...perQuestion.entries()]
    .filter(([, e]) => e.answered >= minAnswered && e.full < e.answered)
    .map<MostMissed>(([questionId, e]) => ({
      questionId,
      topic: e.topic,
      label: questionLabel(e.text),
      marks: e.marks,
      answered: e.answered,
      fullMarks: e.full,
      avgPercent: percentOf(e.earned, e.marks * e.answered),
    }))
    .sort((a, b) => a.avgPercent - b.avgPercent || b.answered - a.answered)
    .slice(0, mostMissedLimit);

  // Homework, class-wide.
  const hwDone = reports.reduce((s, r) => s + r.homework.done, 0);
  const hwTotal = reports.reduce((s, r) => s + r.homework.total, 0);

  // Who needs a conversation.
  const watchList: WatchEntry[] = reports
    .map((r) => {
      const reasons: string[] = [];
      if (r.analysis.overall.assessments > 0 && r.analysis.overall.percent < 50) {
        reasons.push(`Assessments: ${r.analysis.overall.percent}% overall`);
      }
      if (r.student.struggling) reasons.push("Struggling in practice");
      if (r.homework.overdueBehind > 0) {
        reasons.push(`Behind on ${r.homework.overdueBehind} overdue homework`);
      }
      const missed = r.rows.filter((x) => x.status === "not_started" && x.closed);
      if (missed.length > 0) {
        reasons.push(`Missed ${missed.length} assessment${missed.length === 1 ? "" : "s"}`);
      }
      return { studentId: r.student.id, name: r.student.name, reasons };
    })
    .filter((w) => w.reasons.length > 0)
    .sort((a, b) => b.reasons.length - a.reasons.length || a.name.localeCompare(b.name));

  return {
    students: students.length,
    assessments: {
      earned: overall.overall.earned,
      available: overall.overall.available,
      percent: overall.overall.assessments > 0 ? overall.overall.percent : null,
      band: overall.overall.assessments > 0 ? overall.overall.band : null,
      markedAttempts: overall.overall.assessments,
      list,
    },
    topics,
    mostMissed,
    homework: {
      done: hwDone,
      total: hwTotal,
      percent: hwTotal > 0 ? percentOf(hwDone, hwTotal) : null,
    },
    struggling: students.filter((s) => s.struggling).length,
    readyForMore: students.filter((s) => s.readyForMore).length,
    watchList,
  };
}

// ------------------------------------------------------------ exports

const date = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-GB") : "";

const STATUS_TEXT: Record<AttemptStatus, string> = {
  not_started: "Not started",
  writing: "Writing",
  handed_in: "Handed in (not marked)",
  marked: "Marked",
};

/** One row per student, one column per assessment: the marks if marked,
 * otherwise where they're up to. Ends with their overall total. */
export function assessmentMatrixRows(
  students: ReportStudent[],
  data: ReportData,
  now: Date = new Date(),
): string[][] {
  const ordered = [...data.assessments].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const header = [
    "Student",
    ...ordered.map(
      (a) =>
        `${a.title} (out of ${a.items.reduce((s, qid) => s + (data.questions[qid]?.marks ?? 0), 0)})`,
    ),
    "Total marks",
    "Total available",
    "Overall %",
  ];
  const rows = students.map((s) => {
    const byId = new Map(studentAssessmentRows(s.id, data, now).map((r) => [r.assessmentId, r]));
    let earned = 0;
    let available = 0;
    const cells = ordered.map((a) => {
      const r = byId.get(a.id)!;
      if (r.earned === null) return STATUS_TEXT[r.status];
      earned += r.earned;
      available += r.available;
      return String(r.earned);
    });
    return [
      s.name,
      ...cells,
      String(earned),
      String(available),
      available > 0 ? String(percentOf(earned, available)) : "",
    ];
  });
  return [header, ...rows];
}

/** One row per student per question - the detail behind the marks. */
export function questionLevelRows(
  students: ReportStudent[],
  data: ReportData,
  topicLabel: (topic: string) => string = (t) => t,
): string[][] {
  const header = [
    "Student",
    "Assessment",
    "Marked on",
    "Question no.",
    "Topic",
    "Question",
    "Marks available",
    "Marks awarded",
    "Teacher comment",
  ];
  const rows = students.flatMap((s) =>
    markedAttemptsFor(s.id, data).flatMap((a) =>
      a.questions.map((q) => [
        s.name,
        a.title,
        date(a.marked_at),
        String(q.position),
        topicLabel(q.topic),
        questionLabel(q.question, 200),
        String(q.marks),
        String(q.marks_awarded),
        q.comment,
      ]),
    ),
  );
  return [header, ...rows];
}

/** One row per student: everything about how they're getting on. */
export function overallRows(
  students: ReportStudent[],
  data: ReportData,
  homework: ReportHomework[],
  track: string,
  topicLabel: (topic: string) => string = (t) => t,
  now: Date = new Date(),
): string[][] {
  const reports = students.map((s) => studentReport(s, data, homework, track, now));
  const assessedTopics = [
    ...new Set(reports.flatMap((r) => r.analysis.topics.map((t) => t.topic))),
  ].sort((a, b) => topicLabel(a).localeCompare(topicLabel(b)));
  const header = [
    "Student",
    "Level",
    "XP",
    "Practice accuracy %",
    "Average skill %",
    "Practice tasks done",
    "Practice tasks total",
    "Projects done",
    "Projects total",
    "Last active",
    "Homework tasks done",
    "Homework tasks total",
    "Homework %",
    "Assessments marked",
    "Assessment marks",
    "Assessment marks available",
    "Assessment %",
    "Strongest topic (assessments)",
    "Weakest topic (assessments)",
    ...assessedTopics.map((t) => `${topicLabel(t)} (assessment %)`),
    "Flags",
  ];
  const rows = reports.map((r) => {
    const s = r.student;
    const withA = r.topics.filter((t) => t.assessmentPercent !== null);
    const weakest = withA[0];
    const strongest = withA.length ? withA[withA.length - 1] : undefined;
    const flags = [s.struggling ? "Struggling" : "", s.readyForMore ? "Ready for more" : ""]
      .filter(Boolean)
      .join("; ");
    const { overall } = r.analysis;
    return [
      s.name,
      String(levelFromXp(s.xp).level),
      String(s.xp),
      String(s.accuracy),
      String(skillPercent(s.avg)),
      String(s.practiceTotals.done),
      String(s.practiceTotals.total),
      String(s.projectTotals.done),
      String(s.projectTotals.total),
      s.lastActive ? date(s.lastActive) : "Not started",
      String(r.homework.done),
      String(r.homework.total),
      r.homework.percent === null ? "" : String(r.homework.percent),
      String(overall.assessments),
      overall.assessments ? String(overall.earned) : "",
      overall.assessments ? String(overall.available) : "",
      overall.assessments ? String(overall.percent) : "",
      strongest ? topicLabel(strongest.topic) : "",
      weakest ? topicLabel(weakest.topic) : "",
      ...assessedTopics.map((t) => {
        const x = r.analysis.topics.find((y) => y.topic === t);
        return x ? String(x.percent) : "";
      }),
      flags,
    ];
  });
  return [header, ...rows];
}
