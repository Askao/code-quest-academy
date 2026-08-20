import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { levelFromXp, skillPercent, topicLabel, topicsFor, type TrackKey } from "@/lib/game";
import { pickHomeworkSet } from "@/lib/progress";
import {
  getLesson,
  isLessonComplete,
  lessonsForTopic,
  topicsWithLessons,
} from "@/lib/content";

const EFFORT_COUNT: Record<string, number> = { low: 2, medium: 4, high: 6 };

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
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [topic, setTopic] = useState("all");
  const [effort, setEffort] = useState("medium");
  const [assignTopic, setAssignTopic] = useState("");
  const [assignLessonSlug, setAssignLessonSlug] = useState("");

  const { data } = useQuery({
    queryKey: ["class", classId],
    queryFn: async () => {
      const cls = await supabase.from("classes").select("*").eq("id", classId).maybeSingle();
      const members = await supabase
        .from("class_members")
        .select("student_id")
        .eq("class_id", classId);
      const ids = (members.data ?? []).map((m) => m.student_id);
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
        const avg = mine.length
          ? mine.reduce((a, b) => a + Number(b.level), 0) / mine.length
          : 1;
        const mineAttempts = (attempts.data ?? []).filter((a) => a.user_id === p.id);
        const accuracy = mineAttempts.length
          ? Math.round((mineAttempts.filter((a) => a.passed).length / mineAttempts.length) * 100)
          : 0;
        return {
          id: p.id,
          name: p.full_name ?? p.email ?? "Student",
          xp: s?.xp ?? 0,
          streak: s?.streak_days ?? 0,
          avg,
          accuracy,
          lastActive: s?.last_active,
          skills: mine,
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
      const passedForHomework =
        ids.length && homeworkChallengeIds.length
          ? await supabase
              .from("attempts")
              .select("user_id, challenge_id")
              .in("user_id", ids)
              .in("challenge_id", homeworkChallengeIds)
              .eq("passed", true)
          : { data: [] };
      const passedSet = new Set(
        (passedForHomework.data ?? []).map((a) => `${a.user_id}:${a.challenge_id}`),
      );

      return {
        cls: cls.data,
        students,
        lessonAssignments: (lessonAssignmentsRes.data ?? []).map((a) => ({
          id: a.id,
          lessonSlug: a.lesson_slug,
          createdAt: a.created_at,
          completion: students.map((s) => ({
            id: s.id,
            name: s.name,
            complete: isLessonComplete(
              a.lesson_slug,
              passedTaskSlugsByUser.get(s.id) ?? new Set<string>(),
              quizPassedByUser.get(s.id) ?? new Set<string>(),
            ),
          })),
        })),
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
            };
          }),
        })),
      };
    },
  });

  const track = (data?.cls?.track ?? "gcse") as TrackKey;

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
    let query = supabase.from("challenges").select("id, difficulty").eq("track", track);
    if (topic !== "all") query = query.eq("topic", topic);
    const { data: pool } = await query;
    if (!pool || pool.length === 0) {
      toast.error("No challenges match that topic");
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

    // Each student gets challenges picked at their own level for this
    // topic (their overall average level when "all topics" is chosen) —
    // not the same list for the whole class.
    const assignments = students.map((s) => {
      const level =
        topic !== "all"
          ? Number(s.skills.find((k) => k.topic === topic && k.track === track)?.level ?? 2)
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
      toast.error(
        error.code === "23505" ? "Already assigned to this class" : error.message,
      );
      return;
    }
    toast.success("Lesson assigned");
    setAssignLessonSlug("");
    void qc.invalidateQueries({ queryKey: ["class", classId] });
  };

  const jumpToHomeworkFor = (lessonTopic: string) => {
    setTopic(lessonTopic);
    document.getElementById("set-homework")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{data?.cls?.name ?? "Class"}</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          {track === "gcse" ? "GCSE · OCR" : "A LEVEL"} · join code{" "}
          <span className="text-primary">{data?.cls?.join_code}</span>
        </p>
      </div>

      <section className="panel space-y-3 p-5">
        <h2 className="text-lg font-semibold">Assign a lesson</h2>
        <p className="text-sm text-muted-foreground">
          Students in this class see a lesson in their Learn path only once you've assigned it here
          — practice mode stays open regardless.
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
            return (
              <div key={a.id} className="panel p-4 text-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex-1 font-medium">
                    {lesson ? `${topicLabel(lesson.topic)} · Lesson ${lesson.order} — ${lesson.title}` : a.lessonSlug}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {doneCount}/{a.completion.length} complete
                  </span>
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
                {a.completion.length > 0 ? (
                  <div className="mt-3 grid gap-1.5 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-3">
                    {a.completion.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className={c.complete ? "text-success" : ""}>
                          {c.complete ? "✓" : "○"} {c.name}
                        </span>
                      </div>
                    ))}
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

      <section id="set-homework" className="panel space-y-3 p-5">
        <h2 className="text-lg font-semibold">Set homework</h2>
        <p className="text-sm text-muted-foreground">
          Each student gets their own set of challenges, picked at their own skill level for this
          topic — not the same list for the whole class.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
          <select
            className="rounded-md border border-border bg-card px-3 py-2 text-sm"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            <option value="all">All topics</option>
            {topicsFor(track).map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-border bg-card px-3 py-2 text-sm"
            value={effort}
            onChange={(e) => setEffort(e.target.value)}
          >
            <option value="low">Low effort — {EFFORT_COUNT.low} challenges each</option>
            <option value="medium">Medium effort — {EFFORT_COUNT.medium} challenges each</option>
            <option value="high">High effort — {EFFORT_COUNT.high} challenges each</option>
          </select>
        </div>
        <Input
          placeholder="Instructions (optional)"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
        <Button onClick={setHomework}>Set homework</Button>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Students</h2>
        <div className="space-y-3">
          {(data?.students ?? []).map((s) => (
            <div key={s.id} className="panel p-5">
              <div className="flex flex-wrap items-center gap-4">
                <p className="flex-1 font-semibold">{s.name}</p>
                <span className="font-mono text-xs text-muted-foreground">
                  Level {levelFromXp(s.xp).level} · {s.xp} XP · {s.streak}🔥 · {s.accuracy}% accuracy
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {topicsFor(track).map((t) => {
                  const lvl = Number(
                    s.skills.find((k) => k.topic === t.key && k.track === track)?.level ?? 1,
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
              <p className="mt-3 text-xs text-muted-foreground">
                Average skill level {skillPercent(s.avg)}%
                {s.lastActive
                  ? ` · last active ${new Date(s.lastActive).toLocaleDateString("en-GB")}`
                  : " · not started yet"}
              </p>
            </div>
          ))}
          {(data?.students ?? []).length === 0 ? (
            <p className="text-muted-foreground">
              No students yet — share the join code above with your class.
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Homework set</h2>
        <div className="space-y-3">
          {(data?.homework ?? []).map((h) => {
            const sorted = [...h.completion].sort((a, b) => a.done - b.done);
            const perStudentCount = Math.max(0, ...sorted.map((c) => c.total));
            return (
              <div key={h.id} className="panel p-4 text-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex-1 font-medium">{h.title}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {perStudentCount} challenges each
                    {h.due_at ? ` · due ${new Date(h.due_at).toLocaleDateString("en-GB")}` : ""}
                  </span>
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
                {sorted.length > 0 ? (
                  <div className="mt-3 grid gap-1.5 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-3">
                    {sorted.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-2 text-xs">
                        <span
                          className={c.done === c.total && c.total > 0 ? "text-success" : ""}
                        >
                          {c.done === c.total && c.total > 0 ? "✓" : "○"} {c.name}
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {c.done}/{c.total}
                        </span>
                      </div>
                    ))}
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
    </div>
  );
}
