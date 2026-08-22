import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ResetProgressControl } from "@/components/ResetProgressControl";
import { corePracticeTasksForTopic, lessonsForTopic, projectGroupsForTopic } from "@/lib/content";
import {
  BADGES,
  levelFromXp,
  skillLabel,
  skillPercent,
  topicLabel,
  topicsFor,
  type Board,
} from "@/lib/game";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — H-Code" },
      { name: "description", content: "Your XP, streak, skill levels and homework." },
      { property: "og:title", content: "Dashboard — H-Code" },
      { property: "og:description", content: "Your XP, streak, skill levels and homework." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, fullName, isTeacher, schoolId } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user && !isTeacher,
    queryFn: async () => {
      const uid = user!.id;
      const todayStart = new Date().toISOString().slice(0, 10) + "T00:00:00.000Z";
      const [stats, skills, badges, memberships, recapToday, passedRes] = await Promise.all([
        supabase.from("stats").select("*").eq("user_id", uid).maybeSingle(),
        supabase.from("skills").select("*").eq("user_id", uid),
        supabase.from("badges").select("*").eq("user_id", uid),
        supabase.from("class_members").select("class_id, classes(*)").eq("student_id", uid),
        supabase
          .from("attempts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("mode", "recap")
          .eq("passed", true)
          .gte("created_at", todayStart),
        // Whole-course passed slugs, for the long-term "your journey"
        // section below (topics mastered, projects finished) - a
        // three-year span needs a sense of overall shape, not just today's
        // streak and level.
        supabase.from("attempts").select("passed, challenges!inner(slug)").eq("user_id", uid).eq("passed", true),
      ]);
      const classIds = (memberships.data ?? []).map((m) => m.class_id);
      const homeworkRes = classIds.length
        ? await supabase
            .from("homework")
            .select("*, classes(name)")
            .in("class_id", classIds)
            .order("due_at", { ascending: true })
        : { data: [] };
      const homeworkList = homeworkRes.data ?? [];
      const homeworkIds = homeworkList.map((hw) => hw.id);

      // Same "personalized list if assigned, else the shared list" fallback
      // used by the individual homework page, just batched across every
      // homework this student has, so the dashboard can show completion
      // per item without a query per homework.
      const assignments = homeworkIds.length
        ? await supabase
            .from("homework_assignments")
            .select("homework_id, challenge_ids")
            .in("homework_id", homeworkIds)
            .eq("student_id", uid)
        : { data: [] };
      const assignmentMap = new Map(
        (assignments.data ?? []).map((a) => [a.homework_id, a.challenge_ids as string[]]),
      );
      const homeworkWithIds = homeworkList.map((hw) => ({
        ...hw,
        challengeIds: assignmentMap.get(hw.id) ?? (hw.challenge_ids as string[] | null) ?? [],
      }));
      const allChallengeIds = [...new Set(homeworkWithIds.flatMap((hw) => hw.challengeIds))];
      const hwAttempts = allChallengeIds.length
        ? await supabase
            .from("attempts")
            .select("challenge_id")
            .eq("user_id", uid)
            .eq("passed", true)
            .in("challenge_id", allChallengeIds)
        : { data: [] };
      const passedSet = new Set((hwAttempts.data ?? []).map((a) => a.challenge_id));
      const homework = homeworkWithIds.map((hw) => {
        const total = hw.challengeIds.length;
        const completed = hw.challengeIds.filter((id) => passedSet.has(id)).length;
        return { ...hw, total, completed };
      });

      const passedSlugs = new Set(
        ((passedRes.data ?? []) as unknown as { challenges: { slug: string } }[]).map(
          (r) => r.challenges.slug,
        ),
      );
      // A skill row's `passes` counts every pass ever recorded against that
      // topic (see recordAttempt in progress.ts), so summing across topics
      // gives "challenges passed, ever" without a separate count query.
      const totalPassed = (skills.data ?? []).reduce((sum, k) => sum + (k.passes ?? 0), 0);

      return {
        stats: stats.data,
        skills: skills.data ?? [],
        badges: badges.data ?? [],
        classes: (memberships.data ?? []).map((m) => m.classes).filter(Boolean),
        homework,
        recapDoneToday: (recapToday.count ?? 0) > 0,
        passedSlugs,
        totalPassed,
      };
    },
  });

  // Same "owned + explicit co-teacher + automatic same-school" merge as the
  // Teacher area's own class list, so this summary never disagrees with it.
  const { data: teacherClasses } = useQuery({
    queryKey: ["dashboard-teacher-classes", user?.id, schoolId],
    enabled: !!user && isTeacher,
    queryFn: async () => {
      const [owned, coTaught, schoolClasses] = await Promise.all([
        supabase
          .from("classes")
          .select("id, name, track, join_code, class_members(count)")
          .eq("teacher_id", user!.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("class_co_teachers")
          .select("classes(id, name, track, join_code, class_members(count))")
          .eq("teacher_id", user!.id),
        schoolId
          ? supabase
              .from("classes")
              .select("id, name, track, join_code, class_members(count)")
              .eq("school_id", schoolId)
              .neq("teacher_id", user!.id)
          : Promise.resolve({ data: [] }),
      ]);
      const mine = owned.data ?? [];
      const sharedRaw = [
        ...(coTaught.data ?? []).map((r) => r.classes).filter(Boolean),
        ...(schoolClasses.data ?? []),
      ] as NonNullable<typeof owned.data>[number][];
      const seen = new Set(mine.map((c) => c.id));
      const shared = sharedRaw.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
      const classes = [...mine, ...shared];
      const students = classes.reduce((sum, c) => sum + (c.class_members?.[0]?.count ?? 0), 0);
      return { classes, students };
    },
  });

  const xp = data?.stats?.xp ?? 0;
  const { level, intoLevel, needed } = levelFromXp(xp);
  const tracks = new Set((data?.classes ?? []).map((c) => c!.track as "gcse" | "alevel"));
  if (tracks.size === 0) tracks.add("gcse");
  // If any of a student's GCSE classes is AQA, show AQA's content (the
  // extra Databases topic included) - matches how `tracks` above already
  // collapses multiple classes down to one row per track rather than
  // tracking per-class.
  const gcseBoard: Board = (data?.classes ?? []).some(
    (c) => c!.track === "gcse" && c!.board === "aqa",
  )
    ? "aqa"
    : "ocr";

  const currentHomework = (data?.homework ?? []).filter((hw) => hw.completed < hw.total || hw.total === 0);
  const completedHomework = (data?.homework ?? [])
    .filter((hw) => hw.total > 0 && hw.completed >= hw.total)
    .slice()
    .reverse();

  // Long-term shape of the whole course, not just today - a topic counts
  // "mastered" once every core practice task in it is passed (stretch
  // tasks excluded - same bar as the student-facing COMPLETED badge and
  // reset gate on /practice), and a project counts done once every part
  // of it is passed (see projectGroupsForTopic in content.ts).
  const passedSlugs = data?.passedSlugs ?? new Set<string>();
  let topicsMastered = 0;
  let topicsWithPool = 0;
  const completedProjects: { title: string; topicLabel: string }[] = [];
  for (const trk of tracks) {
    for (const t of topicsFor(trk, trk === "gcse" ? gcseBoard : undefined)) {
      const pool = corePracticeTasksForTopic(trk, t.key);
      if (pool.length > 0) {
        topicsWithPool += 1;
        if (pool.every((task) => passedSlugs.has(task.slug))) topicsMastered += 1;
      }
      for (const g of projectGroupsForTopic(trk, t.key)) {
        if (g.slugs.every((slug) => passedSlugs.has(slug))) {
          completedProjects.push({ title: g.title, topicLabel: t.label });
        }
      }
    }
  }

  if (isTeacher) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Hi {fullName || "there"} 👋</h1>
          <p className="mt-1 text-muted-foreground">Here's where your classes are at right now.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="panel p-5">
            <p className="font-mono text-xs text-muted-foreground">CLASSES</p>
            <p className="mt-1 text-3xl font-bold text-primary">
              {teacherClasses?.classes.length ?? 0}
            </p>
          </div>
          <div className="panel p-5">
            <p className="font-mono text-xs text-muted-foreground">STUDENTS</p>
            <p className="mt-1 text-3xl font-bold text-accent">{teacherClasses?.students ?? 0}</p>
          </div>
          <div className="panel flex flex-col justify-between p-5">
            <p className="font-mono text-xs text-muted-foreground">TEACHER AREA</p>
            <Button asChild size="sm" className="mt-3 self-start">
              <Link to="/teacher">Manage classes</Link>
            </Button>
          </div>
        </div>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Your classes</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(teacherClasses?.classes ?? []).map((c) => (
              <div key={c.id} className="panel p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{c.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-xs ${
                      c.track === "gcse" ? "bg-gcse/15 text-gcse" : "bg-alevel/15 text-alevel"
                    }`}
                  >
                    {c.track === "gcse" ? "GCSE" : "A LEVEL"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.class_members?.[0]?.count ?? 0} student(s)
                </p>
                <Button asChild size="sm" className="mt-4">
                  <Link to="/teacher/$classId" params={{ classId: c.id }}>
                    Open class
                  </Link>
                </Button>
              </div>
            ))}
            {(teacherClasses?.classes.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">
                No classes yet —{" "}
                <Link to="/teacher" className="text-primary underline">
                  create your first one
                </Link>
                .
              </p>
            ) : null}
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-lg font-semibold">Your own practice</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Teacher and admin accounts can still practise, in case you want to try a task before
            setting it.
          </p>
          <Button asChild size="sm" variant="secondary" className="mt-3">
            <Link to="/practice">Practise</Link>
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Hi {fullName || "there"} 👋</h1>
        <p className="mt-1 text-muted-foreground">Here's where you're at right now.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel p-5">
          <p className="font-mono text-xs text-muted-foreground">LEVEL</p>
          <p className="mt-1 text-3xl font-bold text-primary">{level}</p>
          <Progress value={(intoLevel / needed) * 100} className="mt-3" />
          <p className="mt-2 text-xs text-muted-foreground">
            {intoLevel} / {needed} XP to level {level + 1}
          </p>
        </div>
        <div className="panel p-5">
          <p className="font-mono text-xs text-muted-foreground">STREAK</p>
          <p className="mt-1 text-3xl font-bold text-warning">{data?.stats?.streak_days ?? 0} 🔥</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Best: {data?.stats?.best_streak ?? 0} days
          </p>
        </div>
        <div className="panel p-5">
          <p className="font-mono text-xs text-muted-foreground">TOTAL XP</p>
          <p className="mt-1 text-3xl font-bold text-accent">{xp}</p>
          <Button asChild size="sm" className="mt-3">
            <Link to="/practice">Practise now</Link>
          </Button>
        </div>
      </div>

      <div className="panel flex flex-wrap items-center gap-4 p-5">
        <div className="flex-1">
          <p className="font-mono text-xs text-muted-foreground">TODAY'S RECAP</p>
          <p className="mt-1 font-medium">
            {data?.recapDoneToday
              ? "Done for today ✓"
              : "One quick task and one quick question to keep things fresh."}
          </p>
        </div>
        <Button asChild variant={data?.recapDoneToday ? "secondary" : "default"}>
          <Link to="/practice">{data?.recapDoneToday ? "Do it again" : "Start recap"}</Link>
        </Button>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Your journey</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="panel p-5">
            <p className="font-mono text-xs text-muted-foreground">CHALLENGES PASSED</p>
            <p className="mt-1 text-3xl font-bold text-primary">{data?.totalPassed ?? 0}</p>
            <p className="mt-2 text-xs text-muted-foreground">Every task, ever — the whole course.</p>
          </div>
          <div className="panel p-5">
            <p className="font-mono text-xs text-muted-foreground">TOPICS MASTERED</p>
            <p className="mt-1 text-3xl font-bold text-success">
              {topicsMastered}
              <span className="text-lg text-muted-foreground">/{topicsWithPool}</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Every practice task passed in that topic.
            </p>
          </div>
          <div className="panel p-5">
            <p className="font-mono text-xs text-muted-foreground">PROJECTS BUILT</p>
            <p className="mt-1 text-3xl font-bold text-accent">{completedProjects.length}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {completedProjects.length > 0
                ? completedProjects.map((p) => p.title).join(" · ")
                : "None finished yet — Projects live on the Practice page."}
            </p>
          </div>
        </div>
      </section>

      {currentHomework.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Current homework</h2>
          <div className="space-y-3">
            {currentHomework.map((hw) => (
              <div key={hw.id} className="panel flex flex-wrap items-center gap-3 p-4">
                <div className="flex-1">
                  <p className="font-medium">{hw.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {hw.instructions || "Complete the set challenges."}
                    {hw.due_at ? ` · Due ${new Date(hw.due_at).toLocaleDateString("en-GB")}` : ""}
                    {hw.total > 0 ? ` · ${hw.completed}/${hw.total} done` : ""}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link to="/homework/$homeworkId" params={{ homeworkId: hw.id }}>
                    {hw.completed > 0 ? "Continue" : "Start"}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {completedHomework.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Completed homework</h2>
          <div className="space-y-3">
            {completedHomework.map((hw) => (
              <div key={hw.id} className="panel flex flex-wrap items-center gap-3 p-4">
                <div className="flex-1">
                  <p className="font-medium">
                    {hw.title} <span className="text-success">✓</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hw.classes?.name}
                    {hw.due_at ? ` · Due ${new Date(hw.due_at).toLocaleDateString("en-GB")}` : ""}
                    {` · ${hw.completed}/${hw.total} done`}
                  </p>
                </div>
                <Button asChild size="sm" variant="secondary">
                  <Link to="/homework/$homeworkId" params={{ homeworkId: hw.id }}>
                    Review
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Your skill levels</h2>
        <div className="space-y-6">
          {[...tracks].map((track) => (
            <div key={track}>
              <p
                className={`mb-2 font-mono text-xs ${track === "gcse" ? "text-gcse" : "text-alevel"}`}
              >
                {track === "gcse" ? `GCSE · ${gcseBoard.toUpperCase()}` : "A LEVEL"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {topicsFor(track, gcseBoard).map((t) => {
                  const skill = data?.skills.find((s) => s.topic === t.key && s.track === track);
                  const lvl = Number(skill?.level ?? 1);
                  return (
                    <div key={t.key} className="panel p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{t.label}</p>
                        <span className="font-mono text-xs text-muted-foreground">
                          {skillPercent(lvl)}%
                        </span>
                      </div>
                      <Progress value={skillPercent(lvl)} className="mt-3" />
                      <p className="mt-2 text-xs text-muted-foreground">{skillLabel(lvl)}</p>
                      <ResetProgressControl
                        userId={user!.id}
                        track={track}
                        topic={t.key}
                        topicLabel={t.label}
                        targetLabel="your"
                        lessons={lessonsForTopic(track, t.key).map((l) => ({
                          slug: l.slug,
                          title: l.title,
                        }))}
                        onDone={() => void qc.invalidateQueries({ queryKey: ["dashboard", user?.id] })}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="panel p-5">
          <h2 className="text-lg font-semibold">Your classes</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(data?.classes ?? []).map((c) => (
              <li key={c!.id} className="flex items-center justify-between">
                <span>{c!.name}</span>
                <span className="font-mono text-xs text-muted-foreground uppercase">
                  {c!.track}
                </span>
              </li>
            ))}
            {(data?.classes ?? []).length === 0 ? (
              <li className="text-muted-foreground">
                You're not in a class — practise freely at your own pace.
              </li>
            ) : null}
          </ul>
        </div>

        <div className="panel p-5">
          <h2 className="text-lg font-semibold">Badges</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {Object.entries(BADGES).map(([key, badge]) => {
              const earned = (data?.badges ?? []).some((b) => b.badge_key === key);
              return (
                <div
                  key={key}
                  className={`rounded-lg border border-border p-3 text-sm ${earned ? "" : "opacity-35"}`}
                >
                  <span className="text-lg">{badge.icon}</span>
                  <p className="font-medium">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        Recent topics:{" "}
        {(data?.skills ?? []).map((s) => topicLabel(s.topic)).join(", ") || "none yet"}
      </p>
    </div>
  );
}
