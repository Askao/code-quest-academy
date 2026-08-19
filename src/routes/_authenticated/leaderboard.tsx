import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { levelFromXp } from "@/lib/game";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — H-Code" },
      { name: "description", content: "See how your class ranks on XP, streaks and duel wins." },
      { property: "og:title", content: "Leaderboard — H-Code" },
      {
        property: "og:description",
        content: "See how your class ranks on XP, streaks and duel wins.",
      },
    ],
  }),
  component: Leaderboard,
});

function Leaderboard() {
  const { user } = useAuth();
  const [classId, setClassId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["leaderboard", user?.id, classId],
    enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const [asStudent, asTeacher] = await Promise.all([
        supabase.from("class_members").select("classes(id, name)").eq("student_id", uid),
        supabase.from("classes").select("id, name").eq("teacher_id", uid),
      ]);
      const classes = [
        ...(asStudent.data ?? []).map((m) => m.classes).filter(Boolean),
        ...(asTeacher.data ?? []),
      ] as { id: string; name: string }[];
      const active = classId ?? classes[0]?.id ?? null;
      if (!active) return { classes, active, rows: [] };

      const members = await supabase
        .from("class_members")
        .select("student_id")
        .eq("class_id", active);
      const ids = (members.data ?? []).map((m) => m.student_id);
      if (ids.length === 0) return { classes, active, rows: [] };

      const [profiles, stats, duels] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", ids),
        supabase.from("stats").select("*").in("user_id", ids),
        supabase.from("duels").select("winner_id").eq("class_id", active).eq("status", "complete"),
      ]);
      const wins = new Map<string, number>();
      (duels.data ?? []).forEach((d) => {
        if (d.winner_id) wins.set(d.winner_id, (wins.get(d.winner_id) ?? 0) + 1);
      });
      const rows = ids
        .map((id) => {
          const s = (stats.data ?? []).find((x) => x.user_id === id);
          return {
            id,
            name: (profiles.data ?? []).find((p) => p.id === id)?.full_name ?? "Student",
            xp: s?.xp ?? 0,
            streak: s?.streak_days ?? 0,
            wins: wins.get(id) ?? 0,
          };
        })
        .sort((a, b) => b.xp - a.xp);
      return { classes, active, rows };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Class leaderboard</h1>
        <p className="mt-1 text-muted-foreground">Ranked by XP earned in this class.</p>
      </div>

      {(data?.classes.length ?? 0) > 1 ? (
        <select
          className="rounded-md border border-border bg-card px-3 py-2 text-sm"
          value={data?.active ?? ""}
          onChange={(e) => setClassId(e.target.value)}
        >
          {data!.classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      ) : null}

      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left font-mono text-xs text-muted-foreground">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Student</th>
              <th className="p-3">Level</th>
              <th className="p-3">XP</th>
              <th className="p-3">Streak</th>
              <th className="p-3">Solved</th>
              <th className="p-3">Duel wins</th>
            </tr>
          </thead>
          <tbody>
            {(data?.rows ?? []).map((r, i) => (
              <tr
                key={r.id}
                className={`border-b border-border/60 ${r.id === user?.id ? "bg-secondary/60" : ""}`}
              >
                <td className="p-3 font-mono">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </td>
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3">{levelFromXp(r.xp).level}</td>
                <td className="p-3 text-primary">{r.xp}</td>
                <td className="p-3">{r.streak} 🔥</td>
                <td className="p-3">{r.wins}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(data?.rows.length ?? 0) === 0 ? (
          <p className="p-4 text-muted-foreground">No students in this class yet.</p>
        ) : null}
      </div>
    </div>
  );
}
