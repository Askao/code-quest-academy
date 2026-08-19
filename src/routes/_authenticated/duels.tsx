import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { pickChallenge } from "@/lib/progress";
import type { TrackKey } from "@/lib/game";

export const Route = createFileRoute("/_authenticated/duels")({
  head: () => ({
    meta: [
      { title: "Duels — H-Code" },
      { name: "description", content: "Challenge a classmate to a head-to-head Python duel." },
      { property: "og:title", content: "Duels — H-Code" },
      {
        property: "og:description",
        content: "Challenge a classmate to a head-to-head Python duel.",
      },
    ],
  }),
  component: Duels,
});

function Duels() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["duels", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const memberships = await supabase
        .from("class_members")
        .select("class_id, classes(id, name, track)")
        .eq("student_id", uid);
      const classIds = (memberships.data ?? []).map((m) => m.class_id);
      const [members, duels] = await Promise.all([
        classIds.length
          ? supabase.from("class_members").select("student_id, class_id").in("class_id", classIds)
          : Promise.resolve({ data: [] as { student_id: string; class_id: string }[] }),
        supabase
          .from("duels")
          .select("*, challenges(title, slug)")
          .or(`challenger_id.eq.${uid},opponent_id.eq.${uid}`)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      const others = (members.data ?? []).filter((m) => m.student_id !== uid);
      const profiles = others.length
        ? await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", others.map((o) => o.student_id))
        : { data: [] as { id: string; full_name: string | null }[] };
      const nameOf = new Map((profiles.data ?? []).map((p) => [p.id, p.full_name]));
      return {
        classes: (memberships.data ?? []).map((m) => m.classes).filter(Boolean),
        classmates: others.map((o) => ({ ...o, name: nameOf.get(o.student_id) ?? "Student" })),
        duels: duels.data ?? [],
      };

    },
  });

  const challenge = async (opponentId: string, classId: string, track: TrackKey) => {
    const pick = await pickChallenge({ track, level: 2, excludeIds: [] });
    if (!pick) {
      toast.error("No challenge available");
      return;
    }
    const { data: duel, error } = await supabase
      .from("duels")
      .insert({
        challenger_id: user!.id,
        opponent_id: opponentId,
        class_id: classId,
        challenge_id: pick.id,
        status: "pending",
      })
      .select()
      .single();
    if (error || !duel) {
      toast.error(error?.message ?? "Could not start duel");
      return;
    }
    void navigate({
      to: "/play/$slug",
      params: { slug: pick.slug },
      search: { mode: "duel", duel: duel.id, track },
    });
    void qc.invalidateQueries({ queryKey: ["duels"] });
  };

  const trackOf = (classId: string) =>
    ((data?.classes.find((c) => c!.id === classId)?.track as TrackKey) ?? "gcse");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Duels ⚔</h1>
        <p className="mt-1 text-muted-foreground">
          Pick a classmate, both solve the same challenge — fastest correct answer wins.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Classmates</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data?.classmates.map((c) => (
            <div key={`${c.class_id}-${c.student_id}`} className="panel flex items-center gap-3 p-4">
              <span className="flex-1 font-medium">{c.name}</span>
              <Button
                size="sm"
                onClick={() => challenge(c.student_id, c.class_id, trackOf(c.class_id))}
              >
                Duel
              </Button>
            </div>
          ))}
          {(data?.classmates.length ?? 0) === 0 ? (
            <p className="text-muted-foreground">
              Join a class to duel other students in your group.
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Recent duels</h2>
        <div className="space-y-2">
          {data?.duels.map((d) => {
            const mine = d.challenger_id === user?.id;
            const myMs = mine ? d.challenger_ms : d.opponent_ms;
            const theirMs = mine ? d.opponent_ms : d.challenger_ms;
            return (
              <div key={d.id} className="panel flex flex-wrap items-center gap-3 p-4 text-sm">
                <span className="flex-1 font-medium">{d.challenges?.title}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  you {myMs ? `${(myMs / 1000).toFixed(1)}s` : "—"} · them{" "}
                  {theirMs ? `${(theirMs / 1000).toFixed(1)}s` : "—"}
                </span>
                {d.status === "complete" ? (
                  <span
                    className={
                      d.winner_id === user?.id
                        ? "font-semibold text-success"
                        : "font-semibold text-destructive"
                    }
                  >
                    {d.winner_id === user?.id ? "Won" : "Lost"}
                  </span>
                ) : (
                  <Button asChild size="sm" variant="secondary">
                    <a href={`/play/${d.challenges?.slug}?mode=duel&duel=${d.id}`}>Play</a>
                  </Button>
                )}
              </div>
            );
          })}
          {(data?.duels.length ?? 0) === 0 ? (
            <p className="text-muted-foreground">No duels yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
