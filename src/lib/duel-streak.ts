import { STRUGGLING_THRESHOLD } from "./flags.ts";

/**
 * Trial: the same "N in a row" rule behind the Struggling badge, pointed at
 * duel losses instead of failed tests. Deliberately private - shown only to
 * the student themselves on their own /duels page (see duels.tsx), never
 * next to a classmate's name and never surfaced to a teacher. If the trial
 * goes well, a teacher-facing version belongs in the class report instead,
 * as its own separate change.
 */
export const DUEL_STREAK_THRESHOLD = STRUGGLING_THRESHOLD;

export type DuelRow = {
  status: string;
  challenger_id: string;
  opponent_id: string;
  winner_id: string | null;
  created_at: string;
};

/**
 * How many completed duels in a row the given student has lost, most recent
 * first, stopping at the first win (or a duel they weren't part of - callers
 * may pass every duel a class has run, not just this student's). Only
 * "complete" duels count; anything still open or in progress is ignored
 * rather than breaking the streak.
 */
export function currentLosingStreak(duels: DuelRow[], userId: string): number {
  const mine = duels
    .filter(
      (d) =>
        d.status === "complete" && (d.challenger_id === userId || d.opponent_id === userId),
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  let streak = 0;
  for (const d of mine) {
    if (d.winner_id === userId) break;
    streak += 1;
  }
  return streak;
}
