import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { pickChallenge, pickRecapChallenge } from "@/lib/progress";
import {
  skillLabel,
  skillPercent,
  topicLabel,
  topicsFor,
  type Board,
  type TrackKey,
} from "@/lib/game";
import {
  completedTaskSlugs,
  isLessonComplete,
  lessonsForTopic,
  practiceTasksForTopic,
  projectsForTopic,
  QUIZZES,
} from "@/lib/content";

export const Route = createFileRoute("/_authenticated/practice")({
  head: () => ({
    meta: [
      { title: "Practise — H-Code" },
      {
        name: "description",
        content: "Daily recap, adaptive practice, projects and boss battles, all in one place.",
      },
      { property: "og:title", content: "Practise — H-Code" },
      {
        property: "og:description",
        content: "Daily recap, adaptive practice, projects and boss battles, all in one place.",
      },
    ],
  }),
  component: Practice,
});

function todayStart() {
  return new Date().toISOString().slice(0, 10) + "T00:00:00.000Z";
}

function Practice() {
  const { user, isTeacher } = useAuth();
  const navigate = useNavigate();
  const [track, setTrack] = useState<TrackKey>("gcse");
  // Free to switch, unlike A level - AQA isn't extra/higher content behind
  // a teacher's say-so, it's an alternate view of the same GCSE track, so
  // any self-learner can explore it same as an AQA class's students would.
  const [board, setBoard] = useState<Board>("ocr");
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [browsingTopic, setBrowsingTopic] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["practice-context", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const [skills, memberships, attempts, passedRes, quizRes] = await Promise.all([
        supabase.from("skills").select("*").eq("user_id", uid),
        supabase.from("class_members").select("classes(track)").eq("student_id", uid),
        supabase
          .from("attempts")
          .select("challenge_id")
          .eq("user_id", uid)
          .eq("passed", true)
          .order("created_at", { ascending: false })
          .limit(15),
        supabase
          .from("attempts")
          .select("passed, challenges!inner(slug)")
          .eq("user_id", uid)
          .eq("passed", true),
        supabase.from("quiz_attempts").select("lesson_slug").eq("user_id", uid).eq("passed", true),
      ]);
      const passedSlugs = new Set(
        ((passedRes.data ?? []) as unknown as { challenges: { slug: string } }[]).map(
          (r) => r.challenges.slug,
        ),
      );
      const quizPassed = new Set((quizRes.data ?? []).map((r) => r.lesson_slug));
      return {
        skills: skills.data ?? [],
        allowAlevel: (memberships.data ?? []).some((m) => m.classes?.track === "alevel"),
        recent: (attempts.data ?? []).map((a) => a.challenge_id),
        passedSlugs,
        quizPassed,
      };
    },
  });

  const { data: recap } = useQuery({
    queryKey: ["recap", user?.id, data?.passedSlugs, data?.quizPassed, isTeacher],
    enabled: !!user && !!data,
    queryFn: async () => {
      const uid = user!.id;
      const [doneToday, recentAttempts] = await Promise.all([
        supabase
          .from("attempts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("mode", "recap")
          .gte("created_at", todayStart()),
        supabase
          .from("attempts")
          .select("challenge_id")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const onlySlugs = completedTaskSlugs("gcse", data!.passedSlugs, data!.quizPassed);
      const excludeIds = (recentAttempts.data ?? []).map((a) => a.challenge_id);
      // Admins/teachers reviewing content have no real progress to recap from -
      // fall back to any challenge/quiz so they can preview the feature rather
      // than always seeing the "practise a topic first" empty state.
      const challenge = onlySlugs.size
        ? await pickRecapChallenge({ userId: uid, track: "gcse", excludeIds, onlySlugs })
        : isTeacher
          ? await pickChallenge({ track: "gcse", level: 3, excludeIds })
          : null;

      const eligibleQuiz = isTeacher
        ? QUIZZES
        : QUIZZES.filter((q) => data!.quizPassed.has(q.lessonSlug));
      const quiz = eligibleQuiz.length
        ? eligibleQuiz[Math.floor(Math.random() * eligibleQuiz.length)]!
        : null;

      return { doneToday: (doneToday.count ?? 0) > 0, challenge, quiz };
    },
  });

  const { data: seededProjectSlugs } = useQuery({
    queryKey: ["seeded-project-slugs"],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("challenges")
        .select("slug")
        .eq("track", "gcse")
        .eq("is_project", true);
      return new Set((rows ?? []).map((r) => r.slug));
    },
  });

  const levelFor = (topic: string) =>
    Number(data?.skills.find((s) => s.topic === topic && s.track === track)?.level ?? 1);

  // Average skill across every topic they've actually practised in this
  // track - the mixed boss battle pulls from topics they've completed
  // (via onlySlugs below), so it should reflect real ability, not a flat
  // guess.
  const overallLevel = () => {
    const relevant = (data?.skills ?? []).filter((s) => s.track === track);
    if (relevant.length === 0) return 2;
    return relevant.reduce((sum, s) => sum + Number(s.level), 0) / relevant.length;
  };

  // GCSE topics stay locked in Practice until at least one of their lessons
  // is complete - practising unfamiliar wording/content is exactly what
  // confused students. A-level has no lesson content yet, so it's exempt.
  // Admins/teachers skip this entirely so they can review any topic without
  // needing to fake their way through lessons first.
  const topicUnlocked = (topic: string) => {
    if (isTeacher) return true;
    if (track !== "gcse") return true;
    const lessons = lessonsForTopic(track, topic);
    return (
      lessons.length === 0 ||
      lessons.some((l) =>
        isLessonComplete(l.slug, data?.passedSlugs ?? new Set(), data?.quizPassed ?? new Set()),
      )
    );
  };

  // Some GCSE topics are lesson-only (see practiceExcluded in game.ts) - they
  // don't teach a skill of their own to randomly practise, so they're left
  // out of this grid, "Surprise me" and boss battles entirely, even though
  // their lessons are still reachable normally through /learn.
  const practiceTopics = topicsFor(track, board).filter(
    (t) => !("practiceExcluded" in t && t.practiceExcluded),
  );

  // Practice draws from each topic's dedicated practice-task pool, not the
  // tasks already shown in that topic's lessons - pickChallenge transparently
  // falls back to the ordinary pool for a topic that has no practice tasks
  // authored yet, so this stays safe while that content is still being
  // written topic by topic. A topic only reaches these buttons once
  // topicUnlocked(t.key) is already true, so single-topic practice/boss
  // needs no further slug restriction - only the topic-less "mixed" battle
  // (which spans every unlocked topic at once) needs one, to keep it from
  // reaching into a topic the student hasn't even started.
  const mixedPracticeSlugs =
    track === "gcse"
      ? new Set(
          practiceTopics
            .filter((t) => topicUnlocked(t.key))
            .flatMap((t) => practiceTasksForTopic(track, t.key).map((p) => p.slug)),
        )
      : undefined;

  const start = async (topic: string | undefined, mode: "practice" | "boss") => {
    // Mixed boss battles (no single topic) pull from every topic they've
    // unlocked at once - pitched a notch above their current average so
    // it's a genuine stretch, not their everyday level.
    const level = topic ? levelFor(topic) : Math.min(5, overallLevel() + 1);
    const challenge = await pickChallenge({
      track,
      ...(topic ? { topic } : {}),
      level,
      excludeIds: data?.recent ?? [],
      practiceOnly: true,
      ...(!topic && mixedPracticeSlugs && !isTeacher ? { onlySlugs: mixedPracticeSlugs } : {}),
    });
    if (!challenge) {
      toast.error(
        track === "gcse"
          ? "No practice tasks for this topic yet — check back soon"
          : "No challenges available for that topic yet",
      );
      return;
    }
    if (mode === "boss") {
      sessionStorage.setItem(
        "hcode-boss",
        JSON.stringify({
          endsAt: Date.now() + 5 * 60 * 1000,
          score: 0,
          track,
          topic: topic ?? null,
        }),
      );
    }
    void navigate({
      to: "/play/$slug",
      params: { slug: challenge.slug },
      search: { mode, track, ...(topic ? { topic } : {}) },
    });
  };

  const alevelLocked = track === "alevel" && !data?.allowAlevel && !isTeacher;

  const topicsWithProjects = topicsFor("gcse", board)
    .map((t) => ({ ...t, projects: projectsForTopic("gcse", t.key) }))
    .filter((t) => t.projects.some((p) => seededProjectSlugs?.has(p.slug)));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Practise</h1>
        <p className="mt-1 text-muted-foreground">
          Every session pulls a different challenge, chosen from your current level in that topic.
        </p>
      </div>

      <section className="panel p-5">
        <h2 className="text-lg font-semibold">Today's recap</h2>
        {recap?.doneToday ? (
          <p className="mt-2 text-sm text-muted-foreground">
            ✓ Done for today — come back tomorrow for the next one.
          </p>
        ) : (
          <div className="mt-3 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">Quick task</h3>
              {recap?.challenge ? (
                <>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {topicLabel(recap.challenge.topic)} · difficulty {recap.challenge.difficulty}/5
                  </p>
                  <Button asChild size="sm" className="mt-3">
                    <Link
                      to="/play/$slug"
                      params={{ slug: recap.challenge.slug }}
                      search={{ mode: "recap" as const }}
                    >
                      Start
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Practise a topic first — recap picks from what you've already covered.
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">Quick question</h3>
              {recap?.quiz ? (
                <>
                  <p className="mt-2 text-sm font-medium">{recap.quiz.question}</p>
                  <div className="mt-3 space-y-1.5">
                    {recap.quiz.options.map((option) => {
                      const chosen = quizAnswer === option;
                      const isCorrect = option === recap.quiz!.answer;
                      return (
                        <label
                          key={option}
                          className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm ${
                            quizAnswer
                              ? isCorrect
                                ? "border-success/50 bg-success/10"
                                : chosen
                                  ? "border-destructive/50 bg-destructive/10"
                                  : "border-border"
                              : "border-border hover:bg-secondary/30"
                          }`}
                        >
                          <input
                            type="radio"
                            name="recap-quiz"
                            className="accent-primary"
                            disabled={!!quizAnswer}
                            checked={chosen}
                            onChange={() => setQuizAnswer(option)}
                          />
                          {option}
                        </label>
                      );
                    })}
                  </div>
                  {quizAnswer ? (
                    <p className="mt-2 text-xs text-muted-foreground">{recap.quiz.explanation}</p>
                  ) : null}
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Pass a lesson quiz first — recap picks from questions you've already seen.
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {(["gcse", "alevel"] as const).map((t) => (
          <Button
            key={t}
            variant={track === t ? "default" : "secondary"}
            onClick={() => setTrack(t)}
          >
            {t === "gcse" ? "GCSE" : "A level"}
          </Button>
        ))}
        {track === "gcse" ? (
          <div className="flex overflow-hidden rounded-md border border-border">
            {(["ocr", "aqa"] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBoard(b)}
                className={`px-3 py-1.5 font-mono text-xs ${
                  board === b
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {b.toUpperCase()}
              </button>
            ))}
          </div>
        ) : null}
        <Button
          variant="secondary"
          onClick={() => {
            const topics = practiceTopics.filter((t) => topicUnlocked(t.key));
            const pick = topics[Math.floor(Math.random() * topics.length)];
            if (pick) void start(pick.key, "practice");
            else toast.error("Finish a lesson first — nothing unlocked to surprise you with yet");
          }}
        >
          🎲 Surprise me
        </Button>
      </div>

      {alevelLocked ? (
        <div className="panel border-alevel/40 p-5 text-sm text-muted-foreground">
          A level content is a separate track. You can explore it, but your GCSE progress and
          homework stay completely separate — nothing here appears in your GCSE skill levels.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {practiceTopics.map((t) => {
          const lvl = levelFor(t.key);
          const unlocked = topicUnlocked(t.key);
          if (!unlocked) {
            return (
              <div key={t.key} className="panel flex flex-col p-5 opacity-50">
                <p className="font-semibold">🔒 {t.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Finish a lesson in this topic to unlock practice.
                </p>
              </div>
            );
          }
          return (
            <div key={t.key} className="panel flex flex-col p-5">
              <p className="font-semibold">{t.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.blurb}</p>
              <Progress value={skillPercent(lvl)} className="mt-4" />
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {skillPercent(lvl)}% · {skillLabel(lvl)}
              </p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => start(t.key, "practice")}>
                  Practise
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => start(t.key, "boss")}
                  title="5 minute timed run"
                >
                  Boss ⚔
                </Button>
              </div>
              <button
                type="button"
                onClick={() => setBrowsingTopic(browsingTopic === t.key ? null : t.key)}
                className="mt-3 text-left font-mono text-xs text-muted-foreground underline decoration-dotted hover:text-foreground"
              >
                {browsingTopic === t.key ? "▲ Hide task list" : "🔍 Find a specific task"}
              </button>
              {browsingTopic === t.key ? (
                <div className="mt-2 max-h-72 space-y-1 overflow-y-auto rounded-md border border-border p-3">
                  {practiceTasksForTopic(track, t.key).map((task) => {
                    const done = data?.passedSlugs.has(task.slug) ?? false;
                    return (
                      <Link
                        key={task.slug}
                        to="/play/$slug"
                        params={{ slug: task.slug }}
                        search={{ mode: "practice" as const, track, topic: t.key }}
                        className={`flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-secondary/40 ${
                          done ? "text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        <span className={done ? "text-success" : "text-muted-foreground"}>
                          {done ? "✓" : "○"}
                        </span>
                        {task.title}
                      </Link>
                    );
                  })}
                  {practiceTasksForTopic(track, t.key).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No dedicated practice tasks for this topic yet — "Practise" above still works,
                      picking from the wider question bank.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {topicsWithProjects.length > 0 ? (
        <section>
          <h2 className="mb-1 text-xl font-semibold">Projects</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Longer, harder programs that pull together everything you've learned in a topic — a real
            test, not a quick drill.
          </p>
          <div className="space-y-6">
            {topicsWithProjects.map((t) => {
              const unlocked = topicUnlocked(t.key);
              if (!unlocked) {
                return (
                  <div key={t.key} className="panel p-5 opacity-50">
                    <p className="font-semibold">🔒 {t.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Finish a lesson in this topic to unlock its projects.
                    </p>
                  </div>
                );
              }
              return (
                <div key={t.key}>
                  <p className="mb-2 text-sm font-semibold text-muted-foreground">{t.label}</p>
                  <div className="space-y-3">
                    {t.projects
                      .filter((p) => seededProjectSlugs?.has(p.slug))
                      .map((p) => {
                        const done = data?.passedSlugs.has(p.slug) ?? false;
                        return (
                          <div key={p.slug} className="panel flex flex-wrap items-center gap-3 p-4">
                            <span className={done ? "text-success" : "text-muted-foreground"}>
                              {done ? "✓" : "🏗"}
                            </span>
                            <div className="flex-1">
                              <p className="font-medium">{p.title}</p>
                              <p className="font-mono text-xs text-muted-foreground">
                                difficulty {p.difficulty}/5 · {p.xp} XP
                              </p>
                            </div>
                            <Button asChild size="sm" variant={done ? "secondary" : "default"}>
                              <Link
                                to="/play/$slug"
                                params={{ slug: p.slug }}
                                search={{ mode: "project", track: "gcse", topic: t.key }}
                              >
                                {done ? "Redo" : "Start"}
                              </Link>
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="panel flex flex-wrap items-center gap-4 p-5">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Mixed boss battle</h2>
          <p className="text-sm text-muted-foreground">
            Five minutes, random topics from this track, 1.25× XP. How many can you clear?
          </p>
        </div>
        <Button onClick={() => start(undefined, "boss")}>Start boss battle</Button>
      </div>
    </div>
  );
}
