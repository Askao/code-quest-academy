import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LessonNotes } from "@/components/LessonNotes";
import { topicLabel } from "@/lib/game";
import {
  getLesson,
  isLessonComplete,
  isTopicComplete,
  lessonsForTopic,
  quizForLesson,
  tasksForLesson,
  topicsWithLessons,
} from "@/lib/content";

const TIER_LABEL: Record<number, string> = {
  1: "Direct instruction",
  2: "Short context",
  3: "Scenario",
  4: "Exam-style",
};

const QUIZ_PASS_PERCENT = 70;

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

function QuickCheck({ lessonSlug, alreadyPassed }: { lessonSlug: string; alreadyPassed: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const questions = quizForLesson(lessonSlug);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  if (questions.length === 0) return null;

  const submit = async () => {
    if (!user) return;
    const correct = questions.filter((q, i) => answers[i] === q.answer).length;
    setScore(correct);
    setSubmitted(true);
    const passed = correct / questions.length >= QUIZ_PASS_PERCENT / 100;
    const { error } = await supabase.from("quiz_attempts").insert({
      user_id: user.id,
      lesson_slug: lessonSlug,
      score: correct,
      total: questions.length,
      passed,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    if (passed) toast.success(`Quiz passed — ${correct}/${questions.length}`);
    void qc.invalidateQueries({ queryKey: ["quiz-passed-lessons", user.id] });
  };

  const retry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  return (
    <section className="panel p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Quick check</h2>
        {alreadyPassed ? <span className="font-mono text-xs text-primary">✓ passed</span> : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        A few questions to check the theory has landed, not just the code.
      </p>
      <ol className="mt-4 space-y-5">
        {questions.map((q, i) => (
          <li key={i}>
            <p className="text-sm font-medium">{q.question}</p>
            <div className="mt-2 space-y-1.5">
              {q.options.map((option) => {
                const chosen = answers[i] === option;
                const showResult = submitted;
                const isCorrect = option === q.answer;
                return (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm transition-colors ${
                      showResult
                        ? isCorrect
                          ? "border-success/50 bg-success/10"
                          : chosen
                            ? "border-destructive/50 bg-destructive/10"
                            : "border-border"
                        : chosen
                          ? "border-primary/60 bg-secondary/40"
                          : "border-border hover:bg-secondary/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${lessonSlug}-${i}`}
                      className="accent-primary"
                      disabled={submitted}
                      checked={chosen}
                      onChange={() => setAnswers((a) => ({ ...a, [i]: option }))}
                    />
                    {option}
                  </label>
                );
              })}
            </div>
            {submitted ? (
              <p className="mt-1.5 text-xs text-muted-foreground">{q.explanation}</p>
            ) : null}
          </li>
        ))}
      </ol>
      {submitted ? (
        <div className="mt-5 flex items-center gap-3">
          <span className="font-mono text-sm">
            {score}/{questions.length} correct
          </span>
          <Button size="sm" variant="secondary" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : (
        <Button
          className="mt-5"
          disabled={Object.keys(answers).length < questions.length}
          onClick={submit}
        >
          Submit answers
        </Button>
      )}
    </section>
  );
}

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
  const requiredTasks = tasks.filter((t) => !t.stretch);
  const stretchTasks = tasks.filter((t) => t.stretch);
  const siblings = lessonsForTopic(lesson.track, lesson.topic);
  const next = siblings.find((l) => l.order === lesson.order + 1);
  const done = tasks.filter((t) => passed.has(t.slug)).length;
  const lessonQuiz = quizForLesson(lesson.slug);
  const quizGateOpen = lessonQuiz.length === 0 || quizPassed.has(lesson.slug);
  const allRequiredPassed = requiredTasks.every((t) => passed.has(t.slug));

  const topicOrder = topicsWithLessons(lesson.track);
  const topicIndex = topicOrder.indexOf(lesson.topic);
  const previousTopicComplete =
    topicIndex <= 0 || isTopicComplete(lesson.track, topicOrder[topicIndex - 1]!, passed, quizPassed);
  const previousSibling = siblings.find((l) => l.order === lesson.order - 1);
  const previousLessonComplete =
    !previousSibling || isLessonComplete(previousSibling.slug, passed, quizPassed);
  const locked = !previousTopicComplete || !previousLessonComplete;

  if (locked) {
    return (
      <div className="panel p-6">
        <p className="font-medium">🔒 This lesson is locked.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {!previousTopicComplete
            ? `Finish ${topicLabel(topicOrder[topicIndex - 1]!)} first.`
            : `Finish "${previousSibling?.title}" first.`}
        </p>
        <Button asChild className="mt-4">
          <Link to="/learn">Back to lessons</Link>
        </Button>
      </div>
    );
  }

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

          <QuickCheck lessonSlug={lesson.slug} alreadyPassed={quizPassed.has(lesson.slug)} />
        </div>

        <section className="panel h-fit p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Practice tasks</h2>
            <span className="font-mono text-xs text-muted-foreground">
              {done}/{tasks.length} passed
            </span>
          </div>
          {!quizGateOpen ? (
            <div className="mt-4 rounded-lg border border-border p-4 opacity-60">
              <p className="font-medium">🔒 Locked</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Complete the quick check above first.
              </p>
            </div>
          ) : (
            <ol className="mt-4 space-y-2">
              {requiredTasks.map((task, i) => {
                const taskLocked = i > 0 && !passed.has(requiredTasks[i - 1]!.slug);
                if (taskLocked) {
                  return (
                    <li key={task.slug} className="rounded-lg border border-border p-3 opacity-50">
                      <span className="flex items-start gap-3">
                        <span className="text-muted-foreground">🔒</span>
                        <span className="min-w-0">
                          <span className="block font-medium">{task.title}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            Complete the previous task first
                          </span>
                        </span>
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={task.slug}>
                    <Link
                      to="/play/$slug"
                      params={{ slug: task.slug }}
                      search={{
                        mode: "practice" as const,
                        track: task.track,
                        topic: task.topic,
                        lesson: lesson.slug,
                      }}
                      className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/60 hover:bg-secondary/40"
                    >
                      <span
                        className={passed.has(task.slug) ? "text-primary" : "text-muted-foreground"}
                      >
                        {passed.has(task.slug) ? "✓" : "○"}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium">
                          {task.title}
                          {task.part ? (
                            <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                              Part {task.part}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                          {TIER_LABEL[task.tier]} · difficulty {task.difficulty}/5 · {task.xp} XP
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
          {quizGateOpen && stretchTasks.length > 0 ? (
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-sm font-medium text-primary">⭐ Extra challenge</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Optional — harder than you need for this lesson. Skip it or come back later.
              </p>
              {!allRequiredPassed ? (
                <div className="mt-3 rounded-lg border border-border p-3 opacity-50">
                  <span className="flex items-start gap-3">
                    <span className="text-muted-foreground">🔒</span>
                    <span className="text-sm text-muted-foreground">
                      Complete the practice tasks above first
                    </span>
                  </span>
                </div>
              ) : (
                <ol className="mt-3 space-y-2">
                  {stretchTasks.map((task) => (
                    <li key={task.slug}>
                      <Link
                        to="/play/$slug"
                        params={{ slug: task.slug }}
                        search={{
                          mode: "practice" as const,
                          track: task.track,
                          topic: task.topic,
                          lesson: lesson.slug,
                        }}
                        className="flex items-start gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3 transition-colors hover:border-primary/70"
                      >
                        <span
                          className={passed.has(task.slug) ? "text-primary" : "text-muted-foreground"}
                        >
                          {passed.has(task.slug) ? "✓" : "⭐"}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium">{task.title}</span>
                          <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                            difficulty {task.difficulty}/5 · {task.xp} XP
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ) : null}
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
