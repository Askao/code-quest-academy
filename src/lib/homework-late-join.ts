import { supabase } from "@/integrations/supabase/client";
import { pickFreshHomeworkSet } from "@/lib/homework-picks";
import { assignedHomeworkTaskIds, passedHomeworkTaskIds } from "@/lib/homework-history";

/**
 * A homework's per-student task lists are generated when the teacher sets
 * it, for whoever is on the roster then. A student who joins the class
 * afterwards has no list, so this builds one for them - from the pool the
 * teacher chose (stored on the homework row), at the student's own level,
 * skipping anything they've already passed - the first time they load the
 * app. Safe to call repeatedly: it only acts on homework they have no list
 * for, and the database refuses to overwrite an existing one.
 *
 * Homework that's still open, or was due within the last two weeks, is
 * given; older overdue homework is left alone so someone joining in
 * February isn't handed a term of long-expired tasks.
 *
 * Returns how many homework lists were created.
 */
const RECENTLY_DUE_DAYS = 14;

export async function fillMissingHomework(userId: string): Promise<number> {
  const { data: memberships } = await supabase
    .from("class_members")
    .select("class_id, classes(track)")
    .eq("student_id", userId);
  if (!memberships || memberships.length === 0) return 0;

  const trackByClass = new Map(memberships.map((m) => [m.class_id, m.classes?.track ?? "gcse"]));
  const cutoff = new Date(Date.now() - RECENTLY_DUE_DAYS * 86_400_000).toISOString();
  const { data: homework } = await supabase
    .from("homework")
    .select("id, class_id, pool_ids, topics, task_count, due_at")
    .in("class_id", [...trackByClass.keys()])
    .or(`due_at.is.null,due_at.gte.${cutoff}`);
  const candidates = (homework ?? []).filter((h) => (h.pool_ids ?? []).length > 0);
  if (candidates.length === 0) return 0;

  const { data: mine } = await supabase
    .from("homework_assignments")
    .select("homework_id")
    .eq("student_id", userId)
    .in(
      "homework_id",
      candidates.map((h) => h.id),
    );
  const haveList = new Set((mine ?? []).map((a) => a.homework_id));
  const missing = candidates.filter((h) => !haveList.has(h.id));
  if (missing.length === 0) return 0;

  const [{ data: poolRows }, { data: skills }, passedBy, assignedBy] = await Promise.all([
    supabase
      .from("challenges")
      .select("id, difficulty, topic")
      .eq("homework_only", true)
      .limit(5000),
    supabase.from("skills").select("topic, track, level").eq("user_id", userId),
    passedHomeworkTaskIds([userId]),
    assignedHomeworkTaskIds({ studentId: userId }),
  ]);
  const passed = passedBy.get(userId) ?? new Set<string>();
  const assigned = assignedBy.get(userId) ?? new Set<string>();

  let created = 0;
  // Oldest first, so an earlier homework gets first pick and a later one
  // avoids what it took - same as it would have if they'd been in the class.
  for (const hw of missing.sort((a, b) => (a.due_at ?? "").localeCompare(b.due_at ?? ""))) {
    const inPool = new Set(hw.pool_ids);
    const pool = (poolRows ?? []).filter((c) => inPool.has(c.id));
    const track = trackByClass.get(hw.class_id) ?? "gcse";
    const mineForTrack = (skills ?? []).filter((k) => k.track === track);
    // Same level rule as the teacher's setHomework: average skill across
    // the topics chosen (2 for one they haven't started), or their overall
    // average when the homework covers everything.
    const level =
      hw.topics.length > 0
        ? hw.topics.reduce(
            (sum, t) => sum + Number(mineForTrack.find((k) => k.topic === t)?.level ?? 2),
            0,
          ) / hw.topics.length
        : mineForTrack.length
          ? mineForTrack.reduce((sum, k) => sum + Number(k.level), 0) / mineForTrack.length
          : 1;

    const ids = pickFreshHomeworkSet({
      pool,
      level,
      count: hw.task_count ?? 4,
      passed,
      alreadyAssigned: assigned,
    });
    if (ids.length === 0) continue;
    const { error } = await supabase.rpc("claim_homework_assignment", {
      _homework_id: hw.id,
      _challenge_ids: ids,
    });
    if (error) {
      console.error("claim_homework_assignment failed", error.message);
      continue;
    }
    ids.forEach((id) => assigned.add(id));
    created++;
  }
  return created;
}
