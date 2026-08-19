import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LessonNotes } from "@/components/LessonNotes";
import { topicLabel } from "@/lib/game";
import { getLesson, lessonsForTopic, tasksForLesson } from "@/lib/content";

const TIER_LABEL: Record<number, string> = {
  1: "Direct instruction",
  2: "Short context",
  3: "Scenario",
  4: "Exam-style",
};

export const Route = createFileRoute("/_authenticated/learn/$lessonSlug")({
  head: () => ({
    meta: [
      { title: "Lesson — H-Code" },
      {
        name: "description",
        content: "Teaching notes, a worked example and laddered practice tasks for this topic.",
      },
      { property: "og:title", content: "Lesson — H-Code" },
      {
        property: "og:description",
        content: "Teaching notes, a worked example and laddered practice tasks for this topic.",
      },
    ],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { lessonSlug } = Route.useParams();
  const { user } = useAuth();
  const lesson = getLesson(lessonSlug);

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

  if (!lesson) {
    return (
      <div className="panel p-6">
        <p className="text-muted-foreground">That lesson doesn't exist.</p>
        <Button asChild className="mt-4">
          <Link to="/learn">Back to lessons</Link>
        </Button>
      </div>
    );
  }

  const tasks = tasksForLesson(lesson.slug);
  const siblings = lessonsForTopic(lesson.track, lesson.topic);
  const next = siblings.find((l) => l.order === lesson.order + 1);
  const done = tasks.filter((t) => passed.has(t.slug)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/learn" className="font-mono text-xs text-muted-foreground hover:text-foreground">
          ← Lessons
        </Link>
        <span className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
          {topicLabel(lesson.topic)} · lesson {lesson.order} of {siblings.length}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="panel p-6">
            <h1 className="text-3xl font-semibold">{lesson.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{lesson.summary}</p>
            <div className="mt-5">
              <LessonNotes notes={lesson.notes} />
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="text-lg font-semibold">Worked example</h2>
            <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-secondary/40 p-4 text-xs">
              <code>{lesson.worked_example}</code>
            </pre>
            {lesson.worked_example_note ? (
              <p className="mt-3 text-sm text-muted-foreground">{lesson.worked_example_note}</p>
            ) : null}
          </section>
        </div>

        <section className="panel h-fit p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Practice tasks</h2>
            <span className="font-mono text-xs text-muted-foreground">
              {done}/{tasks.length} passed
            </span>
          </div>
          <ol className="mt-4 space-y-2">
            {tasks.map((task) => (
              <li key={task.slug}>
                <Link
                  to="/play/$slug"
                  params={{ slug: task.slug }}
                  search={{ mode: "practice" as const, track: task.track, topic: task.topic }}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/60 hover:bg-secondary/40"
                >
                  <span className={passed.has(task.slug) ? "text-primary" : "text-muted-foreground"}>
                    {passed.has(task.slug) ? "✓" : "○"}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">{task.title}</span>
                    <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                      {TIER_LABEL[task.tier]} · difficulty {task.difficulty}/5 · {task.xp} XP
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          {next ? (
            <Button asChild variant="secondary" className="mt-5 w-full">
              <Link to="/learn/$lessonSlug" params={{ lessonSlug: next.slug }}>
                Next: {next.title}
              </Link>
            </Button>
          ) : null}
        </section>
      </div>
    </div>
  );
}
