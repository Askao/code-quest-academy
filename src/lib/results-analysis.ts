/**
 * Turns a student's marked assessments into the picture on their dashboard:
 * the overall mark, how they're doing topic by topic, and which questions
 * lost them marks. Pure (no Supabase/React) so the maths is testable
 * (results-analysis.test.ts); the dashboard box only displays it.
 */

export type AnalysedQuestion = {
  position: number;
  question_id: string;
  topic: string;
  ability: 1 | 2 | 3;
  marks: number;
  marks_awarded: number;
  question: string;
  comment: string;
};

export type AnalysedAttempt = {
  assessment_id: string;
  title: string;
  board: string;
  marked_at: string;
  total_marks: number;
  marks_awarded: number;
  questions: AnalysedQuestion[];
};

export type Band = "needs_work" | "developing" | "strong";

export const BAND_LABEL: Record<Band, string> = {
  needs_work: "Needs work",
  developing: "Getting there",
  strong: "Strong",
};

export const percentOf = (earned: number, available: number) =>
  available <= 0 ? 0 : Math.round((earned / available) * 100);

/** Under half marks needs work; three-quarters or more is strong. */
export function bandFor(percent: number): Band {
  if (percent < 50) return "needs_work";
  if (percent < 75) return "developing";
  return "strong";
}

/** A score can never exceed what the question is worth (the database caps it
 * too; this keeps the maths honest if a row ever slips through). */
const earnedOn = (q: AnalysedQuestion) => Math.max(0, Math.min(q.marks_awarded, q.marks));

export type TopicResult = {
  topic: string;
  earned: number;
  available: number;
  percent: number;
  band: Band;
  questions: number;
};

export type RevisitQuestion = {
  assessmentId: string;
  assessmentTitle: string;
  questionId: string;
  topic: string;
  marks: number;
  earned: number;
  lost: number;
  label: string;
  comment: string;
};

export type AssessmentResult = {
  assessmentId: string;
  title: string;
  markedAt: string;
  earned: number;
  available: number;
  percent: number;
  band: Band;
};

export type Analysis = {
  overall: { earned: number; available: number; percent: number; band: Band; assessments: number };
  assessments: AssessmentResult[];
  /** Weakest first. */
  topics: TopicResult[];
  /** Most marks lost first. */
  revisit: RevisitQuestion[];
};

const COMMAND_WORD =
  /^(?:\([a-z]\)\s*)?(?:state|describe|explain|write|identify|give|complete|name|define|outline|compare|suggest|calculate|draw|trace|correct|list|what|why|how)\b/i;

/**
 * A short, recognisable description of a question for a list. Many questions
 * open with a scenario or a code listing ("The following program is written
 * in..."), which says nothing about what was asked - so skip any code block
 * and prefer the first paragraph that starts with a command word (State,
 * Explain, Write...), falling back to the first paragraph.
 */
export function questionLabel(question: string, maxLength = 120): string {
  const prose = question.replace(/```[\s\S]*?```/g, "\n\n");
  const paragraphs = prose
    .split(/\n\s*\n/)
    .map((p) =>
      p
        .replace(/\s+/g, " ")
        .replace(/\*\*|`/g, "")
        .trim(),
    )
    .filter(Boolean);
  // "You may use pseudocode or a high-level programming language." closes
  // most programming questions and says nothing about the task itself.
  const tidy = (p: string) =>
    p
      .replace(/You may use [^.]*\./gi, "")
      .replace(/\s*\[\d+\]\s*$/, "")
      .trim();
  const chosen = tidy(paragraphs.find((p) => COMMAND_WORD.test(p)) ?? paragraphs[0] ?? "");
  // A bare "Write the program." is no help either - the scenario before it is.
  const cleaned = chosen.length < 30 && paragraphs[0] ? tidy(paragraphs[0]) : chosen;
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength - 1).trimEnd()}…` : cleaned;
}

export function analyseResults(attempts: AnalysedAttempt[], revisitLimit = Infinity): Analysis {
  const sorted = [...attempts].sort((a, b) => b.marked_at.localeCompare(a.marked_at));

  const assessments: AssessmentResult[] = sorted.map((a) => {
    const earned = a.questions.reduce((s, q) => s + earnedOn(q), 0);
    const available = a.questions.reduce((s, q) => s + q.marks, 0);
    const percent = percentOf(earned, available);
    return {
      assessmentId: a.assessment_id,
      title: a.title,
      markedAt: a.marked_at,
      earned,
      available,
      percent,
      band: bandFor(percent),
    };
  });

  const earned = assessments.reduce((s, a) => s + a.earned, 0);
  const available = assessments.reduce((s, a) => s + a.available, 0);
  const overallPercent = percentOf(earned, available);

  const byTopic = new Map<string, TopicResult>();
  for (const a of sorted) {
    for (const q of a.questions) {
      const t = byTopic.get(q.topic) ?? {
        topic: q.topic,
        earned: 0,
        available: 0,
        percent: 0,
        band: "needs_work" as Band,
        questions: 0,
      };
      t.earned += earnedOn(q);
      t.available += q.marks;
      t.questions += 1;
      byTopic.set(q.topic, t);
    }
  }
  const topics = [...byTopic.values()]
    .map((t) => {
      const percent = percentOf(t.earned, t.available);
      return { ...t, percent, band: bandFor(percent) };
    })
    .sort(
      (a, b) =>
        a.percent - b.percent || b.available - a.available || a.topic.localeCompare(b.topic),
    );

  // sorted is newest-first, so on a tie the most recent question wins.
  const revisit = sorted
    .flatMap((a) =>
      a.questions
        .filter((q) => earnedOn(q) < q.marks)
        .map<RevisitQuestion>((q) => ({
          assessmentId: a.assessment_id,
          assessmentTitle: a.title,
          questionId: q.question_id,
          topic: q.topic,
          marks: q.marks,
          earned: earnedOn(q),
          lost: q.marks - earnedOn(q),
          label: questionLabel(q.question),
          comment: q.comment,
        })),
    )
    .sort((a, b) => b.lost - a.lost || a.earned / a.marks - b.earned / b.marks)
    .slice(0, revisitLimit);

  return {
    overall: {
      earned,
      available,
      percent: overallPercent,
      band: bandFor(overallPercent),
      assessments: assessments.length,
    },
    assessments,
    topics,
    revisit,
  };
}
