import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  const qc = useQueryClient();
  const [helpMessage, setHelpMessage] = useState("");
  const [sendingHelp, setSendingHelp] = useState(false);

  const { data } = useQuery({
    queryKey: ["homework", homeworkId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [hw, attempts, assignment] = await Promise.all([
        supabase.from("homework").select("*, classes(name)").eq("id", homeworkId).maybeSingle(),
        supabase
          .from("attempts")
          .select("challenge_id, passed")
          .eq("user_id", user!.id),
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
      const idSet = new Set(ids);
      const relevantAttempts = (attempts.data ?? []).filter((a) => idSet.has(a.challenge_id));
      return {
        hw: hw.data,
        items: items.data ?? [],
        done: new Set(relevantAttempts.filter((a) => a.passed).map((a) => a.challenge_id)),
        // "Ask for help" only makes sense once a student has genuinely
        // tried and failed something here, not on first load - otherwise
        // it's a shortcut around actually attempting the work.
        hasFailedAttempt: relevantAttempts.some((a) => !a.passed),
      };
    },
  });

  const { data: helpRequest } = useQuery({
    queryKey: ["homework-help-request", homeworkId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: row } = await supabase
        .from("homework_help_requests")
        .select("id, resolved")
        .eq("homework_id", homeworkId)
        .eq("student_id", user!.id)
        .eq("resolved", false)
        .maybeSingle();
      return row ?? null;
    },
  });

  if (!data?.hw) return <p className="text-muted-foreground">Loading homework…</p>;

  const total = data.items.length;
  const completed = data.items.filter((c) => data.done.has(c!.id)).length;

  const sendHelpRequest = async () => {
    if (!user) return;
    setSendingHelp(true);
    const { error } = await supabase.from("homework_help_requests").insert({
      homework_id: homeworkId,
      student_id: user.id,
      message: helpMessage.trim(),
      tasks_done_at_request: completed,
      tasks_total_at_request: total,
    });
    setSendingHelp(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Your teacher can see you've asked for help");
    setHelpMessage("");
    void qc.invalidateQueries({ queryKey: ["homework-help-request", homeworkId, user.id] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{data.hw.title}</h1>
        <p className="mt-1 text-muted-foreground">
          {data.hw.classes?.name}
          {data.hw.due_at ? ` · due ${new Date(data.hw.due_at).toLocaleString("en-GB")}` : ""}
        </p>
        {data.hw.instructions ? <p className="mt-3">{data.hw.instructions}</p> : null}
        <p className="mt-3 font-mono text-sm text-primary">
          {completed}/{total} complete
        </p>
      </div>

      {data.hasFailedAttempt ? (
        <div className="panel p-4">
          {helpRequest ? (
            <p className="text-sm text-muted-foreground">
              ✋ You've asked for help on this homework — your teacher can see it.
            </p>
          ) : (
            <>
              <p className="text-sm font-medium">Stuck on something?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Optional — let your teacher know, with a note if you want. They'll see how far
                you've got when you ask.
              </p>
              <Textarea
                className="mt-2"
                placeholder="What are you stuck on? (optional)"
                value={helpMessage}
                onChange={(e) => setHelpMessage(e.target.value)}
                rows={2}
              />
              <Button size="sm" className="mt-2" onClick={sendHelpRequest} disabled={sendingHelp}>
                {sendingHelp ? "Sending…" : "Ask for help"}
              </Button>
            </>
          )}
        </div>
      ) : null}

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
