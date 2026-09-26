import { supabase } from "@/integrations/supabase/client";
import { inListOrder, type HomeworkItem } from "@/lib/homework-flow";

/**
 * A student's task list for one homework, in order, with which are passed.
 * Uses their own list if they have one, else the homework's shared list -
 * the same fallback the homework page and dashboard use.
 */
export async function loadHomeworkList(
  homeworkId: string,
  userId: string,
): Promise<{ items: HomeworkItem[]; passed: Set<string> }> {
  const [{ data: own }, { data: hw }] = await Promise.all([
    supabase
      .from("homework_assignments")
      .select("challenge_ids")
      .eq("homework_id", homeworkId)
      .eq("student_id", userId)
      .maybeSingle(),
    supabase.from("homework").select("challenge_ids").eq("id", homeworkId).maybeSingle(),
  ]);
  const ids =
    (own?.challenge_ids as string[] | undefined) ?? (hw?.challenge_ids as string[] | null) ?? [];
  if (ids.length === 0) return { items: [], passed: new Set() };

  const [{ data: rows }, { data: attempts }] = await Promise.all([
    supabase.from("challenges").select("id, slug").in("id", ids),
    supabase
      .from("attempts")
      .select("challenge_id")
      .eq("user_id", userId)
      .eq("passed", true)
      .in("challenge_id", ids),
  ]);
  return {
    items: inListOrder(ids, rows ?? []),
    passed: new Set((attempts ?? []).map((a) => a.challenge_id)),
  };
}
