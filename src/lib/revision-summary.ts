/**
 * The teacher's summary of a class's revision papers. Only counts and the
 * students' own self-marked totals - never the questions or the answers.
 */
export type RevisionSummaryRow = {
  student_id: string;
  papers_made: number;
  papers_handed_in: number;
  marks_awarded: number;
  marks_available: number;
  last_active: string | null;
  topics: { topic: string; awarded: number; available: number }[];
};

/** A student who hasn't revised for this many days counts as "quiet". */
export const QUIET_AFTER_DAYS = 14;

/** A topic needs at least this many marks' worth of answers before it is called weakest. */
export const MIN_MARKS_FOR_WEAKEST = 4;

export type Activity = "never" | "recent" | "quiet";

export function percent(awarded: number, available: number): number | null {
  if (available <= 0) return null;
  return Math.round((awarded / available) * 100);
}

export function activityOf(lastActive: string | null, now: Date = new Date()): Activity {
  if (!lastActive) return "never";
  const days = (now.getTime() - new Date(lastActive).getTime()) / 86_400_000;
  return days > QUIET_AFTER_DAYS ? "quiet" : "recent";
}

/** The topic they scored lowest in, once there is enough evidence to say so. */
export function weakestTopic(row: RevisionSummaryRow): { topic: string; percent: number } | null {
  let worst: { topic: string; percent: number } | null = null;
  for (const t of row.topics) {
    if (t.available < MIN_MARKS_FOR_WEAKEST) continue;
    const p = percent(t.awarded, t.available);
    if (p === null) continue;
    if (!worst || p < worst.percent) worst = { topic: t.topic, percent: p };
  }
  return worst;
}

/** Class-wide headline numbers for the panel. */
export function classTotals(rows: RevisionSummaryRow[], now: Date = new Date()) {
  const started = rows.filter((r) => r.papers_made > 0).length;
  const quiet = rows.filter((r) => activityOf(r.last_active, now) === "quiet").length;
  const awarded = rows.reduce((n, r) => n + r.marks_awarded, 0);
  const available = rows.reduce((n, r) => n + r.marks_available, 0);
  return {
    students: rows.length,
    started,
    neverStarted: rows.length - started,
    quiet,
    papers: rows.reduce((n, r) => n + r.papers_made, 0),
    percent: percent(awarded, available),
  };
}
