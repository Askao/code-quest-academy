import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CLARITY_OPTIONS, RECOMMEND_OPTIONS, USED_OPTIONS } from "@/components/TeacherFeedback";

type Answer = {
  id: string;
  created_at: string;
  usefulness: number;
  clarity: string;
  used: string[];
  missing: string;
  recommend: string;
  contact_ok: boolean;
  name: string;
  email: string | null;
  classes: number;
};

const label = (options: readonly (readonly [string, string])[], v: string) =>
  options.find(([k]) => k === v)?.[1] ?? v;

/** Admin-only: every teacher feedback answer, with a summary on top. */
export function TeacherFeedbackAdmin() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-teacher-feedback"],
    queryFn: async () => {
      // Not in the generated types (see 20261028120000_teacher_feedback.sql).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc("admin_teacher_feedback");
      if (error) throw error;
      return (data ?? []) as Answer[];
    },
  });

  const answers = data ?? [];
  const n = answers.length;
  const avg = n ? answers.reduce((s, a) => s + a.usefulness, 0) / n : 0;
  const confusing = answers.filter((a) => a.clarity !== "clear").length;
  const recommend = answers.filter((a) => a.recommend === "yes").length;

  return (
    <section className="panel space-y-4 p-5">
      <div>
        <h2 className="text-lg font-semibold">Teacher feedback</h2>
        <p className="text-sm text-muted-foreground">
          Teachers are asked once, after a week and 3 days of use. They can also send it any time
          from the Teacher page. Emails show only when the teacher said you can contact them.
        </p>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="text-sm text-destructive">
          Couldn't load feedback. If you haven't yet, run the 20261028120000_teacher_feedback.sql
          migration in Supabase.
        </p>
      ) : n === 0 ? (
        <p className="text-sm text-muted-foreground">No feedback yet.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-4">
              <p className="text-2xl font-semibold tabular-nums">{avg.toFixed(1)} / 5</p>
              <p className="text-sm text-muted-foreground">
                Average usefulness ({n} {n === 1 ? "answer" : "answers"})
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-2xl font-semibold tabular-nums">
                {confusing} of {n}
              </p>
              <p className="text-sm text-muted-foreground">
                Said some or many tasks were confusing
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-2xl font-semibold tabular-nums">
                {recommend} of {n}
              </p>
              <p className="text-sm text-muted-foreground">Would recommend it</p>
            </div>
          </div>
          <ul className="space-y-3">
            {answers.map((a) => (
              <li key={a.id} className="space-y-1.5 rounded-lg border border-border p-4 text-sm">
                <div className="flex flex-wrap justify-between gap-2 text-muted-foreground">
                  <span>
                    <span className="font-semibold text-foreground">{a.name}</span> · {a.classes}{" "}
                    {a.classes === 1 ? "class" : "classes"}
                    {a.email ? <> · {a.email}</> : null}
                  </span>
                  <span>{new Date(a.created_at).toLocaleDateString("en-GB")}</span>
                </div>
                <p className="text-muted-foreground">
                  Usefulness {a.usefulness} · {label(CLARITY_OPTIONS, a.clarity)} · Recommend:{" "}
                  {label(RECOMMEND_OPTIONS, a.recommend).toLowerCase()}
                  {a.used.length ? (
                    <> · Used: {a.used.map((u) => label(USED_OPTIONS, u)).join(", ")}</>
                  ) : null}
                </p>
                {a.missing ? <p className="whitespace-pre-wrap">{a.missing}</p> : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
