import { supabase } from "@/integrations/supabase/client";

/**
 * What each student has already done or been given, so a new homework can
 * avoid repeating it (see pickFreshHomeworkSet in homework-picks.ts).
 */

const PAGE = 1000;

/**
 * Homework-pool tasks each student has passed, in any earlier homework or
 * anywhere else. Filtered to the homework-only pool in the query itself and
 * paged, because a class's passed attempts can run past PostgREST's
 * 1000-row default and a silently truncated list would let repeats through.
 */
export async function passedHomeworkTaskIds(
  studentIds: string[],
): Promise<Map<string, Set<string>>> {
  const out = new Map<string, Set<string>>();
  if (studentIds.length === 0) return out;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("attempts")
      .select("id, user_id, challenge_id, challenges!inner(homework_only)")
      .in("user_id", studentIds)
      .eq("passed", true)
      .eq("challenges.homework_only", true)
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const row of data ?? []) {
      const set = out.get(row.user_id) ?? new Set<string>();
      set.add(row.challenge_id);
      out.set(row.user_id, set);
    }
    if ((data ?? []).length < PAGE) return out;
  }
}

/**
 * Tasks each student was already given by this class's earlier homework,
 * whether or not they finished them. `classId` scopes it to what a teacher
 * can see; pass null for the signed-in student's own history across every
 * class they're in.
 */
export async function assignedHomeworkTaskIds(
  opts: { classId: string } | { studentId: string },
): Promise<Map<string, Set<string>>> {
  const out = new Map<string, Set<string>>();
  let query = supabase
    .from("homework_assignments")
    .select("student_id, challenge_ids, homework!inner(class_id)");
  query =
    "classId" in opts
      ? query.eq("homework.class_id", opts.classId)
      : query.eq("student_id", opts.studentId);
  const { data, error } = await query.limit(5000);
  if (error) throw error;
  for (const row of data ?? []) {
    const set = out.get(row.student_id) ?? new Set<string>();
    for (const id of row.challenge_ids ?? []) set.add(id);
    out.set(row.student_id, set);
  }
  return out;
}
