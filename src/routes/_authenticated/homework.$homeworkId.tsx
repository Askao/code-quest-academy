import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { topicLabel } from "@/lib/game";

export const Route = createFileRoute("/_authenticated/homework/$homeworkId")({
  head: () => ({
    meta: [
      { title: "Homework — H-Code" },
      { name: "description", content: "Homework challenges set by your teacher." },
      { property: "og:title", content: "Homework — H-Code" },
      { property: "og:description", content: "Homework challenges set by your teacher." },
    ],
  }),
  component: HomeworkPage,
});

function HomeworkPage() {
  const { homeworkId } = Route.useParams();
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["homework", homeworkId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [hw, attempts, assignment] = await Promise.all([
        supabase.from("homework").select("*, classes(name)").eq("id", homeworkId).maybeSingle(),
        supabase.from("attempts").select("challenge_id").eq("user_id", user!.id).eq("passed", true),
        supabase
          .from("homework_assignments")
          .select("challenge_ids")
          .eq("homework_id", homeworkId)
          .eq("student_id", user!.id)
          .maybeSingle(),
      ]);
      // Personalized list if one was generated for this student; legacy
      // homework (set before per-student assignments existed) falls back
      // to the shared list on the homework row itself.
      const ids = assignment.data?.challenge_ids ?? hw.data?.challenge_ids ?? [];
      const items = ids.length
        ? await supabase.from("challenges").select("*").in("id", ids)
        : { data: [] };
      return {
        hw: hw.data,
        items: items.data ?? [],
        done: new Set((attempts.data ?? []).map((a) => a.challenge_id)),
      };
    },
  });


  if (!data?.hw) return <p className="text-muted-foreground">Loading homework…</p>;

  const total = data.items.length;
  const completed = data.items.filter((c) => data.done.has(c!.id)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{data.hw.title}</h1>
        <p className="mt-1 text-muted-foreground">
          {data.hw.classes?.name}
          {data.hw.due_at ? ` · due ${new Date(data.hw.due_at).toLocaleString()}` : ""}
        </p>
        {data.hw.instructions ? <p className="mt-3">{data.hw.instructions}</p> : null}
        <p className="mt-3 font-mono text-sm text-primary">
          {completed}/{total} complete
        </p>
      </div>

      <div className="space-y-3">
        {data.items.map((c) => {
          const done = data.done.has(c!.id);
          return (
            <div key={c!.id} className="panel flex flex-wrap items-center gap-3 p-4">
              <span className={done ? "text-success" : "text-muted-foreground"}>
                {done ? "✓" : "○"}
              </span>
              <div className="flex-1">
                <p className="font-medium">{c!.title}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {topicLabel(c!.topic)} · difficulty {c!.difficulty}/5 · {c!.xp} XP
                </p>
              </div>
              <Button asChild size="sm" variant={done ? "secondary" : "default"}>
                <Link
                  to="/play/$slug"
                  params={{ slug: c!.slug }}
                  search={{ mode: "homework", hw: homeworkId }}
                >
                  {done ? "Redo" : "Start"}
                </Link>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
