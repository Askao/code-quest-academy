/**
 * The pure side of student revision papers: what the builder offers, how a
 * paper is scored, and how a finished paper becomes the same analysis the
 * dashboard shows for teacher-marked assessments. No Supabase or React, so it
 * can be tested (revision.test.ts); the pages only display it.
 */
import type { AnalysedAttempt } from "./results-analysis.ts";

export type RevisionFocus = "smart" | "weak" | "new";

export const FOCUS_OPTIONS: { key: RevisionFocus; label: string; blurb: string }[] = [
  {
    key: "smart",
    label: "Smart mix",
    blurb: "Mostly questions you lost marks on before, topped up with new ones.",
  },
  {
    key: "weak",
    label: "Fix my mistakes",
    blurb: "As many questions you got wrong before as possible.",
  },
  { key: "new", label: "New questions", blurb: "Questions you haven't seen yet come first." },
];

/** One row of revision_topics(): a topic's questions and the student's history with them. */
export type TopicSummary = { topic: string; available: number; missed: number; unseen: number };

/** Questions on offer across the chosen topics (none chosen = every topic). */
export function totalsFor(rows: TopicSummary[], selected: string[]) {
  const chosen = selected.length === 0 ? rows : rows.filter((r) => selected.includes(r.topic));
  return chosen.reduce(
    (t, r) => ({
      available: t.available + r.available,
      missed: t.missed + r.missed,
      unseen: t.unseen + r.unseen,
    }),
    { available: 0, missed: 0, unseen: 0 },
  );
}

/** How many questions to ask for: what they wanted, but never more than exist. */
export function clampCount(wanted: number, available: number): number {
  return Math.max(0, Math.min(wanted, available));
}

export function defaultTitle(
  board: string,
  topics: string[],
  label: (topic: string) => string,
): string {
  const what =
    topics.length === 0
      ? "mixed topics"
      : topics.length <= 2
        ? topics.map(label).join(" & ")
        : `${topics.length} topics`;
  return `${board.toUpperCase()} revision: ${what}`;
}

// ---------------------------------------------------------------- a paper

export type MarkSchemePoint = {
  position: number;
  text: string;
  marks: number;
  guidance: string;
  /** The student's own YES/NO, or null if they haven't ruled on it yet. */
  awarded: boolean | null;
};

export type RevisionQuestion = {
  position: number;
  question_id: string;
  topic: string;
  ability: 1 | 2 | 3;
  marks: number;
  answer_format: "text" | "code";
  question: string;
  was_weak: boolean;
  answer: string;
  marked: boolean;
  marks_awarded: number;
  /** Null until the paper is handed in. */
  mark_scheme: MarkSchemePoint[] | null;
};

export type OpenedPaper = {
  id: string;
  title: string;
  board: "ocr" | "aqa";
  topics: string[];
  time_limit_minutes: number | null;
  total_marks: number;
  weak_count: number;
  started_at: string;
  submitted_at: string | null;
  marked_at: string | null;
  server_now: string;
  questions: RevisionQuestion[];
};

/** A student's score can never exceed what a question is worth. */
const earnedOn = (q: { marks: number; marks_awarded: number }) =>
  Math.max(0, Math.min(q.marks_awarded, q.marks));

export function paperScore(questions: RevisionQuestion[]) {
  const earned = questions.reduce((s, q) => s + (q.marked ? earnedOn(q) : 0), 0);
  const available = questions.reduce((s, q) => s + q.marks, 0);
  return {
    earned,
    available,
    percent: available === 0 ? 0 : Math.round((earned / available) * 100),
  };
}

export function markingProgress(questions: RevisionQuestion[]) {
  const marked = questions.filter((q) => q.marked).length;
  return {
    marked,
    total: questions.length,
    done: questions.length > 0 && marked === questions.length,
  };
}

/** The student's decisions so far, keyed by mark-point position. */
export function decisionsOf(scheme: MarkSchemePoint[]): Record<number, boolean | null> {
  return Object.fromEntries(scheme.map((p) => [p.position, p.awarded]));
}

/** What mark_revision_question wants: every point ruled on, an undecided one counting as NO. */
export function pointsPayload(
  scheme: MarkSchemePoint[],
  decisions: Record<number, boolean | null>,
): { position: number; awarded: boolean }[] {
  return scheme.map((p) => ({ position: p.position, awarded: decisions[p.position] === true }));
}

/** The score those decisions give - the same rule the database applies (capped at the question's marks). */
export function scoreOf(
  scheme: MarkSchemePoint[],
  decisions: Record<number, boolean | null>,
  questionMarks: number,
): number {
  const raw = scheme.filter((p) => decisions[p.position] === true).reduce((s, p) => s + p.marks, 0);
  return Math.min(raw, questionMarks);
}

/** A finished paper in the shape analyseResults() takes, so the topic breakdown and "revisit" list are the assessments' own. */
export function toAnalysed(paper: OpenedPaper): AnalysedAttempt {
  return {
    assessment_id: paper.id,
    title: paper.title,
    board: paper.board,
    marked_at: paper.marked_at ?? paper.submitted_at ?? paper.started_at,
    total_marks: paper.total_marks,
    marks_awarded: paperScore(paper.questions).earned,
    questions: paper.questions.map((q) => ({
      position: q.position,
      question_id: q.question_id,
      topic: q.topic,
      ability: q.ability,
      marks: q.marks,
      marks_awarded: q.marked ? earnedOn(q) : 0,
      question: q.question,
      comment: "",
    })),
  };
}

export type PaperState = "in_progress" | "to_mark" | "marking" | "marked";

/** Where a paper is up to, for the history list. */
export function paperState(p: {
  submitted_at: string | null;
  marked_at: string | null;
  marked_questions?: number;
}): PaperState {
  if (p.marked_at) return "marked";
  if (!p.submitted_at) return "in_progress";
  return (p.marked_questions ?? 0) > 0 ? "marking" : "to_mark";
}

export const STATE_LABEL: Record<PaperState, string> = {
  in_progress: "In progress",
  to_mark: "Handed in - ready to mark",
  marking: "Marking in progress",
  marked: "Marked",
};
