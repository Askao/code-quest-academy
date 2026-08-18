import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { pickChallenge } from "@/lib/progress";
import { skillLabel, topicsFor, type TrackKey } from "@/lib/game";

export const Route = createFileRoute("/_authenticated/practice")({
  head: () => ({
    meta: [
      { title: "Practise — PyForge" },
      {
        name: "description",
        content: "Pick a topic and get a fresh Python challenge matched to your level.",
      },
      { property: "og:title", content: "Practise — PyForge" },
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
      const [skills, memberships, attempts] = await Promise.all([
        supabase.from("skills").select("*").eq("user_id", uid),
        supabase.from("class_members").select("classes(track)").eq("student_id", uid),
        supabase
          .from("attempts")
          .select("challenge_id")
          .eq("user_id", uid)
          .eq("passed", true)
          .order("created_at", { ascending: false })
          .limit(15),
      ]);
      return {
        skills: skills.data ?? [],
        allowAlevel: (memberships.data ?? []).some((m) => m.classes?.track === "alevel"),
        recent: (attempts.data ?? []).map((a) => a.challenge_id),
      };
    },
  });

  const levelFor = (topic: string) =>
    Number(data?.skills.find((s) => s.topic === topic && s.track === track)?.level ?? 1);

  const start = async (topic: string | undefined, mode: "practice" | "boss") => {
    const level = topic ? levelFor(topic) : 2;
    const challenge = await pickChallenge({
      track,
      ...(topic ? { topic } : {}),
      level,
      excludeIds: data?.recent ?? [],
    });
    if (!challenge) {
      toast.error("No challenges available for that topic yet");
      return;
    }
    if (mode === "boss") {
      sessionStorage.setItem(
        "pyforge-boss",
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

      <div className="flex gap-2">
        {(["gcse", "alevel"] as const).map((t) => (
          <Button
            key={t}
            variant={track === t ? "default" : "secondary"}
            onClick={() => setTrack(t)}
          >
            {t === "gcse" ? "GCSE (OCR)" : "A level"}
          </Button>
        ))}
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
          return (
            <div key={t.key} className="panel flex flex-col p-5">
              <p className="font-semibold">{t.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.blurb}</p>
              <Progress value={(lvl / 5) * 100} className="mt-4" />
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                Level {lvl.toFixed(1)} · {skillLabel(lvl)}
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
