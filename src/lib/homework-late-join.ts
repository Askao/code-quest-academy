import { supabase } from "@/integrations/supabase/client";
import { homeworkLevel, pickFreshHomeworkSet } from "@/lib/homework-picks";
import { assignedHomeworkTaskIds, passedHomeworkTaskIds } from "@/lib/homework-history";

/**
 * A homework's per-student task lists are generated when the teacher sets
 * it, for whoever is on the roster then. A student who joins the class
 * afterwards (or is moved into it by an admin) has no list, so one is built
 * for them - from the pool the teacher chose (stored on the homework row), at
 * the student's own level, skipping anything they've already passed.
 *
 * It happens from both ends so nobody waits on the other:
 *  - fillMissingHomework: the student's own browser, the first time they load
 *    the app (through the claim_homework_assignment door).
 *  - fillMissingHomeworkForClass: the teacher's browser, whenever they open
 *    the class page, for every student at once - so a teacher never sees a
 *    late joiner with "no tasks" just because that student hasn't logged in.
 *
 * Both are safe to call repeatedly: they only act on homework a student has no
 * list for, and the database refuses to overwrite an existing one.
 *
 * Homework that's still open, or was due within the last two weeks, is
 * given; older overdue homework is left alone so someone joining in
 * February isn't handed a term of long-expired tasks.
 */
const RECENTLY_DUE_DAYS = 14;

type Save = (homeworkId: string, studentId: string, ids: string[]) => Promise<string | null>;

async function fillLists(args: {
  members: { studentId: string; classId: string }[];
  trackByClass: Map<string, string>;
  assignedScope: { classId: string } | { studentId: string };
  save: Save;
}): Promise<number> {
  const { members, trackByClass, assignedScope, save } = args;
  if (members.length === 0) return 0;
  const studentIds = [...new Set(members.map((m) => m.studentId))];

  const cutoff = new Date(Date.now() - RECENTLY_DUE_DAYS * 86_400_000).toISOString();
  const { data: homework } = await supabase
    .from("homework")
    .select("id, class_id, pool_ids, topics, task_count, due_at")
    .in("class_id", [...trackByClass.keys()])
    .or(`due_at.is.null,due_at.gte.${cutoff}`);
  const candidates = (homework ?? []).filter((h) => (h.pool_ids ?? []).length > 0);
  if (candidates.length === 0) return 0;

  const { data: existing } = await supabase
    .from("homework_assignments")
    .select("homework_id, student_id")
    .in(
      "homework_id",
      candidates.map((h) => h.id),
    )
    .in("student_id", studentIds);
  const haveList = new Set((existing ?? []).map((a) => `${a.homework_id}:${a.student_id}`));

  // Oldest first, so an earlier homework gets first pick and a later one
  // avoids what it took - same as it would have if they'd been in the class.
  const ordered = [...candidates].sort((a, b) => (a.due_at ?? "").localeCompare(b.due_at ?? ""));
  const missing = ordered.flatMap((hw) =>
    members
      .filter((m) => m.classId === hw.class_id && !haveList.has(`${hw.id}:${m.studentId}`))
      .map((m) => ({ hw, studentId: m.studentId })),
  );
  if (missing.length === 0) return 0;

  const [{ data: poolRows }, { data: skills }, passedBy, assignedBy] = await Promise.all([
    supabase.from("challenges").select("id, difficulty, topic").eq("homework_only", true).limit(5000),
    supabase.from("skills").select("user_id, topic, track, level").in("user_id", studentIds),
    passedHomeworkTaskIds(studentIds),
    assignedHomeworkTaskIds(assignedScope),
  ]);
  const none = new Set<string>();

  let created = 0;
  for (const { hw, studentId } of missing) {
    const inPool = new Set(hw.pool_ids);
    const pool = (poolRows ?? []).filter((c) => inPool.has(c.id));
    const track = trackByClass.get(hw.class_id) ?? "gcse";
    const mine = (skills ?? []).filter((k) => k.user_id === studentId);
    const passed = passedBy.get(studentId) ?? none;
    const assigned = assignedBy.get(studentId) ?? new Set<string>();

    const ids = pickFreshHomeworkSet({
      pool,
      level: homeworkLevel(mine, track, hw.topics),
      count: hw.task_count ?? 4,
      passed,
      alreadyAssigned: assigned,
    });
    if (ids.length === 0) continue;
    const error = await save(hw.id, studentId, ids);
    if (error) {
      console.error("could not save a late joiner's homework list:", error);
      continue;
    }
    ids.forEach((id) => assigned.add(id));
    assignedBy.set(studentId, assigned);
    created++;
  }
  return created;
}

/** The signed-in student, for every class they're in. Returns how many lists were created. */
export async function fillMissingHomework(userId: string): Promise<number> {
  const { data: memberships } = await supabase
    .from("class_members")
    .select("class_id, classes(track)")
    .eq("student_id", userId);
  if (!memberships || memberships.length === 0) return 0;
  return fillLists({
    members: memberships.map((m) => ({ studentId: userId, classId: m.class_id })),
    trackByClass: new Map(memberships.map((m) => [m.class_id, m.classes?.track ?? "gcse"])),
    assignedScope: { studentId: userId },
    save: async (homeworkId, _studentId, ids) => {
      const { error } = await supabase.rpc("claim_homework_assignment", {
        _homework_id: homeworkId,
        _challenge_ids: ids,
      });
      return error?.message ?? null;
    },
  });
}

/** A teacher, for every student in one class. Returns how many lists were created. */
export async function fillMissingHomeworkForClass(classId: string): Promise<number> {
  const [{ data: cls }, { data: roster }] = await Promise.all([
    supabase.from("classes").select("track").eq("id", classId).maybeSingle(),
    supabase.from("class_members").select("student_id").eq("class_id", classId),
  ]);
  if (!cls || !roster || roster.length === 0) return 0;
  return fillLists({
    members: roster.map((r) => ({ studentId: r.student_id, classId })),
    trackByClass: new Map([[classId, cls.track]]),
    assignedScope: { classId },
    save: async (homeworkId, studentId, ids) => {
      // ON CONFLICT would need an update policy; a plain insert that loses a
      // race with the student's own browser just hits the unique key.
      const { error } = await supabase
        .from("homework_assignments")
        .insert({ homework_id: homeworkId, student_id: studentId, challenge_ids: ids });
      return error && error.code !== "23505" ? error.message : null;
    },
  });
}
