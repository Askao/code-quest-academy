import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { topicLabel } from "@/lib/game";
import {
  LESSONS,
  isLessonAssigned,
  isLessonComplete,
  isTopicComplete,
  tasksForLesson,
  topicsWithLessons,
} from "@/lib/content";
import { TopicRoadmap, type RoadmapTopic } from "@/components/TopicRoadmap";

export const Route = createFileRoute("/_authenticated/learn/")({
  head: () => ({
    meta: [
      { title: "Lessons — H-Code" },
      {
        name: "description",
        content:
          "Structured Python lesson paths for GCSE OCR: teaching notes, worked examples and laddered practice tasks.",
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

function LearnIndex() {
  const { user, isTeacher } = useAuth();

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

  // Mirrors learn.$lessonSlug.tsx: an enrolled student's lessons stay
  // locked until their teacher assigns them, on top of the mastery gate.
  // Teachers/admins are exempt (see isTeacher use below) - they need to
  // freely browse every lesson, not progress through it like a student.
  const { data: classIds = [] } = useQuery({
    queryKey: ["class-ids", user?.id],
    enabled: !!user && !isTeacher,
    queryFn: async () => {
      const { data } = await supabase
        .from("class_members")
        .select("class_id")
        .eq("student_id", user!.id);
      return (data ?? []).map((r) => r.class_id);
    },
  });
  const enrolled = classIds.length > 0;

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

  const topics = topicsWithLessons("gcse");
  const roadmap: RoadmapTopic[] = topics.map((topic, i) => {
    const complete = isTopicComplete("gcse", topic, passed, quizPassed);
    const prevComplete =
      isTeacher || i === 0 || isTopicComplete("gcse", topics[i - 1]!, passed, quizPassed);
    return {
      key: topic,
      label: topicLabel(topic),
      state: complete ? "complete" : prevComplete ? "current" : "locked",
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
          GCSE · OCR
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Lesson paths</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Each topic runs from teaching notes and a worked example through to exam-style wording.
          Work down the list, or jump to whatever you need.
        </p>
      </div>

      <TopicRoadmap topics={roadmap} />

      <div className="space-y-6">
        {topics.map((topic, topicIndex) => {
          const lessons = LESSONS.filter((l) => l.track === "gcse" && l.topic === topic);
          const all = lessons.flatMap((l) => tasksForLesson(l.slug));
          const done = all.filter((t) => passed.has(t.slug)).length;
          const topicLocked = roadmap[topicIndex]!.state === "locked";
          return (
            <section
              key={topic}
              id={topic}
              className={`panel p-6 ${topicLocked ? "opacity-50" : ""}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  {topicLocked ? "🔒" : null} {topicLabel(topic)}
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
              {topicLocked ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Complete {topicLabel(topics[topicIndex - 1]!)} first to unlock this topic.
                </p>
              ) : (
                <ol className="mt-5 grid gap-3 md:grid-cols-3">
                  {lessons.map((lesson, lessonIndex) => {
                    const tasks = tasksForLesson(lesson.slug);
                    const lessonDone = tasks.filter((t) => passed.has(t.slug)).length;
                    const masteryLocked =
                      lessonIndex > 0 &&
                      !isLessonComplete(lessons[lessonIndex - 1]!.slug, passed, quizPassed);
                    const notAssigned = enrolled && !isLessonAssigned(lesson.slug, assignedSlugs);
                    const lessonLocked = !isTeacher && (masteryLocked || notAssigned);
                    return (
                      <li key={lesson.slug}>
                        {lessonLocked ? (
                          <div className="block h-full rounded-xl border border-border p-4 opacity-50">
                            <span className="font-mono text-xs text-muted-foreground">
                              🔒 Lesson {lesson.order}
                            </span>
                            <h3 className="mt-1 font-medium">{lesson.title}</h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {masteryLocked
                                ? `Complete lesson ${lesson.order - 1} first`
                                : "Your teacher hasn't set this lesson yet"}
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
        })}
      </div>
    </div>
  );
}
