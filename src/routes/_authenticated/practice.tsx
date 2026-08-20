import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { pickChallenge } from "@/lib/progress";
import { skillLabel, skillPercent, topicsFor, type TrackKey } from "@/lib/game";
import { completedTaskSlugs, isLessonComplete, lessonsForTopic } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/practice")({
  head: () => ({
    meta: [
      { title: "Practise — H-Code" },
      {
        name: "description",
        content: "Pick a topic and get a fresh Python challenge matched to your level.",
      },
      { property: "og:title", content: "Practise — H-Code" },
      {
        property: "og:description",
        content: "Pick a topic and get a fresh Python challenge matched to your level.",
      },
    ],
  }),
  component: Practice,
});

function Practice() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [track, setTrack] = useState<TrackKey>("gcse");

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
  const topicUnlocked = (topic: string) => {
    if (track !== "gcse") return true;
    const lessons = lessonsForTopic(track, topic);
    return (
      lessons.length === 0 ||
      lessons.some((l) => isLessonComplete(l.slug, data?.passedSlugs ?? new Set(), data?.quizPassed ?? new Set()))
    );
  };

  const onlySlugs =
    track === "gcse" && data
      ? completedTaskSlugs(track, data.passedSlugs, data.quizPassed)
      : undefined;

  const start = async (topic: string | undefined, mode: "practice" | "boss") => {
    // Mixed boss battles (no single topic) pull from every topic they've
    // completed at once - pitched a notch above their current average so
    // it's a genuine stretch, not their everyday level.
    const level = topic ? levelFor(topic) : Math.min(5, overallLevel() + 1);
    const challenge = await pickChallenge({
      track,
      ...(topic ? { topic } : {}),
      level,
      excludeIds: data?.recent ?? [],
      ...(onlySlugs ? { onlySlugs } : {}),
    });
    if (!challenge) {
      toast.error(
        track === "gcse"
          ? "Finish a lesson in this topic first — Practice only covers material you've learned."
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

  const alevelLocked = track === "alevel" && !data?.allowAlevel;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Practise</h1>
        <p className="mt-1 text-muted-foreground">
          Every session pulls a different challenge, chosen from your current level in that topic.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["gcse", "alevel"] as const).map((t) => (
          <Button
            key={t}
            variant={track === t ? "default" : "secondary"}
            onClick={() => setTrack(t)}
          >
            {t === "gcse" ? "GCSE (OCR)" : "A level"}
          </Button>
        ))}
        <Button
          variant="secondary"
          onClick={() => {
            const topics = topicsFor(track).filter((t) => topicUnlocked(t.key));
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
        {topicsFor(track).map((t) => {
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
            </div>
          );
        })}
      </div>

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
