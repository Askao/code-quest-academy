import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { topicLabel } from "@/lib/game";
import { pickRecapChallenge } from "@/lib/progress";
import { completedTaskSlugs, QUIZZES } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/recap")({
  head: () => ({
    meta: [
      { title: "Daily recap — H-Code" },
      {
        name: "description",
        content: "A quick daily check-in on material you've already covered.",
      },
      { property: "og:title", content: "Daily recap — H-Code" },
      {
        property: "og:description",
        content: "A quick daily check-in on material you've already covered.",
      },
    ],
  }),
  component: Recap,
});

function todayStart() {
  return new Date().toISOString().slice(0, 10) + "T00:00:00.000Z";
}

function Recap() {
  const { user } = useAuth();
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["recap", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const [doneToday, recentAttempts, quizPassed, passedRes] = await Promise.all([
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
        supabase.from("quiz_attempts").select("lesson_slug").eq("user_id", uid).eq("passed", true),
        supabase
          .from("attempts")
          .select("passed, challenges!inner(slug)")
          .eq("user_id", uid)
          .eq("passed", true),
      ]);

      const coveredLessons = new Set((quizPassed.data ?? []).map((r) => r.lesson_slug));
      const passedSlugs = new Set(
        ((passedRes.data ?? []) as unknown as { challenges: { slug: string } }[]).map(
          (r) => r.challenges.slug,
        ),
      );
      const onlySlugs = completedTaskSlugs("gcse", passedSlugs, coveredLessons);

      const excludeIds = (recentAttempts.data ?? []).map((a) => a.challenge_id);
      const challenge = onlySlugs.size
        ? await pickRecapChallenge({ userId: uid, track: "gcse", excludeIds, onlySlugs })
        : null;

      const eligibleQuiz = QUIZZES.filter((q) => coveredLessons.has(q.lessonSlug));
      const quiz = eligibleQuiz.length
        ? eligibleQuiz[Math.floor(Math.random() * eligibleQuiz.length)]!
        : null;

      return {
        doneToday: (doneToday.count ?? 0) > 0,
        challenge,
        quiz,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Daily recap</h1>
        <p className="mt-1 text-muted-foreground">
          One quick task and one quick question from material you've already covered — keeps it
          fresh instead of forgotten.
        </p>
      </div>

      {data?.doneToday ? (
        <div className="panel p-6 text-center">
          <p className="text-2xl">✓</p>
          <p className="mt-2 font-medium">You've done today's recap already.</p>
          <p className="mt-1 text-sm text-muted-foreground">Come back tomorrow for the next one.</p>
          <Button asChild variant="secondary" className="mt-4">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="panel p-6">
            <h2 className="text-lg font-semibold">Quick task</h2>
            {data?.challenge ? (
              <>
                <p className="mt-1 text-sm text-muted-foreground">
                  {topicLabel(data.challenge.topic)} · difficulty {data.challenge.difficulty}/5
                </p>
                <Button asChild className="mt-4">
                  <Link
                    to="/play/$slug"
                    params={{ slug: data.challenge.slug }}
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

          <div className="panel p-6">
            <h2 className="text-lg font-semibold">Quick question</h2>
            {data?.quiz ? (
              <>
                <p className="mt-2 text-sm font-medium">{data.quiz.question}</p>
                <div className="mt-3 space-y-1.5">
                  {data.quiz.options.map((option) => {
                    const chosen = quizAnswer === option;
                    const isCorrect = option === data.quiz!.answer;
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
                  <p className="mt-2 text-xs text-muted-foreground">{data.quiz.explanation}</p>
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
    </div>
  );
}
