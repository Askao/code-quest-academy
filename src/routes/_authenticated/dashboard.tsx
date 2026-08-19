import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { BADGES, levelFromXp, skillLabel, skillPercent, topicLabel, topicsFor } from "@/lib/game";

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
  const { user, fullName } = useAuth();
  const qc = useQueryClient();
  const [joinCode, setJoinCode] = useState("");

  const { data } = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const [stats, skills, badges, memberships] = await Promise.all([
        supabase.from("stats").select("*").eq("user_id", uid).maybeSingle(),
        supabase.from("skills").select("*").eq("user_id", uid),
        supabase.from("badges").select("*").eq("user_id", uid),
        supabase.from("class_members").select("class_id, classes(*)").eq("student_id", uid),
      ]);
      const classIds = (memberships.data ?? []).map((m) => m.class_id);
      const homework = classIds.length
        ? await supabase
            .from("homework")
            .select("*, classes(name)")
            .in("class_id", classIds)
            .order("due_at", { ascending: true })
        : { data: [] };
      return {
        stats: stats.data,
        skills: skills.data ?? [],
        badges: badges.data ?? [],
        classes: (memberships.data ?? []).map((m) => m.classes).filter(Boolean),
        homework: homework.data ?? [],
      };
    },
  });

  const join = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    const { data: cls } = await supabase
      .from("classes")
      .select("id")
      .eq("join_code", code)
      .maybeSingle();
    if (!cls) {
      toast.error("No class found with that code");
      return;
    }
    const { error } = await supabase
      .from("class_members")
      .insert({ class_id: cls.id, student_id: user!.id });
    if (error) toast.error(error.message);
    else {
      toast.success("Joined the class");
      setJoinCode("");
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    }
  };

  const xp = data?.stats?.xp ?? 0;
  const { level, intoLevel, needed } = levelFromXp(xp);
  const tracks = new Set((data?.classes ?? []).map((c) => c!.track as "gcse" | "alevel"));
  if (tracks.size === 0) tracks.add("gcse");

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
          <p className="mt-1 text-3xl font-bold text-warning">
            {data?.stats?.streak_days ?? 0} 🔥
          </p>
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

      {(data?.homework ?? []).length > 0 ? (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Homework</h2>
          <div className="space-y-3">
            {data!.homework.map((hw) => (
              <div key={hw.id} className="panel flex flex-wrap items-center gap-3 p-4">
                <div className="flex-1">
                  <p className="font-medium">{hw.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {hw.instructions || "Complete the set challenges."}
                    {hw.due_at ? ` · Due ${new Date(hw.due_at).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link to="/homework/$homeworkId" params={{ homeworkId: hw.id }}>
                    Start
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
                {track === "gcse" ? "GCSE · OCR" : "A LEVEL"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {topicsFor(track).map((t) => {
                  const skill = data?.skills.find(
                    (s) => s.topic === t.key && s.track === track,
                  );
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
                You're not in a class yet — ask your teacher for a join code.
              </li>
            ) : null}
          </ul>
          <div className="mt-4 flex gap-2">
            <Input
              placeholder="Join code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <Button onClick={join}>Join</Button>
          </div>
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
        Recent topics: {(data?.skills ?? []).map((s) => topicLabel(s.topic)).join(", ") || "none yet"}
      </p>
    </div>
  );
}
