import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  isTopicInReview,
  topicBoardTag,
  topicLabel,
  type Board,
  type TrackKey,
} from "@/lib/game";
import {
  isTopicComplete,
  lessonAccess,
  lessonsForTopic,
  tasksForLesson,
  topicsWithLessons,
  type LessonViewer,
} from "@/lib/content";
import { TopicRoadmap, type RoadmapTopic } from "@/components/TopicRoadmap";

export const Route = createFileRoute("/_authenticated/learn/")({
  head: () => ({
    meta: [
      { title: "Lessons — H-Code" },
      {
        name: "description",
        content:
          "Structured Python lesson paths for GCSE (OCR & AQA) and A level: teaching notes, worked examples and laddered practice tasks.",
      },
      { property: "og:title", content: "Lessons — H-Code" },
      {
        property: "og:description",
        content: "Work through Python topic by topic with worked examples and exam-style tasks.",
      },
    ],
  }),
  component: LearnIndex,
});

const TRACK_KEY = "hcode-learn-track";

function LearnIndex() {
  const { user, isTeacher } = useAuth();
  // Free to switch, same as Practice - AQA isn't extra content behind a
  // teacher's say-so, it's an alternate view of the same GCSE track, and
  // teachers in particular have no class-membership row of their own to
  // auto-detect a board from, so they need a manual way in to preview it.
  const [board, setBoard] = useState<Board>("ocr");
  const [chosenTrack, setChosenTrack] = useState<TrackKey | null>(null);

  const { data: passed = new Set<string>() } = useQuery({
    queryKey: ["passed-slugs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("attempts")
        .select("passed, challenges!inner(slug)")
        .eq("user_id", user!.id)
        .eq("passed", true);
      const rows = (data ?? []) as unknown as { challenges: { slug: string } }[];
      return new Set(rows.map((r) => r.challenges.slug));
    },
  });

  const { data: quizPassed = new Set<string>() } = useQuery({
    queryKey: ["quiz-passed-lessons", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("quiz_attempts")
        .select("lesson_slug")
        .eq("user_id", user!.id)
        .eq("passed", true);
      return new Set((data ?? []).map((r) => r.lesson_slug));
    },
  });

  // Which course(s) a student is on comes from their classes. Teachers and
  // admins have no class rows of their own and can switch freely.
  const { data: memberships = [] } = useQuery({
    queryKey: ["learn-memberships", user?.id],
    enabled: !!user && !isTeacher,
    queryFn: async () => {
      const { data } = await supabase
        .from("class_members")
        .select("class_id, classes(track)")
        .eq("student_id", user!.id);
      return data ?? [];
    },
  });
  const classIds = memberships.map((m) => m.class_id);
  const enrolled = classIds.length > 0;
  const alevelStudent = memberships.some((m) => m.classes?.track === "alevel");
  const gcseStudent = memberships.some((m) => m.classes?.track === "gcse");

  // Teachers, and students in both kinds of class, get the switch. Everyone
  // else sees the one course they're on (GCSE when they're in no class).
  const canSwitch = isTeacher || (alevelStudent && gcseStudent);
  const defaultTrack: TrackKey = alevelStudent && !gcseStudent ? "alevel" : "gcse";
  const track: TrackKey = canSwitch ? (chosenTrack ?? defaultTrack) : defaultTrack;

  // Remember a teacher's choice between visits.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TRACK_KEY);
      if (saved === "gcse" || saved === "alevel") setChosenTrack(saved);
    } catch {
      // Storage can be unavailable; the default is fine.
    }
  }, []);
  const pickTrack = (t: TrackKey) => {
    setChosenTrack(t);
    try {
      localStorage.setItem(TRACK_KEY, t);
    } catch {
      // Not remembered this time.
    }
  };

  // Mirrors learn.$lessonSlug.tsx: an enrolled student's lessons stay
  // locked until their teacher assigns them, on top of the mastery gate.
  const { data: assignedSlugs = new Set<string>() } = useQuery({
    queryKey: ["assigned-lesson-slugs", classIds],
    enabled: enrolled && !isTeacher,
    queryFn: async () => {
      const { data } = await supabase
        .from("lesson_assignments")
        .select("lesson_slug")
        .in("class_id", classIds);
      return new Set((data ?? []).map((r) => r.lesson_slug));
    },
  });

  const viewer: LessonViewer = {
    isTeacher,
    enrolled,
    alevelStudent,
    assignedSlugs,
    passedTaskSlugs: passed,
    quizPassedLessonSlugs: quizPassed,
  };

  // The main topics for this course: GCSE for the chosen board, or the A
  // level topics. Topics still in review only reach teachers.
  const mainTopics = topicsWithLessons(track, track === "gcse" ? board : undefined).filter(
    (t) => isTeacher || !isTopicInReview(t),
  );
  const inReview = mainTopics.filter((t) => isTopicInReview(t));
  // A level students also get every GCSE topic, always open, as foundations.
  const foundationTopics = track === "alevel" ? topicsWithLessons("gcse") : [];

  const roadmap: RoadmapTopic[] = mainTopics.map((topic, i) => {
    const complete = isTopicComplete(track, topic, passed, quizPassed);
    // Enrolled students are gated per-lesson by teacher assignment instead
    // of topic order (see lessonAccess) - a topic section is never shown as
    // locked to them, so an assigned lesson in it is reachable regardless of
    // what's come before.
    const prevComplete =
      isTeacher ||
      enrolled ||
      i === 0 ||
      isTopicComplete(track, mainTopics[i - 1]!, passed, quizPassed);
    return {
      key: topic,
      label: topicLabel(topic),
      state: complete ? "complete" : prevComplete ? "current" : "locked",
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          {canSwitch ? (
            <div
              className="flex overflow-hidden rounded-md border border-border"
              role="group"
              aria-label="Course"
            >
              {(["gcse", "alevel"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={track === t}
                  onClick={() => pickTrack(t)}
                  className={`px-3 py-1.5 font-mono text-xs font-semibold ${
                    track === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "gcse" ? "GCSE" : "A LEVEL"}
                </button>
              ))}
            </div>
          ) : (
            <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
              {track === "gcse" ? "GCSE" : "A level"}
            </p>
          )}
          {track === "gcse" ? (
            <div className="flex overflow-hidden rounded-md border border-border">
              {(["ocr", "aqa"] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  aria-pressed={board === b}
                  onClick={() => setBoard(b)}
                  className={`px-2.5 py-1 font-mono text-xs ${
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
        </div>
        <h1 className="mt-2 text-3xl font-semibold">
          {track === "gcse" ? "Lesson paths" : "A level lesson paths"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {track === "gcse"
            ? "Each topic runs from teaching notes and a worked example through to exam-style wording. Work down the list, or jump to whatever you need."
            : isTeacher
              ? "Everything from GCSE, plus the A level topics on top. Topics marked In review are only visible to teachers until they're approved."
              : "Your A level topics, with every GCSE topic open below if you want to go back over something."}
        </p>
      </div>

      {isTeacher && inReview.length > 0 ? (
        <div className="flex items-start gap-3 rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm">
          <span
            aria-hidden="true"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
          >
            !
          </span>
          <span>
            <strong>
              {inReview.length} {inReview.length === 1 ? "topic is" : "topics are"} waiting for
              review.
            </strong>{" "}
            Students can't see {inReview.length === 1 ? "it" : "them"} yet. Read the notes and try
            the tasks; once a topic reads clearly, it can be approved and opened to students.
          </span>
        </div>
      ) : null}

      {mainTopics.length > 0 ? <TopicRoadmap topics={roadmap} /> : null}

      {mainTopics.length === 0 ? (
        <p className="panel p-6 text-sm text-muted-foreground">
          No A level topics are open yet. Your teacher will open them as the course goes on. In
          the meantime, every GCSE topic is below.
        </p>
      ) : null}

      <div className="space-y-6">
        {mainTopics.map((topic, topicIndex) => (
          <TopicSection
            key={topic}
            track={track}
            topic={topic}
            viewer={viewer}
            passed={passed}
            topicLocked={!enrolled && !isTeacher && roadmap[topicIndex]!.state === "locked"}
            previousTopic={topicIndex > 0 ? mainTopics[topicIndex - 1]! : null}
          />
        ))}
      </div>

      {foundationTopics.length > 0 ? (
        <section className="panel space-y-4 p-6" aria-label="GCSE foundations">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-xl font-semibold">GCSE foundations</h2>
            <span className="text-sm text-muted-foreground">
              Every GCSE topic, always open to A level students for revision or catching up.
            </span>
          </div>
          <ul className="flex flex-wrap gap-2">
            {foundationTopics.map((topic) => {
              const first = lessonsForTopic("gcse", topic)[0];
              return first ? (
                <li key={topic}>
                  <Link
                    to="/learn/$lessonSlug"
                    params={{ lessonSlug: first.slug }}
                    className="inline-block rounded-full border border-border px-3 py-1.5 text-sm hover:border-primary/60"
                  >
                    {topicLabel(topic)}
                  </Link>
                </li>
              ) : null;
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function TopicSection({
  track,
  topic,
  viewer,
  passed,
  topicLocked,
  previousTopic,
}: {
  track: TrackKey;
  topic: string;
  viewer: LessonViewer;
  passed: Set<string>;
  topicLocked: boolean;
  previousTopic: string | null;
}) {
  const lessons = lessonsForTopic(track, topic);
  const all = lessons.flatMap((l) => tasksForLesson(l.slug));
  const done = all.filter((t) => passed.has(t.slug)).length;
  const board = topicBoardTag(topic);
  return (
    <section id={topic} className={`panel p-6 ${topicLocked ? "opacity-50" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex flex-wrap items-center gap-2 text-xl font-semibold">
          {topicLocked ? "🔒" : null} {topicLabel(topic)}
          {isTopicInReview(topic) ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[11px] font-medium text-primary">
              In review
            </span>
          ) : null}
          {board ? (
            <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
              {board} only
            </span>
          ) : null}
        </h2>
        <span className="font-mono text-xs text-muted-foreground">
          {done}/{all.length} tasks passed
        </span>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary"
          style={{ width: `${all.length ? (done / all.length) * 100 : 0}%` }}
        />
      </div>
      {topicLocked && previousTopic ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Complete {topicLabel(previousTopic)} first to unlock this topic.
        </p>
      ) : (
        <ol className="mt-5 grid gap-3 md:grid-cols-3">
          {lessons.map((lesson) => {
            const tasks = tasksForLesson(lesson.slug);
            const lessonDone = tasks.filter((t) => passed.has(t.slug)).length;
            const access = lessonAccess(lesson, viewer);
            return (
              <li key={lesson.slug}>
                {!access.open ? (
                  <div className="block h-full rounded-xl border border-border p-4 opacity-50">
                    <span className="font-mono text-xs text-muted-foreground">
                      🔒 Lesson {lesson.order}
                    </span>
                    <h3 className="mt-1 font-medium">{lesson.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {access.reason === "not-assigned"
                        ? "Your teacher hasn't set this lesson yet"
                        : `Complete lesson ${lesson.order - 1} first`}
                    </p>
                  </div>
                ) : (
                  <Link
                    to="/learn/$lessonSlug"
                    params={{ lessonSlug: lesson.slug }}
                    className="block h-full rounded-xl border border-border p-4 transition-colors hover:border-primary/60 hover:bg-secondary/40"
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      Lesson {lesson.order}
                    </span>
                    <h3 className="mt-1 font-medium">{lesson.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{lesson.summary}</p>
                    <p className="mt-3 font-mono text-xs text-primary">
                      {lessonDone}/{tasks.length} tasks
                    </p>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
