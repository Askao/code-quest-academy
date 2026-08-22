import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resetProgress } from "@/lib/progress";
import { tasksForLesson } from "@/lib/content";
import type { TrackKey } from "@/lib/game";

const WHOLE_TOPIC = "__topic__";

/**
 * Sits on a topic's progress card (dashboard.tsx for a user's own progress,
 * teacher.$classId.tsx's per-student view for a teacher resetting a
 * student). Same control either way - the reset_progress RPC decides
 * whether the caller is allowed to touch this particular userId, not this
 * component.
 */
export function ResetProgressControl({
  userId,
  track,
  topic,
  topicLabel,
  targetLabel,
  lessons,
  onDone,
}: {
  userId: string;
  track: TrackKey;
  topic: string;
  topicLabel: string;
  /** "your" or a student's name - drops straight into the confirmation sentence. */
  targetLabel: string;
  lessons: { slug: string; title: string }[];
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState(WHOLE_TOPIC);
  const [busy, setBusy] = useState(false);

  const wholeTopic = scope === WHOLE_TOPIC;
  const lesson = lessons.find((l) => l.slug === scope);

  const confirm = async () => {
    setBusy(true);
    const result = await resetProgress({
      userId,
      track,
      topic,
      lessonSlug: wholeTopic ? undefined : scope,
      taskSlugs: wholeTopic ? undefined : tasksForLesson(scope).map((t) => t.slug),
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(wholeTopic ? `Reset ${targetLabel} progress on ${topicLabel}` : "Lesson reset");
    setOpen(false);
    setScope(WHOLE_TOPIC);
    onDone();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 font-mono text-[0.65rem] text-muted-foreground underline decoration-dotted hover:text-foreground"
      >
        ↺ Reset progress
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-2.5">
      {lessons.length > 0 ? (
        <select
          className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
        >
          <option value={WHOLE_TOPIC}>Whole topic — {topicLabel}</option>
          {lessons.map((l) => (
            <option key={l.slug} value={l.slug}>
              Just: {l.title}
            </option>
          ))}
        </select>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {wholeTopic
          ? `Permanently deletes ${targetLabel} passed/failed tasks, quiz result and skill level for every lesson in ${topicLabel}. Can't be undone.`
          : `Permanently deletes ${targetLabel} passed/failed tasks and quiz result for "${lesson?.title}". Can't be undone.`}
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="destructive" disabled={busy} onClick={confirm}>
          {busy ? "Resetting…" : "Confirm reset"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => {
            setOpen(false);
            setScope(WHOLE_TOPIC);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
