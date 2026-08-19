import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { levelFromXp, topicsFor, type TrackKey } from "@/lib/game";

export const Route = createFileRoute("/_authenticated/teacher/$classId")({
  head: () => ({
    meta: [
      { title: "Class — H-Code" },
      { name: "description", content: "Class roster, skill levels and homework." },
      { property: "og:title", content: "Class — H-Code" },
      { property: "og:description", content: "Class roster, skill levels and homework." },
    ],
  }),
  component: ClassDetail,
});

function ClassDetail() {
  const { classId } = Route.useParams();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [topic, setTopic] = useState("all");
  const [count, setCount] = useState(3);

  const { data } = useQuery({
    queryKey: ["class", classId],
    queryFn: async () => {
      const cls = await supabase.from("classes").select("*").eq("id", classId).maybeSingle();
      const members = await supabase
        .from("class_members")
        .select("student_id")
        .eq("class_id", classId);
      const ids = (members.data ?? []).map((m) => m.student_id);
      const [profiles, stats, skills, attempts, homework] = await Promise.all([
        ids.length
          ? supabase.from("profiles").select("id, full_name, email").in("id", ids)
          : Promise.resolve({ data: [] }),
        ids.length
          ? supabase.from("stats").select("*").in("user_id", ids)
          : Promise.resolve({ data: [] }),
        ids.length
          ? supabase.from("skills").select("*").in("user_id", ids)
          : Promise.resolve({ data: [] }),
        ids.length
          ? supabase
              .from("attempts")
              .select("user_id, passed, created_at")
              .in("user_id", ids)
              .order("created_at", { ascending: false })
              .limit(500)
          : Promise.resolve({ data: [] }),
        supabase
          .from("homework")
          .select("*")
          .eq("class_id", classId)
          .order("created_at", { ascending: false }),
      ]);
      return {
        cls: cls.data,
        students: (profiles.data ?? []).map((p) => {
          const s = (stats.data ?? []).find((x) => x.user_id === p.id);
          const mine = (skills.data ?? []).filter((k) => k.user_id === p.id);
          const avg = mine.length
            ? mine.reduce((a, b) => a + Number(b.level), 0) / mine.length
            : 1;
          const mineAttempts = (attempts.data ?? []).filter((a) => a.user_id === p.id);
          const accuracy = mineAttempts.length
            ? Math.round(
                (mineAttempts.filter((a) => a.passed).length / mineAttempts.length) * 100,
              )
            : 0;
          return {
            id: p.id,
            name: p.full_name ?? p.email ?? "Student",
            xp: s?.xp ?? 0,
            streak: s?.streak_days ?? 0,
            avg,
            accuracy,
            lastActive: s?.last_active,
            skills: mine,
          };
        }),
        homework: homework.data ?? [],
      };
    },
  });

  const track = (data?.cls?.track ?? "gcse") as TrackKey;

  const setHomework = async () => {
    if (!title.trim()) {
      toast.error("Give the homework a title");
      return;
    }
    let query = supabase.from("challenges").select("id").eq("track", track);
    if (topic !== "all") query = query.eq("topic", topic);
    const { data: pool } = await query;
    const ids = (pool ?? []).map((c) => c.id).sort(() => Math.random() - 0.5).slice(0, count);
    if (ids.length === 0) {
      toast.error("No challenges match that topic");
      return;
    }
    const { error } = await supabase.from("homework").insert({
      class_id: classId,
      title: title.trim(),
      instructions: instructions.trim(),
      challenge_ids: ids,
      adaptive: true,
      ...(dueAt ? { due_at: new Date(dueAt).toISOString() } : {}),
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Homework set");
      setTitle("");
      setInstructions("");
      setDueAt("");
      void qc.invalidateQueries({ queryKey: ["class", classId] });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{data?.cls?.name ?? "Class"}</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          {track === "gcse" ? "GCSE · OCR" : "A LEVEL"} · join code{" "}
          <span className="text-primary">{data?.cls?.join_code}</span>
        </p>
      </div>

      <section className="panel space-y-3 p-5">
        <h2 className="text-lg font-semibold">Set homework</h2>
        <p className="text-sm text-muted-foreground">
          Challenges are picked from this class's track only, and each student's skill level still
          shapes what they see in practice.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
          <select
            className="rounded-md border border-border bg-card px-3 py-2 text-sm"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            <option value="all">All topics</option>
            {topicsFor(track).map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-border bg-card px-3 py-2 text-sm"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} challenge{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>
        <Input
          placeholder="Instructions (optional)"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
        <Button onClick={setHomework}>Set homework</Button>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Students</h2>
        <div className="space-y-3">
          {(data?.students ?? []).map((s) => (
            <div key={s.id} className="panel p-5">
              <div className="flex flex-wrap items-center gap-4">
                <p className="flex-1 font-semibold">{s.name}</p>
                <span className="font-mono text-xs text-muted-foreground">
                  Level {levelFromXp(s.xp).level} · {s.xp} XP · {s.streak}🔥 · {s.accuracy}% accuracy
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {topicsFor(track).map((t) => {
                  const lvl = Number(
                    s.skills.find((k) => k.topic === t.key && k.track === track)?.level ?? 1,
                  );
                  return (
                    <div key={t.key}>
                      <div className="flex justify-between text-xs">
                        <span>{t.label}</span>
                        <span className="font-mono text-muted-foreground">{lvl.toFixed(1)}</span>
                      </div>
                      <Progress value={(lvl / 5) * 100} className="mt-1" />
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Average skill level {s.avg.toFixed(1)}/5
                {s.lastActive
                  ? ` · last active ${new Date(s.lastActive).toLocaleDateString()}`
                  : " · not started yet"}
              </p>
            </div>
          ))}
          {(data?.students ?? []).length === 0 ? (
            <p className="text-muted-foreground">
              No students yet — share the join code above with your class.
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Homework set</h2>
        <div className="space-y-2">
          {(data?.homework ?? []).map((h) => (
            <div key={h.id} className="panel flex flex-wrap items-center gap-3 p-4 text-sm">
              <span className="flex-1 font-medium">{h.title}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {h.challenge_ids.length} challenges
                {h.due_at ? ` · due ${new Date(h.due_at).toLocaleDateString()}` : ""}
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  await supabase.from("homework").delete().eq("id", h.id);
                  void qc.invalidateQueries({ queryKey: ["class", classId] });
                }}
              >
                Delete
              </Button>
            </div>
          ))}
          {(data?.homework ?? []).length === 0 ? (
            <p className="text-muted-foreground">No homework set yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
