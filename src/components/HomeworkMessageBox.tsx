import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { sb } from "@/lib/assessments-db";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { notifyMessage, sendHomeworkMessage } from "@/lib/homework-notify";
import { MESSAGE_MAX_LENGTH } from "@/lib/message-text";

type Sent = { id: string; body: string; audience: "all" | "unfinished"; created_at: string };

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * A note from the teacher to the students on one homework. It is emailed to
 * them and also shown on their homework page, and the messages already sent
 * are listed underneath so a teacher can see what has been said.
 */
export function HomeworkMessageBox({
  homeworkId,
  everyone,
  unfinished,
}: {
  homeworkId: string;
  everyone: number;
  unfinished: number;
}) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "unfinished">("unfinished");
  const [sending, setSending] = useState(false);

  const { data: sent } = useQuery({
    queryKey: ["homework-messages", homeworkId],
    queryFn: async () => {
      const { data } = await sb
        .from("homework_messages")
        .select("id, body, audience, created_at")
        .eq("homework_id", homeworkId)
        .order("created_at", { ascending: false })
        .limit(5);
      return (data ?? []) as Sent[];
    },
  });

  const recipients = audience === "all" ? everyone : unfinished;

  const send = async () => {
    setSending(true);
    const result = await sendHomeworkMessage({ homeworkId, body, audience });
    setSending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setBody("");
    void qc.invalidateQueries({ queryKey: ["homework-messages", homeworkId] });
    toast.success(notifyMessage(result.outcome) ?? "Message saved.");
  };

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <p className="font-mono text-xs text-muted-foreground">MESSAGE THE CLASS</p>
      <Textarea
        id={`hw-message-${homeworkId}`}
        aria-label="Message to students"
        placeholder="Write a note about this homework. It is emailed to the students you choose and shown on their homework page."
        value={body}
        maxLength={MESSAGE_MAX_LENGTH}
        onChange={(e) => setBody(e.target.value)}
        className="min-h-24"
      />
      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Who to send it to"
          className="rounded-md border border-border bg-card px-3 py-2 text-sm"
          value={audience}
          onChange={(e) => setAudience(e.target.value as "all" | "unfinished")}
        >
          <option value="unfinished">Students who haven't finished ({unfinished})</option>
          <option value="all">Everyone on the class ({everyone})</option>
        </select>
        <span className="font-mono text-xs text-muted-foreground">
          {body.length} / {MESSAGE_MAX_LENGTH}
        </span>
        <Button
          size="sm"
          className="ml-auto"
          disabled={sending || !body.trim() || recipients === 0}
          onClick={send}
        >
          {sending ? "Sending…" : `Send to ${recipients} student${recipients === 1 ? "" : "s"}`}
        </Button>
      </div>
      {(sent ?? []).length > 0 ? (
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          {(sent ?? []).map((m) => (
            <li key={m.id}>
              <span className="font-medium text-foreground">{when(m.created_at)}</span> ·{" "}
              {m.audience === "all" ? "everyone" : "unfinished only"}: “{m.body.length > 140 ? `${m.body.slice(0, 140)}…` : m.body}”
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
