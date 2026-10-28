import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

// None of these functions are in the generated types yet (see
// 20261028120000_teacher_feedback.sql).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = (name: string, args?: Record<string, unknown>) => (supabase as any).rpc(name, args);

export const USED_OPTIONS = [
  ["lessons", "Lessons"],
  ["homework", "Homework"],
  ["markbook", "Markbook"],
  ["assessments", "Assessments"],
  ["duels", "Duels"],
  ["editor", "Python editor"],
] as const;
export const CLARITY_OPTIONS = [
  ["clear", "Mostly clear"],
  ["some", "Some were confusing"],
  ["many", "Many were confusing"],
] as const;
export const RECOMMEND_OPTIONS = [
  ["yes", "Yes"],
  ["maybe", "Maybe"],
  ["not_yet", "Not yet"],
] as const;

const ACTIVE_DAY_KEY = "hcode-active-day";

/**
 * For teachers: notes each day they use the site (once per browser per day),
 * and asks for feedback once the database says it's time: account at least a
 * week old and used on 3 different days. Mounted by AppShell.
 */
export function TeacherFeedbackPrompt() {
  const { user, isTeacher } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || !isTeacher) return;
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (window.localStorage.getItem(ACTIVE_DAY_KEY) === `${user.id}:${today}`) return;
    } catch {
      // Storage blocked: record it anyway, the database ignores repeats.
    }
    void rpc("record_active_day").then(({ error }: { error: unknown }) => {
      if (error) return;
      try {
        window.localStorage.setItem(ACTIVE_DAY_KEY, `${user.id}:${today}`);
      } catch {
        // Fine: the database ignores repeats.
      }
    });
  }, [user, isTeacher]);

  const { data: due } = useQuery({
    queryKey: ["feedback-prompt-due", user?.id],
    enabled: !!user && isTeacher,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await rpc("feedback_prompt_due");
      if (error) return false;
      return data === true;
    },
  });
  useEffect(() => {
    if (due) setOpen(true);
  }, [due]);

  const dismiss = async (choice: "later" | "never") => {
    setOpen(false);
    await rpc("dismiss_feedback_prompt", { _choice: choice });
    qc.setQueryData(["feedback-prompt-due", user?.id], false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing with Escape or the × counts as "ask me next week".
        if (!next) void dismiss("later");
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogTitle className="font-display text-2xl">
          You've been using H-Code Academy for a week. How's it going?
        </DialogTitle>
        <DialogDescription>
          Five quick questions, about a minute. It's made by one teacher, and your answers decide
          what gets fixed next.
        </DialogDescription>
        <TeacherFeedbackForm
          idPrefix="prompt"
          onSent={() => {
            setOpen(false);
            qc.setQueryData(["feedback-prompt-due", user?.id], false);
          }}
          extraActions={
            <div className="flex gap-4">
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto px-0 text-muted-foreground"
                onClick={() => void dismiss("later")}
              >
                Ask me next week
              </Button>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto px-0 text-muted-foreground"
                onClick={() => void dismiss("never")}
              >
                No thanks
              </Button>
            </div>
          }
        />
      </DialogContent>
    </Dialog>
  );
}

function Choice({
  type,
  name,
  id,
  checked,
  onChange,
  children,
}: {
  type: "radio" | "checkbox";
  name: string;
  id: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className={`cursor-pointer rounded-md border px-3 py-1.5 text-center text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
        checked ? "border-primary bg-primary/15" : "border-border hover:bg-secondary"
      }`}
    >
      <input
        id={id}
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {children}
    </label>
  );
}

/** The five questions. Used in the one-off prompt and on the feedback page. */
export function TeacherFeedbackForm({
  idPrefix,
  onSent,
  extraActions,
}: {
  idPrefix: string;
  onSent: () => void;
  extraActions?: React.ReactNode;
}) {
  const [usefulness, setUsefulness] = useState<number | null>(null);
  const [clarity, setClarity] = useState<string | null>(null);
  const [used, setUsed] = useState<string[]>([]);
  const [missing, setMissing] = useState("");
  const [recommend, setRecommend] = useState<string | null>(null);
  const [contactOk, setContactOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usefulness === null || clarity === null || recommend === null) {
      setError("Please answer questions 1, 2 and 5. Questions 3 and 4 are optional.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: rpcError } = await rpc("submit_teacher_feedback", {
      _usefulness: usefulness,
      _clarity: clarity,
      _used: used,
      _missing: missing.trim(),
      _recommend: recommend,
      _contact_ok: contactOk,
    });
    setBusy(false);
    if (rpcError) {
      setError((rpcError as { message?: string }).message ?? "That didn't send. Please try again.");
      return;
    }
    toast.success("Thanks, your feedback has been sent.");
    onSent();
  };

  const legend = "mb-2 text-sm font-semibold";
  return (
    <form onSubmit={submit} className="space-y-5" aria-label="Teacher feedback">
      <fieldset>
        <legend className={legend}>1. How useful has it been for your classes?</legend>
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Choice
              key={n}
              type="radio"
              name={`${idPrefix}-useful`}
              id={`${idPrefix}-useful-${n}`}
              checked={usefulness === n}
              onChange={() => setUsefulness(n)}
            >
              {n}
            </Choice>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>Not useful</span>
          <span>Very useful</span>
        </div>
      </fieldset>
      <fieldset>
        <legend className={legend}>2. Were the task instructions clear to your students?</legend>
        <div className="flex flex-wrap gap-1.5">
          {CLARITY_OPTIONS.map(([v, l]) => (
            <Choice
              key={v}
              type="radio"
              name={`${idPrefix}-clarity`}
              id={`${idPrefix}-clarity-${v}`}
              checked={clarity === v}
              onChange={() => setClarity(v)}
            >
              {l}
            </Choice>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className={legend}>3. What have you used? (tick any)</legend>
        <div className="flex flex-wrap gap-1.5">
          {USED_OPTIONS.map(([v, l]) => (
            <Choice
              key={v}
              type="checkbox"
              name={`${idPrefix}-used`}
              id={`${idPrefix}-used-${v}`}
              checked={used.includes(v)}
              onChange={() =>
                setUsed((u) => (u.includes(v) ? u.filter((x) => x !== v) : [...u, v]))
              }
            >
              {l}
            </Choice>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor={`${idPrefix}-missing`} className={`block ${legend}`}>
          4. What's missing, broken or confusing?
        </label>
        <Textarea
          id={`${idPrefix}-missing`}
          value={missing}
          maxLength={4000}
          onChange={(e) => setMissing(e.target.value)}
          placeholder="Anything at all: a task your students couldn't follow, a feature you need, something that didn't work."
          rows={4}
        />
      </div>
      <fieldset>
        <legend className={legend}>5. Would you recommend it to another computing teacher?</legend>
        <div className="flex flex-wrap gap-1.5">
          {RECOMMEND_OPTIONS.map(([v, l]) => (
            <Choice
              key={v}
              type="radio"
              name={`${idPrefix}-recommend`}
              id={`${idPrefix}-recommend-${v}`}
              checked={recommend === v}
              onChange={() => setRecommend(v)}
            >
              {l}
            </Choice>
          ))}
        </div>
      </fieldset>
      <label htmlFor={`${idPrefix}-contact`} className="flex items-start gap-2 text-sm">
        <input
          id={`${idPrefix}-contact`}
          type="checkbox"
          checked={contactOk}
          onChange={(e) => setContactOk(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-primary"
        />
        You can email me about my answers.
      </label>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {extraActions ?? <span />}
        <Button type="submit" disabled={busy}>
          {busy ? "Sending…" : "Send feedback"}
        </Button>
      </div>
    </form>
  );
}
