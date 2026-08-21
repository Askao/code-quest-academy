import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { levelFromXp, type TrackKey } from "@/lib/game";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — H-Code" },
      {
        name: "description",
        content: "Top 10 by XP and by recent progress, for your class or the whole school.",
      },
      { property: "og:title", content: "Leaderboard — H-Code" },
      {
        property: "og:description",
        content: "Top 10 by XP and by recent progress, for your class or the whole school.",
      },
    ],
  }),
  component: Leaderboard,
});

const TOP_N = 10;

type Row = { id: string; name: string; cells: ReactNode[] };

function rankIcon(i: number) {
  return i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1;
}

function LeaderboardTable({
  rows,
  columns,
  currentUserId,
  emptyMessage,
}: {
  rows: Row[];
  columns: string[];
  currentUserId?: string | undefined;
  emptyMessage: string;
}) {
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-left font-mono text-xs text-muted-foreground">
          <tr>
            <th className="p-3">#</th>
            <th className="p-3">Student</th>
            {columns.map((c) => (
              <th key={c} className="p-3">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.id}
              className={`border-b border-border/60 ${r.id === currentUserId ? "bg-secondary/60" : ""}`}
            >
              <td className="p-3 font-mono">{rankIcon(i)}</td>
              <td className="p-3 font-medium">{r.name}</td>
              {r.cells.map((c, j) => (
                <td key={j} className="p-3">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? <p className="p-4 text-muted-foreground">{emptyMessage}</p> : null}
    </div>
  );
}

function Leaderboard() {
  const { user } = useAuth();
  const [scope, setScope] = useState<"class" | "school">("class");
  const [classId, setClassId] = useState<string | null>(null);
  const [schoolTrack, setSchoolTrack] = useState<TrackKey>("gcse");

  const { data: myClasses } = useQuery({
    queryKey: ["leaderboard-classes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const [asStudent, owned, coTaught] = await Promise.all([
        supabase
          .from("class_members")
          .select("classes(id, name, improved_window_days)")
          .eq("student_id", uid),
        supabase.from("classes").select("id, name, improved_window_days").eq("teacher_id", uid),
        supabase
          .from("class_co_teachers")
          .select("classes(id, name, improved_window_days)")
          .eq("teacher_id", uid),
      ]);
      const list = [
        ...(asStudent.data ?? []).map((m) => m.classes).filter(Boolean),
        ...(owned.data ?? []),
        ...(coTaught.data ?? []).map((m) => m.classes).filter(Boolean),
      ] as { id: string; name: string; improved_window_days: number }[];
      const seen = new Set<string>();
      return list.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
    },
  });

  const activeClassId = classId ?? myClasses?.[0]?.id ?? null;
  const activeClass = myClasses?.find((c) => c.id === activeClassId);

  const { data: classBoard } = useQuery({
    queryKey: ["class-leaderboard", activeClassId],
    enabled: !!activeClassId,
    queryFn: async () => {
      const windowDays = activeClass?.improved_window_days ?? 7;
      const members = await supabase
        .from("class_members")
        .select("student_id")
        .eq("class_id", activeClassId!);
      const ids = (members.data ?? []).map((m) => m.student_id);
      if (ids.length === 0) return { topXp: [], improved: [], total: 0, windowDays };

      const sinceIso = new Date(Date.now() - windowDays * 86400000).toISOString();
      const [profiles, stats, duels, recentAttempts] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", ids),
        supabase.from("stats").select("*").in("user_id", ids),
        supabase
          .from("duels")
          .select("winner_id")
          .eq("class_id", activeClassId!)
          .eq("status", "complete"),
        supabase
          .from("attempts")
          .select("user_id, xp_awarded, created_at")
          .in("user_id", ids)
          .gte("created_at", sinceIso),
      ]);
      const nameOf = (id: string) =>
        (profiles.data ?? []).find((p) => p.id === id)?.full_name ?? "Student";
      const wins = new Map<string, number>();
      (duels.data ?? []).forEach((d) => {
        if (d.winner_id) wins.set(d.winner_id, (wins.get(d.winner_id) ?? 0) + 1);
      });

      const topXp = ids
        .map((id) => {
          const s = (stats.data ?? []).find((x) => x.user_id === id);
          const xp = s?.xp ?? 0;
          return {
            id,
            name: nameOf(id),
            xp,
            cells: [
              levelFromXp(xp).level,
              <span key="xp" className="text-primary">
                {xp}
              </span>,
              `${s?.streak_days ?? 0} 🔥`,
              wins.get(id) ?? 0,
            ] as ReactNode[],
          };
        })
        .sort((a, b) => b.xp - a.xp)
        .slice(0, TOP_N);

      const gained = new Map<string, number>();
      (recentAttempts.data ?? []).forEach((a) => {
        gained.set(a.user_id, (gained.get(a.user_id) ?? 0) + (a.xp_awarded ?? 0));
      });
      const improved = ids
        .map((id) => ({ id, name: nameOf(id), xp: gained.get(id) ?? 0 }))
        .filter((r) => r.xp > 0)
        .sort((a, b) => b.xp - a.xp)
        .slice(0, TOP_N)
        .map((r) => ({
          id: r.id,
          name: r.name,
          cells: [
            <span key="gained" className="text-primary">
              +{r.xp} XP
            </span>,
          ] as ReactNode[],
        }));

      return { topXp, improved, total: ids.length, windowDays };
    },
  });

  const { data: schoolBoard } = useQuery({
    queryKey: ["school-leaderboard", schoolTrack],
    enabled: scope === "school",
    queryFn: async () => {
      const [topXp, improved] = await Promise.all([
        supabase.rpc("leaderboard_top_xp", { _class_id: null, _track: schoolTrack, _limit: TOP_N }),
        supabase.rpc("leaderboard_most_improved", {
          _class_id: null,
          _track: schoolTrack,
          _limit: TOP_N,
        }),
      ]);
      return {
        topXp: (topXp.data ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          cells: [
            levelFromXp(r.xp).level,
            <span key="xp" className="text-primary">
              {r.xp}
            </span>,
            `${r.streak_days} 🔥`,
          ] as ReactNode[],
        })),
        improved: (improved.data ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          cells: [
            <span key="gained" className="text-primary">
              +{r.xp_gained} XP
            </span>,
          ] as ReactNode[],
        })),
      };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leaderboards</h1>
        <p className="mt-1 text-muted-foreground">
          Top {TOP_N} by XP, and who's made the most progress recently.
        </p>
      </div>

      <Tabs value={scope} onValueChange={(v) => setScope(v as "class" | "school")}>
        <TabsList>
          <TabsTrigger value="class">Class</TabsTrigger>
          <TabsTrigger value="school">School</TabsTrigger>
        </TabsList>

        <TabsContent value="class" className="space-y-6 pt-4">
          {(myClasses?.length ?? 0) > 1 ? (
            <select
              className="rounded-md border border-border bg-card px-3 py-2 text-sm"
              value={activeClassId ?? ""}
              onChange={(e) => setClassId(e.target.value)}
            >
              {myClasses!.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : null}

          {!activeClassId ? (
            <p className="text-muted-foreground">You're not in a class yet.</p>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-semibold">Top XP</h2>
                <div className="mt-2">
                  <LeaderboardTable
                    rows={classBoard?.topXp ?? []}
                    columns={["Level", "XP", "Streak", "Duel wins"]}
                    currentUserId={user?.id}
                    emptyMessage="No students in this class yet."
                  />
                </div>
                {(classBoard?.total ?? 0) > TOP_N ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Showing top {TOP_N} of {classBoard?.total} students.
                  </p>
                ) : null}
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  Most improved{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    (last {classBoard?.windowDays ?? 7} days)
                  </span>
                </h2>
                <div className="mt-2">
                  <LeaderboardTable
                    rows={classBoard?.improved ?? []}
                    columns={["XP gained"]}
                    currentUserId={user?.id}
                    emptyMessage="Nobody's earned XP in this window yet."
                  />
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="school" className="space-y-6 pt-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={schoolTrack === "gcse" ? "default" : "secondary"}
              onClick={() => setSchoolTrack("gcse")}
            >
              GCSE
            </Button>
            <Button
              size="sm"
              variant={schoolTrack === "alevel" ? "default" : "secondary"}
              onClick={() => setSchoolTrack("alevel")}
            >
              A level
            </Button>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Top XP — whole school</h2>
            <div className="mt-2">
              <LeaderboardTable
                rows={schoolBoard?.topXp ?? []}
                columns={["Level", "XP", "Streak"]}
                currentUserId={user?.id}
                emptyMessage="No students on this track yet."
              />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              Most improved{" "}
              <span className="text-sm font-normal text-muted-foreground">(last 7 days)</span>
            </h2>
            <div className="mt-2">
              <LeaderboardTable
                rows={schoolBoard?.improved ?? []}
                columns={["XP gained"]}
                currentUserId={user?.id}
                emptyMessage="Nobody's earned XP this week yet."
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
