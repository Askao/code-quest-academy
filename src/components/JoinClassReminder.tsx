import { JoinClassBox } from "@/components/JoinClassBox";
import { Button } from "@/components/ui/button";

/**
 * Top of the dashboard for a student who isn't in any class yet: why joining
 * their teacher's class helps, with the join box right there. "Remind me in
 * 2 weeks" hides it (the caller stores that), and the ordinary join box in
 * Your classes stays available meanwhile.
 */
export function JoinClassReminder({ userId, onSnooze }: { userId: string; onSnooze: () => void }) {
  return (
    <section
      aria-labelledby="join-reminder-title"
      className="panel grid gap-5 border-l-4 border-l-primary p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-center"
    >
      <div className="min-w-0">
        <h2 id="join-reminder-title" className="text-xl font-semibold">
          Is your teacher using H-Code Academy?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask them for the class code. Once you join:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>your homework appears here, ready to do</li>
          <li>you get the right lessons for your course (GCSE or A level, OCR or AQA)</li>
          <li>your teacher can see your progress and help when you're stuck</li>
        </ul>
      </div>
      <div className="min-w-0">
        <JoinClassBox
          userId={userId}
          inputId="join-code-top"
          label="Class code from your teacher"
        />
        <Button
          variant="link"
          size="sm"
          className="mt-1 h-auto px-0 text-muted-foreground"
          onClick={onSnooze}
        >
          I'm practising on my own: remind me in 2 weeks
        </Button>
      </div>
    </section>
  );
}
