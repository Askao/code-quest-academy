import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { topicLabel } from "@/lib/game";
import { LESSONS, tasksForLesson, topicsWithLessons } from "@/lib/content";

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
  const { user } = useAuth();

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

  const topics = topicsWithLessons("gcse");

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

      <div className="space-y-6">
        {topics.map((topic) => {
          const lessons = LESSONS.filter((l) => l.track === "gcse" && l.topic === topic);
          const all = lessons.flatMap((l) => tasksForLesson(l.slug));
          const done = all.filter((t) => passed.has(t.slug)).length;
          return (
            <section key={topic} className="panel p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl font-semibold">{topicLabel(topic)}</h2>
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
              <ol className="mt-5 grid gap-3 md:grid-cols-3">
                {lessons.map((lesson) => {
                  const tasks = tasksForLesson(lesson.slug);
                  const lessonDone = tasks.filter((t) => passed.has(t.slug)).length;
                  return (
                    <li key={lesson.slug}>
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
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
