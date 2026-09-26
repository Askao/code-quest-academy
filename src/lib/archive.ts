/**
 * When homework and assessments move to the Archive. Nothing is stored:
 * whether something is archived is worked out from its deadline and
 * progress, so it moves on its own and can never be out of step with the
 * data. Archived work stays fully accessible - it is a tidier place for it,
 * not a lock. Kept free of Supabase/React imports so the rules are testable
 * (archive.test.ts).
 */
import type { AttemptStatus } from "./assessments.ts";

const passed = (iso: string | null | undefined, now: Date) =>
  !!iso && now.getTime() > new Date(iso).getTime();

// ------------------------------------------------------------ students

export type HomeworkArchiveReason = "completed" | "overdue";

/**
 * A student's homework is archived once they have finished every task, or
 * the deadline has passed. Finishing wins if both are true. A homework with
 * no tasks yet (total 0 - e.g. still being generated for someone who joined
 * late) is never "finished".
 */
export function studentHomeworkArchiveReason(
  hw: { completed: number; total: number; dueAt: string | null },
  now: Date = new Date(),
): HomeworkArchiveReason | null {
  if (hw.total > 0 && hw.completed >= hw.total) return "completed";
  if (passed(hw.dueAt, now)) return "overdue";
  return null;
}

export type AssessmentArchiveReason = "marked" | "handed_in" | "missed";

/**
 * A student's assessment is archived once they have handed it in (and
 * especially once their marks are back), or once the window to start it has
 * closed without them starting. Someone still writing is never archived,
 * even if the window has closed, because they are allowed to finish.
 */
export function studentAssessmentArchiveReason(
  a: { status: AttemptStatus; closesAt: string | null },
  now: Date = new Date(),
): AssessmentArchiveReason | null {
  if (a.status === "marked") return "marked";
  if (a.status === "handed_in") return "handed_in";
  if (a.status === "not_started" && passed(a.closesAt, now)) return "missed";
  return null;
}

export const HOMEWORK_REASON_LABEL: Record<HomeworkArchiveReason, string> = {
  completed: "Completed",
  overdue: "Past the deadline",
};

/** `resultsReleased` decides whether "marked" can say the marks are back. */
export function assessmentReasonLabel(
  reason: AssessmentArchiveReason,
  resultsReleased: boolean,
): string {
  if (reason === "marked") return resultsReleased ? "Marked - results ready" : "Marked";
  if (reason === "handed_in") return "Handed in - waiting to be marked";
  return "Missed - closed before you started";
}

// ------------------------------------------------------------ teachers

export type TeacherHomeworkReason = "everyone_finished" | "past_deadline";

/** A homework moves to the teacher's archive when every student has finished
 * it or its deadline has passed. */
export function teacherHomeworkArchiveReason(
  hw: { dueAt: string | null; doneCount: number; studentCount: number },
  now: Date = new Date(),
): TeacherHomeworkReason | null {
  if (hw.studentCount > 0 && hw.doneCount >= hw.studentCount) return "everyone_finished";
  if (passed(hw.dueAt, now)) return "past_deadline";
  return null;
}

export type TeacherAssessmentReason = "results_released" | "closed";

/**
 * An assessment moves to the teacher's archive once the marks have been
 * given back, or the time to start it has passed and there is nothing left
 * waiting: nobody still writing and nothing handed in but unmarked.
 */
export function teacherAssessmentArchiveReason(
  a: { resultsReleased: boolean; closesAt: string | null; statuses: AttemptStatus[] },
  now: Date = new Date(),
): TeacherAssessmentReason | null {
  if (a.resultsReleased) return "results_released";
  const pending = a.statuses.some((s) => s === "writing" || s === "handed_in");
  if (passed(a.closesAt, now) && !pending) return "closed";
  return null;
}
