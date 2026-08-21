import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { levelFromXp, skillPercent, topicLabel, topicsFor, type TrackKey } from "@/lib/game";
import { pickHomeworkSet } from "@/lib/progress";
import { downloadCsv } from "@/lib/csv";
import {
  getLesson,
  isLessonComplete,
  lessonsForTopic,
  tasksForLesson,
  topicsWithLessons,
} from "@/lib/content";

const EFFORT_COUNT: Record<string, number> = { low: 4, medium: 6, high: 8 };
const STRUGGLING_THRESHOLD = 3;

export const Route = createFileRoute("/_authenticated/teacher/$classId")({
  head: () => ({
    meta: [
      { title: "Class — H-Code" },
      { name: "description", content: "Class roster, skill levels and homework." },
      { property: "og:title", content: "Class — H-Code" },
      { property: "og:description", content: "Class roster, skill levels and homework." },
    ],
  }),
  component: ClassDetail,
});

function ClassDetail() {
  const { classId } = Route.useParams();
  const { user, isAdmin, schoolId } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [effort, setEffort] = useState("medium");
  const [assignTopic, setAssignTopic] = useState("");
  const [assignLessonSlug, setAssignLessonSlug] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [expandedHomework, setExpandedHomework] = useState<string | null>(null);
  const [coTeacherEmail, setCoTeacherEmail] = useState("");
  const [addingCoTeacher, setAddingCoTeacher] = useState(false);

  const { data } = useQuery({
    queryKey: ["class", classId],
    queryFn: async () => {
      const cls = await supabase.from("classes").select("*").eq("id", classId).maybeSingle();
      const coTeachersRes = await supabase
        .from("class_co_teachers")
        .select("id, teacher_id")
        .eq("class_id", classId);
      const coTeacherIds = (coTeachersRes.data ?? []).map((c) => c.teacher_id);
      const ownerId = cls.data?.teacher_id;
      const profileLookupIds = [...coTeacherIds, ...(ownerId ? [ownerId] : [])];
      const coTeacherProfilesRes = profileLookupIds.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", profileLookupIds)
        : { data: [] };
      const ownerName = (coTeacherProfilesRes.data ?? []).find((p) => p.id === ownerId)?.full_name;
      const coTeachers = (coTeachersRes.data ?? []).map((c) => ({
        id: c.id,
        teacherId: c.teacher_id,
        name:
          (coTeacherProfilesRes.data ?? []).find((p) => p.id === c.teacher_id)?.full_name ??
          "Teacher",
        email: (coTeacherProfilesRes.data ?? []).find((p) => p.id === c.teacher_id)?.email ?? "",
      }));
      const members = await supabase
        .from("class_members")
        .select("student_id")
        .eq("class_id", classId);
      const memberIds = (members.data ?? []).map((m) => m.student_id);
      // A class_members row can outlive a student being promoted to
      // teacher (the admin Users table doesn't clean that up) - exclude
      // staff by role so a colleague never shows up as a "student" here.
      const rosterRolesRes = memberIds.length
        ? await supabase
            .from("user_roles")
            .select("user_id")
            .in("user_id", memberIds)
            .in("role", ["teacher", "admin"])
        : { data: [] };
      const rosterStaffIds = new Set((rosterRolesRes.data ?? []).map((r) => r.user_id));
      const ids = memberIds.filter((id) => !rosterStaffIds.has(id));
      const [profiles, stats, skills, attempts, homework] = await Promise.all([
        ids.length
          ? supabase.from("profiles").select("id, full_name, email").in("id", ids)
          : Promise.resolve({ data: [] }),
        ids.length
          ? supabase.from("stats").select("*").in("user_id", ids)
          : Promise.resolve({ data: [] }),
        ids.length
          ? supabase.from("skills").select("*").in("user_id", ids)
          : Promise.resolve({ data: [] }),
        ids.length
          ? supabase
              .from("attempts")
              .select("user_id, passed, created_at")
              .in("user_id", ids)
              .order("created_at", { ascending: false })
              .limit(500)
          : Promise.resolve({ data: [] }),
        supabase
          .from("homework")
          .select("*")
          .eq("class_id", classId)
          .order("created_at", { ascending: false }),
      ]);
      const lessonAssignmentsRes = await supabase
        .from("lesson_assignments")
        .select("id, lesson_slug, created_at")
        .eq("class_id", classId)
        .order("created_at", { ascending: false });
      const assignedLessonSlugs = (lessonAssignmentsRes.data ?? []).map((a) => a.lesson_slug);

      // Same `isLessonComplete` the student-facing gate uses, so this
      // tracker and the actual unlock condition can never disagree about
      // what "done" means. Scoped to only the lessons actually assigned,
      // so classes with nothing assigned yet skip these fetches entirely.
      const [passedTasksRes, quizPassedRes] = await Promise.all([
        ids.length && assignedLessonSlugs.length
          ? supabase
              .from("attempts")
              .select("user_id, challenges!inner(slug)")
              .in("user_id", ids)
              .eq("passed", true)
          : Promise.resolve({ data: [] }),
        ids.length && assignedLessonSlugs.length
          ? supabase
              .from("quiz_attempts")
              .select("user_id, lesson_slug")
              .in("user_id", ids)
              .eq("passed", true)
          : Promise.resolve({ data: [] }),
      ]);
      const passedTaskSlugsByUser = new Map<string, Set<string>>();
      for (const row of (passedTasksRes.data ?? []) as unknown as {
        user_id: string;
        challenges: { slug: string };
      }[]) {
        const set = passedTaskSlugsByUser.get(row.user_id) ?? new Set<string>();
        set.add(row.challenges.slug);
        passedTaskSlugsByUser.set(row.user_id, set);
      }
      const quizPassedByUser = new Map<string, Set<string>>();
      for (const row of (quizPassedRes.data ?? []) as { user_id: string; lesson_slug: string }[]) {
        const set = quizPassedByUser.get(row.user_id) ?? new Set<string>();
        set.add(row.lesson_slug);
        quizPassedByUser.set(row.user_id, set);
      }
      const students = (profiles.data ?? []).map((p) => {
        const s = (stats.data ?? []).find((x) => x.user_id === p.id);
        const mine = (skills.data ?? []).filter((k) => k.user_id === p.id);
        const avg = mine.length ? mine.reduce((a, b) => a + Number(b.level), 0) / mine.length : 1;
        const mineAttempts = (attempts.data ?? []).filter((a) => a.user_id === p.id);
        const accuracy = mineAttempts.length
          ? Math.round((mineAttempts.filter((a) => a.passed).length / mineAttempts.length) * 100)
          : 0;
        // Automatic struggling detection: three fails in a row on any topic
        // (see consecutive_fails in src/lib/progress.ts) - surfaced here
        // instead of relying on a student to self-report being stuck.
        const struggling = mine.some((k) => (k.consecutive_fails ?? 0) >= STRUGGLING_THRESHOLD);
        return {
          id: p.id,
          name: p.full_name ?? p.email ?? "Student",
          xp: s?.xp ?? 0,
          streak: s?.streak_days ?? 0,
          avg,
          accuracy,
          lastActive: s?.last_active,
          skills: mine,
          struggling,
        };
      });

      // Personalized assignments: each student can have their own list of
      // challenges for a given homework (see setHomework below). Legacy
      // homework created before this existed has no assignment rows, so it
      // falls back to the shared h.challenge_ids for every student.
      const homeworkIds = (homework.data ?? []).map((h) => h.id);
      const assignments = homeworkIds.length
        ? await supabase
            .from("homework_assignments")
            .select("homework_id, student_id, challenge_ids")
            .in("homework_id", homeworkIds)
        : { data: [] };
      const assignmentByKey = new Map(
        (assignments.data ?? []).map((a) => [`${a.homework_id}:${a.student_id}`, a.challenge_ids]),
      );

      // Homework completion: which of a homework's challenges has each
      // student actually passed. The `attempts` fetch above is capped at
      // 500 rows class-wide for the accuracy view, so it isn't reliable for
      // this — fetch passed attempts for exactly the challenges set as
      // homework instead.
      const homeworkChallengeIds = Array.from(
        new Set([
          ...(homework.data ?? []).flatMap((h) => h.challenge_ids ?? []),
          ...(assignments.data ?? []).flatMap((a) => a.challenge_ids ?? []),
        ]),
      );
      const [passedForHomework, homeworkChallengesRes] = await Promise.all([
        ids.length && homeworkChallengeIds.length
          ? supabase
              .from("attempts")
              .select("user_id, challenge_id")
              .in("user_id", ids)
              .in("challenge_id", homeworkChallengeIds)
              .eq("passed", true)
          : Promise.resolve({ data: [] }),
        // Titles for each homework's specific tasks, so the per-student
        // breakdown below can name exactly what's done/not done instead of
        // only a done/total count - homework is personalised per student
        // (see assignmentByKey), so this can't reuse tasksForLesson().
        homeworkChallengeIds.length
          ? supabase.from("challenges").select("id, title").in("id", homeworkChallengeIds)
          : Promise.resolve({ data: [] }),
      ]);
      const passedSet = new Set(
        (passedForHomework.data ?? []).map((a) => `${a.user_id}:${a.challenge_id}`),
      );
      const homeworkChallengeTitleById = new Map(
        (homeworkChallengesRes.data ?? []).map((c) => [c.id, c.title]),
      );

      // "I'm stuck" flags a student can leave against a specific homework
      // (see homework.$homeworkId.tsx) - only shown to them once they've
      // genuinely attempted and failed something, not on first load.
      const helpRequestsRes = homeworkIds.length
        ? await supabase
            .from("homework_help_requests")
            .select("*")
            .in("homework_id", homeworkIds)
            .order("created_at", { ascending: false })
        : { data: [] };
      const nameById = new Map(students.map((s) => [s.id, s.name]));
      const helpRequestsByHomework = new Map<string, typeof helpRequestsRes.data>();
      for (const r of helpRequestsRes.data ?? []) {
        const list = helpRequestsByHomework.get(r.homework_id) ?? [];
        list.push(r);
        helpRequestsByHomework.set(r.homework_id, list);
      }

      return {
        cls: cls.data,
        coTeachers,
        ownerName,
        students,
        lessonAssignments: (lessonAssignmentsRes.data ?? []).map((a) => {
          // Every student sees the same tasks for a given lesson (unlike
          // homework, which is personalised per student) - so a single task
          // list drives a shared student x task grid below, rather than a
          // per-student "N done" tick that hides which task is the gap.
          const lessonTasks = tasksForLesson(a.lesson_slug);
          return {
            id: a.id,
            lessonSlug: a.lesson_slug,
            createdAt: a.created_at,
            tasks: lessonTasks.map((t) => ({ slug: t.slug, title: t.title, stretch: !!t.stretch })),
            completion: students.map((s) => {
              const passed = passedTaskSlugsByUser.get(s.id) ?? new Set<string>();
              return {
                id: s.id,
                name: s.name,
                complete: isLessonComplete(
                  a.lesson_slug,
                  passed,
                  quizPassedByUser.get(s.id) ?? new Set<string>(),
                ),
                taskResults: lessonTasks.map((t) => passed.has(t.slug)),
              };
            }),
          };
        }),
        homework: (homework.data ?? []).map((h) => ({
          ...h,
          completion: students.map((s) => {
            const personal = assignmentByKey.get(`${h.id}:${s.id}`);
            const challengeIds = personal ?? h.challenge_ids ?? [];
            return {
              id: s.id,
              name: s.name,
              done: challengeIds.filter((cid) => passedSet.has(`${s.id}:${cid}`)).length,
              total: challengeIds.length,
              // Homework is personalised per student (see assignmentByKey
              // above), so unlike lessons this can't be one shared table -
              // each student's own task list, named and marked individually.
              tasks: challengeIds.map((cid) => ({
                id: cid,
                title: homeworkChallengeTitleById.get(cid) ?? "Task",
                passed: passedSet.has(`${s.id}:${cid}`),
              })),
            };
          }),
          helpRequests: (helpRequestsByHomework.get(h.id) ?? []).map((r) => ({
            id: r.id,
            studentName: nameById.get(r.student_id) ?? "Student",
            message: r.message,
            tasksDone: r.tasks_done_at_request,
            tasksTotal: r.tasks_total_at_request,
            resolved: r.resolved,
            createdAt: r.created_at,
          })),
        })),
      };
    },
  });

  const track = (data?.cls?.track ?? "gcse") as TrackKey;

  // A student-by-student skill breakdown already exists below, but it only
  // answers "how is this one student doing" - a teacher deciding what to
  // re-teach next needs the other lens: "how is the class doing on this
  // topic". Computed client-side from the same skills rows already fetched
  // above, so it costs nothing extra to query.
  const topicSummary = topicsFor(track).map((t) => {
    const levels = (data?.students ?? [])
      .map((s) => s.skills.find((k) => k.topic === t.key && k.track === track))
      .filter((k): k is NonNullable<typeof k> => !!k);
    const avgPercent = levels.length
      ? Math.round(
          levels.reduce((sum, k) => sum + skillPercent(Number(k.level)), 0) / levels.length,
        )
      : null;
    const strugglingCount = levels.filter(
      (k) => (k.consecutive_fails ?? 0) >= STRUGGLING_THRESHOLD,
    ).length;
    return { key: t.key, label: t.label, avgPercent, strugglingCount };
  });

  // classes SELECT RLS allows the teacher, class members, AND admins to read
  // a class row (members need that to check assignment/homework gates on
  // their own /learn page) - so it doesn't by itself keep a student out of
  // this teacher-only management page. Gate it here explicitly.
  // isPrimaryOwner: the original owner or an admin - gates Danger Zone and
  // adding/removing co-teachers, so a colleague covering the class can't
  // remove the owner's access or delete it.
  // hasAccess: owner, admin, an explicitly-added co-teacher, OR anyone at
  // the same school (automatic, see is_class_teacher()) - gates the rest
  // of the page (roster, homework, lessons), the actual "cover this
  // class" access.
  const isPrimaryOwner = !!data?.cls && (data.cls.teacher_id === user?.id || isAdmin);
  const isCoTeacher = (data?.coTeachers ?? []).some((t) => t.teacherId === user?.id);
  const isSameSchool = !!data?.cls?.school_id && !!schoolId && data.cls.school_id === schoolId;
  const hasAccess = isPrimaryOwner || isCoTeacher || isSameSchool;

  const setHomework = async () => {
    if (!title.trim()) {
      toast.error("Give the homework a title");
      return;
    }
    const students = data?.students ?? [];
    if (students.length === 0) {
      toast.error("No students in this class yet");
      return;
    }
    // Homework pulls exclusively from the homework-only task pool (see
    // src/content/*.json's "homeworkTasks" arrays) - never the same tasks
    // a student has already met in a lesson or Practice.
    let query = supabase
      .from("challenges")
      .select("id, difficulty, topic")
      .eq("track", track)
      .eq("homework_only", true);
    if (selectedTopics.length > 0) query = query.in("topic", selectedTopics);
    const { data: pool } = await query;
    if (!pool || pool.length === 0) {
      toast.error("No homework tasks available for those topics yet");
      return;
    }
    const count = EFFORT_COUNT[effort] ?? 4;

    const { data: hw, error: hwError } = await supabase
      .from("homework")
      .insert({
        class_id: classId,
        title: title.trim(),
        instructions: instructions.trim(),
        adaptive: true,
        ...(dueAt ? { due_at: new Date(dueAt).toISOString() } : {}),
      })
      .select("id")
      .single();
    if (hwError || !hw) {
      toast.error(hwError?.message ?? "Could not create homework");
      return;
    }

    // Each student gets challenges picked at their own level for the
    // selected topics (their overall average level when no topic is
    // selected, meaning "all topics") — not the same list for the whole
    // class. With several topics selected, level is the average of their
    // skill across just those topics, and pickHomeworkSet draws a genuine
    // mix across them rather than clumping in whichever topic scores
    // closest on difficulty.
    const assignments = students.map((s) => {
      const level =
        selectedTopics.length > 0
          ? selectedTopics.reduce(
              (sum, t) =>
                sum + Number(s.skills.find((k) => k.topic === t && k.track === track)?.level ?? 2),
              0,
            ) / selectedTopics.length
          : s.avg || 2;
      return {
        homework_id: hw.id,
        student_id: s.id,
        challenge_ids: pickHomeworkSet(pool, level, count),
      };
    });
    const { error } = await supabase.from("homework_assignments").insert(assignments);
    if (error) {
      await supabase.from("homework").delete().eq("id", hw.id);
      toast.error(error.message);
      return;
    }
    toast.success("Homework set");
    setTitle("");
    setInstructions("");
    setDueAt("");
    setSelectedTopics([]);
    void qc.invalidateQueries({ queryKey: ["class", classId] });
  };

  const assignLesson = async () => {
    if (!assignLessonSlug) {
      toast.error("Choose a lesson to assign");
      return;
    }
    const { error } = await supabase
      .from("lesson_assignments")
      .insert({ class_id: classId, lesson_slug: assignLessonSlug });
    if (error) {
      toast.error(error.code === "23505" ? "Already assigned to this class" : error.message);
      return;
    }
    toast.success("Lesson assigned");
    setAssignLessonSlug("");
    void qc.invalidateQueries({ queryKey: ["class", classId] });
  };

  const jumpToHomeworkFor = (lessonTopic: string) => {
    setSelectedTopics([lessonTopic]);
    setActiveTab("homework");
    requestAnimationFrame(() => {
      document.getElementById("set-homework")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const resolveHelpRequest = async (id: string) => {
    await supabase.from("homework_help_requests").update({ resolved: true }).eq("id", id);
    void qc.invalidateQueries({ queryKey: ["class", classId] });
  };

  const joinLink =
    typeof window !== "undefined" && data?.cls?.join_code
      ? `${window.location.origin}/join/${data.cls.join_code}`
      : "";

  const copyJoinLink = async () => {
    if (!joinLink) return;
    await navigator.clipboard.writeText(joinLink);
    toast.success("Join link copied");
  };

  const addCoTeacher = async () => {
    if (!coTeacherEmail.trim()) return;
    setAddingCoTeacher(true);
    const { error } = await supabase.rpc("add_class_co_teacher", {
      _class_id: classId,
      _email: coTeacherEmail.trim(),
    });
    setAddingCoTeacher(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Co-teacher added — they now have full access to this class");
    setCoTeacherEmail("");
    void qc.invalidateQueries({ queryKey: ["class", classId] });
  };

  const removeCoTeacher = async (id: string) => {
    const { error } = await supabase.from("class_co_teachers").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Co-teacher removed");
    void qc.invalidateQueries({ queryKey: ["class", classId] });
  };

  const deleteClass = async () => {
    if (!data?.cls || deleteConfirmText.trim() !== data.cls.name) return;
    setDeleting(true);
    const { error } = await supabase.rpc("delete_class", { _class_id: classId });
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      `Class deleted — ${data.students.length} student account${data.students.length === 1 ? "" : "s"} removed`,
    );
    void navigate({ to: "/teacher" });
  };

  const exportRoster = () => {
    const students = data?.students ?? [];
    const topics = topicsFor(track);
    const rows = [
      [
        "Name",
        "Level",
        "XP",
        "Streak",
        "Accuracy %",
        ...topics.map((t) => `${t.label} %`),
        "Average skill %",
        "Last active",
      ],
      ...students.map((s) => [
        s.name,
        String(levelFromXp(s.xp).level),
        String(s.xp),
        String(s.streak),
        String(s.accuracy),
        ...topics.map((t) => {
          const lvl = Number(
            s.skills.find((k) => k.topic === t.key && k.track === track)?.level ?? 1,
          );
          return String(skillPercent(lvl));
        }),
        String(skillPercent(s.avg)),
        s.lastActive ? new Date(s.lastActive).toLocaleDateString("en-GB") : "Not started",
      ]),
    ];
    downloadCsv(`${data?.cls?.name ?? "class"}-roster.csv`, rows);
  };

  const exportHomework = (h: NonNullable<typeof data>["homework"][number]) => {
    const rows = [
      ["Name", "Done", "Total", "Completion %"],
      ...h.completion.map((c) => [
        c.name,
        String(c.done),
        String(c.total),
        c.total ? String(Math.round((c.done / c.total) * 100)) : "0",
      ]),
    ];
    downloadCsv(`${h.title}.csv`, rows);
  };

  const exportLesson = (
    a: NonNullable<typeof data>["lessonAssignments"][number],
    lessonTitle: string,
  ) => {
    const rows = [
      ["Name", "Complete"],
      ...a.completion.map((c) => [c.name, c.complete ? "Yes" : "No"]),
    ];
    downloadCsv(`${lessonTitle}.csv`, rows);
  };

  if (data && !hasAccess) {
    return (
      <div className="panel p-6">
        <p className="font-medium">🔒 You don't have access to this page.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Only this class's own teacher (or an admin) can view it.
        </p>
        <Button asChild className="mt-4">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{data?.cls?.name ?? "Class"}</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          {track === "gcse" ? "GCSE · OCR" : "A LEVEL"} · code{" "}
          <span className="text-primary">{data?.cls?.join_code}</span>
        </p>
        {joinLink ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-border bg-secondary/40 px-2 py-1 font-mono text-xs text-muted-foreground">
              {joinLink}
            </span>
            <Button size="sm" variant="secondary" onClick={copyJoinLink}>
              Copy join link
            </Button>
          </div>
        ) : null}
        <p className="mt-2 max-w-xl text-xs text-muted-foreground">
          Share this link with your students — it's the only way they can join this class and become
          a student here. Signing up separately at h-code.up.railway.app doesn't enroll them in
          anything.
        </p>
      </div>

      <div className="panel space-y-3 p-5">
        <h2 className="text-lg font-semibold">Teachers on this class</h2>
        {data?.cls?.school_id ? (
          <p className="text-sm text-muted-foreground">
            Every teacher at this class's school already has full access automatically — roster,
            homework, lessons, progress — no invite needed. Use "Add teacher" below only to bring in
            someone from outside the school. Only you can remove access or delete the class.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Co-teachers get the same day-to-day access as you — roster, homework, lessons, progress
            — for cover or shared classes. Only you can add or remove them, or delete the class.
          </p>
        )}
        <ul className="space-y-1.5 text-sm">
          <li className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
            <span>
              {data?.cls?.teacher_id === user?.id ? "You" : (data?.ownerName ?? "Owner")}
              <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
                Owner
              </span>
            </span>
          </li>
          {(data?.coTeachers ?? []).map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
            >
              <span>
                {t.teacherId === user?.id ? "You" : t.name}
                {t.email ? (
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{t.email}</span>
                ) : null}
              </span>
              {isPrimaryOwner ? (
                <Button size="sm" variant="secondary" onClick={() => removeCoTeacher(t.id)}>
                  Remove
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        {isPrimaryOwner ? (
          <div className="flex flex-wrap gap-2">
            <Input
              className="max-w-xs"
              placeholder="colleague@school.example"
              value={coTeacherEmail}
              onChange={(e) => setCoTeacherEmail(e.target.value)}
            />
            <Button onClick={addCoTeacher} disabled={addingCoTeacher}>
              {addingCoTeacher ? "Adding…" : "Add teacher"}
            </Button>
          </div>
        ) : null}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="homework">Homework</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          {topicSummary.some((t) => t.avgPercent !== null) ? (
            <div>
              <h2 className="text-xl font-semibold">Class strength by topic</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Where the class as a whole stands — useful for deciding what to re-teach next.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {topicSummary
                  .filter((t) => t.avgPercent !== null)
                  .map((t) => (
                    <div key={t.key} className="panel p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{t.label}</p>
                        <span className="font-mono text-xs text-muted-foreground">
                          {t.avgPercent}%
                        </span>
                      </div>
                      <Progress value={t.avgPercent ?? 0} className="mt-2" />
                      {t.strugglingCount > 0 ? (
                        <p className="mt-2 font-mono text-xs text-destructive">
                          🔴 {t.strugglingCount} struggling here
                        </p>
                      ) : null}
                    </div>
                  ))}
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Students</h2>
            {(data?.students.length ?? 0) > 0 ? (
              <Button size="sm" variant="secondary" onClick={exportRoster}>
                Export roster (CSV)
              </Button>
            ) : null}
          </div>
          <div className="panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left font-mono text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Level</th>
                  <th className="p-3">Accuracy</th>
                  <th className="p-3">Avg skill</th>
                  <th className="p-3">Last active</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {(data?.students ?? []).map((s) => (
                  <Fragment key={s.id}>
                    <tr
                      className="cursor-pointer border-b border-border/60 hover:bg-secondary/30"
                      onClick={() => setExpandedStudent(expandedStudent === s.id ? null : s.id)}
                    >
                      <td className="p-3 font-medium">
                        {s.name}
                        {s.struggling ? (
                          <span className="ml-2 rounded-full bg-destructive/15 px-2 py-0.5 font-mono text-xs text-destructive">
                            🔴 Struggling
                          </span>
                        ) : null}
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {levelFromXp(s.xp).level} · {s.xp} XP
                      </td>
                      <td className="p-3 font-mono text-xs">{s.accuracy}%</td>
                      <td className="p-3 font-mono text-xs">{skillPercent(s.avg)}%</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">
                        {s.lastActive ? new Date(s.lastActive).toLocaleDateString("en-GB") : "—"}
                      </td>
                      <td className="p-3 text-right font-mono text-xs text-muted-foreground">
                        {expandedStudent === s.id ? "▲" : "▼"}
                      </td>
                    </tr>
                    {expandedStudent === s.id ? (
                      <tr className="border-b border-border/60 bg-secondary/10">
                        <td colSpan={6} className="p-4">
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {topicsFor(track).map((t) => {
                              const lvl = Number(
                                s.skills.find((k) => k.topic === t.key && k.track === track)
                                  ?.level ?? 1,
                              );
                              return (
                                <div key={t.key}>
                                  <div className="flex justify-between text-xs">
                                    <span>{t.label}</span>
                                    <span className="font-mono text-muted-foreground">
                                      {skillPercent(lvl)}%
                                    </span>
                                  </div>
                                  <Progress value={skillPercent(lvl)} className="mt-1" />
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
            {(data?.students ?? []).length === 0 ? (
              <p className="p-4 text-muted-foreground">
                No students yet — share the join link above with your class.
              </p>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="lessons" className="space-y-6 pt-4">
          <section className="panel space-y-3 p-5">
            <h2 className="text-lg font-semibold">Assign a lesson</h2>
            <p className="text-sm text-muted-foreground">
              Students in this class see a lesson in their Learn path only once you've assigned it
              here — practice mode stays open regardless.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                className="rounded-md border border-border bg-card px-3 py-2 text-sm"
                value={assignTopic}
                onChange={(e) => {
                  setAssignTopic(e.target.value);
                  setAssignLessonSlug("");
                }}
              >
                <option value="">Choose a topic…</option>
                {topicsWithLessons(track).map((t) => (
                  <option key={t} value={t}>
                    {topicLabel(t)}
                  </option>
                ))}
              </select>
              <select
                className="rounded-md border border-border bg-card px-3 py-2 text-sm"
                value={assignLessonSlug}
                onChange={(e) => setAssignLessonSlug(e.target.value)}
                disabled={!assignTopic}
              >
                <option value="">Choose a lesson…</option>
                {lessonsForTopic(track, assignTopic).map((l) => (
                  <option key={l.slug} value={l.slug}>
                    Lesson {l.order} — {l.title}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={assignLesson}>Assign lesson</Button>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">Lessons assigned</h2>
            <div className="space-y-3">
              {(data?.lessonAssignments ?? []).map((a) => {
                const lesson = getLesson(a.lessonSlug);
                const doneCount = a.completion.filter((c) => c.complete).length;
                const isExpanded = expandedLesson === a.id;
                return (
                  <div key={a.id} className="panel p-4 text-sm">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        className="flex-1 text-left font-medium"
                        onClick={() => setExpandedLesson(isExpanded ? null : a.id)}
                      >
                        {isExpanded ? "▼ " : "▶ "}
                        {lesson
                          ? `${topicLabel(lesson.topic)} · Lesson ${lesson.order} — ${lesson.title}`
                          : a.lessonSlug}
                      </button>
                      <span className="font-mono text-xs text-muted-foreground">
                        {doneCount}/{a.completion.length} complete
                      </span>
                      {lesson ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => exportLesson(a, lesson.title)}
                        >
                          Export
                        </Button>
                      ) : null}
                      {lesson ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => jumpToHomeworkFor(lesson.topic)}
                        >
                          Set homework for this
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          await supabase.from("lesson_assignments").delete().eq("id", a.id);
                          void qc.invalidateQueries({ queryKey: ["class", classId] });
                        }}
                      >
                        Unassign
                      </Button>
                    </div>
                    {isExpanded && a.completion.length > 0 ? (
                      <div className="mt-3 overflow-x-auto border-t border-border pt-3">
                        <table className="text-xs">
                          <thead>
                            <tr>
                              <th className="p-1.5 text-left font-normal text-muted-foreground">
                                Student
                              </th>
                              {a.tasks.map((t, i) => (
                                <th
                                  key={t.slug}
                                  title={t.title}
                                  className="p-1.5 text-center font-mono font-normal text-muted-foreground"
                                >
                                  {t.stretch ? "★" : i + 1}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {a.completion.map((c) => (
                              <tr key={c.id} className="border-t border-border/60">
                                <td className="p-1.5 whitespace-nowrap">{c.name}</td>
                                {c.taskResults.map((passed, i) => (
                                  <td
                                    key={a.tasks[i]!.slug}
                                    className={`p-1.5 text-center ${passed ? "text-success" : "text-muted-foreground"}`}
                                  >
                                    {passed ? "✓" : "○"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {a.tasks
                            .map((t, i) => `${t.stretch ? "★" : i + 1} = ${t.title}`)
                            .join(" · ")}
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {(data?.lessonAssignments ?? []).length === 0 ? (
                <p className="text-muted-foreground">No lessons assigned yet.</p>
              ) : null}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="homework" className="space-y-6 pt-4">
          <section id="set-homework" className="panel space-y-3 p-5">
            <h2 className="text-lg font-semibold">Set homework</h2>
            <p className="text-sm text-muted-foreground">
              Each student gets their own set of challenges, picked at their own skill level for the
              selected topics — not the same list for the whole class.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Topics{" "}
                <span className="font-normal text-muted-foreground">
                  (none selected = all topics, mixed together)
                </span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {topicsFor(track).map((t) => {
                  const checked = selectedTopics.includes(t.key);
                  return (
                    <label
                      key={t.key}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors ${
                        checked
                          ? "border-primary/60 bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:bg-secondary/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={checked}
                        onChange={() =>
                          setSelectedTopics((prev) =>
                            checked ? prev.filter((k) => k !== t.key) : [...prev, t.key],
                          )
                        }
                      />
                      {t.label}
                    </label>
                  );
                })}
              </div>
            </div>
            <select
              className="rounded-md border border-border bg-card px-3 py-2 text-sm"
              value={effort}
              onChange={(e) => setEffort(e.target.value)}
            >
              <option value="low">Low effort — {EFFORT_COUNT["low"]} challenges each</option>
              <option value="medium">
                Medium effort — {EFFORT_COUNT["medium"]} challenges each
              </option>
              <option value="high">High effort — {EFFORT_COUNT["high"]} challenges each</option>
            </select>
            <Input
              placeholder="Instructions (optional)"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
            <Button onClick={setHomework}>Set homework</Button>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">Homework set</h2>
            <div className="space-y-3">
              {(data?.homework ?? []).map((h) => {
                const sorted = [...h.completion].sort((a, b) => a.done - b.done);
                const perStudentCount = Math.max(0, ...sorted.map((c) => c.total));
                const doneCount = sorted.filter((c) => c.total > 0 && c.done === c.total).length;
                const isExpanded = expandedHomework === h.id;
                const openHelp = h.helpRequests.filter((r) => !r.resolved);
                return (
                  <div key={h.id} className="panel p-4 text-sm">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        className="flex-1 text-left font-medium"
                        onClick={() => setExpandedHomework(isExpanded ? null : h.id)}
                      >
                        {isExpanded ? "▼ " : "▶ "}
                        {h.title}
                        {openHelp.length > 0 ? (
                          <span className="ml-2 rounded-full bg-warning/15 px-2 py-0.5 font-mono text-xs text-warning">
                            ✋ {openHelp.length} asked for help
                          </span>
                        ) : null}
                      </button>
                      <span className="font-mono text-xs text-muted-foreground">
                        {doneCount}/{sorted.length} students done · {perStudentCount} challenges
                        each
                        {h.due_at ? ` · due ${new Date(h.due_at).toLocaleDateString("en-GB")}` : ""}
                      </span>
                      <Button size="sm" variant="secondary" onClick={() => exportHomework(h)}>
                        Export
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          await supabase.from("homework").delete().eq("id", h.id);
                          void qc.invalidateQueries({ queryKey: ["class", classId] });
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                    {openHelp.length > 0 ? (
                      <div className="mt-3 space-y-2 border-t border-border pt-3">
                        {openHelp.map((r) => (
                          <div
                            key={r.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-warning/40 bg-warning/5 p-2 text-xs"
                          >
                            <div>
                              <span className="font-medium">{r.studentName}</span>{" "}
                              <span className="text-muted-foreground">
                                ({r.tasksDone}/{r.tasksTotal} done when they asked)
                              </span>
                              {r.message ? (
                                <p className="mt-1 text-muted-foreground">"{r.message}"</p>
                              ) : null}
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => resolveHelpRequest(r.id)}
                            >
                              Mark resolved
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {isExpanded && sorted.length > 0 ? (
                      <div className="mt-3 overflow-x-auto border-t border-border pt-3">
                        <table className="text-xs">
                          <thead>
                            <tr>
                              <th className="p-1.5 text-left font-normal text-muted-foreground">
                                Student
                              </th>
                              {Array.from({ length: perStudentCount }, (_, i) => (
                                <th
                                  key={i}
                                  className="p-1.5 text-center font-mono font-normal text-muted-foreground"
                                >
                                  {i + 1}
                                </th>
                              ))}
                              <th className="p-1.5 text-center font-mono font-normal text-muted-foreground">
                                Done
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {sorted.map((c) => (
                              <tr
                                key={c.id}
                                className="border-t border-border/60 hover:bg-secondary/20"
                              >
                                <td className="p-1.5 whitespace-nowrap font-medium">{c.name}</td>
                                {Array.from({ length: perStudentCount }, (_, i) => {
                                  const t = c.tasks[i];
                                  return (
                                    <td
                                      key={i}
                                      title={t?.title}
                                      className={`p-1.5 text-center ${
                                        t?.passed ? "text-success" : "text-muted-foreground"
                                      }`}
                                    >
                                      {t ? (t.passed ? "✓" : "○") : ""}
                                    </td>
                                  );
                                })}
                                <td className="p-1.5 text-center font-mono whitespace-nowrap text-muted-foreground">
                                  {c.done}/{c.total}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Each student's homework is personalised, so column N isn't the same task
                          for everyone — hover a cell to see which task it is.
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {(data?.homework ?? []).length === 0 ? (
                <p className="text-muted-foreground">No homework set yet.</p>
              ) : null}
            </div>
          </section>
        </TabsContent>
      </Tabs>

      {isPrimaryOwner ? (
        <section className="panel space-y-3 border-destructive/40 p-5">
          <h2 className="text-lg font-semibold text-destructive">Danger zone</h2>
          {!showDeleteConfirm ? (
            <>
              <p className="text-sm text-muted-foreground">
                Permanently delete this class and every student account in it — not just their
                membership, the accounts themselves. This can't be undone.
              </p>
              <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                Delete class
              </Button>
            </>
          ) : (
            <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
              <p className="text-sm">
                This will permanently delete <strong>{data?.cls?.name}</strong> and{" "}
                <strong>
                  {data?.students.length ?? 0} student account
                  {(data?.students.length ?? 0) === 1 ? "" : "s"}
                </strong>{" "}
                — their profiles, progress, and logins are gone for good, not just unenrolled.
              </p>
              <div className="space-y-2">
                <Label htmlFor="confirm-class-name">
                  Type <strong>{data?.cls?.name}</strong> to confirm
                </Label>
                <Input
                  id="confirm-class-name"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  disabled={deleting || deleteConfirmText.trim() !== data?.cls?.name}
                  onClick={deleteClass}
                >
                  {deleting ? "Deleting…" : "Permanently delete"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
