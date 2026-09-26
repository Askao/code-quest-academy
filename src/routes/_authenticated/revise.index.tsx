import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sb, type BoardKey } from "@/lib/assessments-db";
import { topicLabel } from "@/lib/game";
import {
  FOCUS_OPTIONS,
  STATE_LABEL,
  clampCount,
  defaultTitle,
  paperState,
  totalsFor,
  type RevisionFocus,
} from "@/lib/revision";
import { createPaper, fetchMyPapers, fetchTopicSummary } from "@/lib/revision-db";

export const Route = createFileRoute("/_authenticated/revise/")({
  head: () => ({
    meta: [
      { title: "Revise — H-Code" },
      {
        name: "description",
        content: "Build your own exam-style revision paper, mark it yourself and track your marks.",
      },
    ],
  }),
  component: RevisePage,
});

const COUNTS = [5, 8, 10, 15, 20];
// null = no timer, 0 = "like an exam" (the database works out about a minute a mark).
const TIMERS: { label: string; value: number | null }[] = [
  { label: "No timer", value: null },
  { label: "Like an exam (about a minute a mark)", value: 0 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "45 minutes", value: 45 },
  { label: "60 minutes", value: 60 },
];

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function RevisePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  // The board of the student's own class is the sensible default.
  const { data: classBoard } = useQuery({
    queryKey: ["revise-default-board", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await sb
        .from("class_members")
        .select("classes(board, track)")
        .eq("student_id", user!.id);
      const rows = (data ?? []) as unknown as {
        classes: { board: string; track: string } | null;
      }[];
      const boards = rows
        .map((m) => m.classes)
        .filter((c): c is { board: string; track: string } => c?.track === "gcse")
        .map((c) => c.board);
      return (boards[0] as BoardKey | undefined) ?? null;
    },
  });

  const [board, setBoard] = useState<BoardKey>("ocr");
  const [boardTouched, setBoardTouched] = useState(false);
  useEffect(() => {
    if (classBoard && !boardTouched) setBoard(classBoard);
  }, [classBoard, boardTouched]);

  const [topics, setTopics] = useState<string[]>([]);
  const [count, setCount] = useState(10);
  const [focus, setFocus] = useState<RevisionFocus>("smart");
  const [timer, setTimer] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [building, setBuilding] = useState(false);

  const topicsQuery = useQuery({
    queryKey: ["revision-topics", board, user?.id],
    enabled: !!user,
    queryFn: () => fetchTopicSummary(board),
  });
  const rows = topicsQuery.data ?? [];
  const totals = useMemo(() => totalsFor(rows, topics), [rows, topics]);
  const askFor = clampCount(count, totals.available);
  const canBuild = totals.available >= 3 && !building;

  const papers = useQuery({
    queryKey: ["revision-papers", user?.id],
    enabled: !!user,
    queryFn: fetchMyPapers,
  });

  const build = async () => {
    setBuilding(true);
    try {
      const result = await createPaper({
        board,
        topics,
        count: askFor,
        focus,
        title: title.trim() || defaultTitle(board, topics, topicLabel),
        minutes: timer,
      });
      await qc.invalidateQueries({ queryKey: ["revision-papers"] });
      void navigate({ to: "/revise/$paperId", params: { paperId: result.paper_id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't build that paper");
    } finally {
      setBuilding(false);
    }
  };

  const deletePaper = async (id: string) => {
    const { error } = await sb.from("revision_papers").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Paper deleted");
    void qc.invalidateQueries({ queryKey: ["revision-papers"] });
  };

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const history = papers.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
          Revision
        </p>
        <h1 className="mt-1 text-3xl font-semibold">Build your own paper</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Pick a board and topics, sit an exam-style paper, then mark it yourself against the mark
          scheme. Papers lean on questions you got wrong before, so your revision goes where the
          marks were lost.
        </p>
      </div>

      <section className="panel space-y-6 p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium">Exam board</p>
          <div className="flex gap-2" role="group" aria-label="Exam board">
            {(["ocr", "aqa"] as BoardKey[]).map((b) => (
              <button
                key={b}
                type="button"
                aria-pressed={board === b}
                onClick={() => {
                  setBoard(b);
                  setBoardTouched(true);
                  setTopics([]);
                }}
                className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                  board === b
                    ? "border-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:bg-secondary/40"
                }`}
              >
                {b.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Topics</p>
          {topicsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading questions…</p>
          ) : null}
          {topicsQuery.error ? (
            <p className="text-sm text-destructive">
              Couldn't load the questions: {(topicsQuery.error as Error).message}
            </p>
          ) : null}
          {!topicsQuery.isLoading && !topicsQuery.error && rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              There are no {board.toUpperCase()} questions yet.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <label
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium ${
                topics.length === 0 ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <input
                type="checkbox"
                className="accent-primary"
                checked={topics.length === 0}
                onChange={() => setTopics([])}
              />
              All topics
            </label>
            {rows.map((r) => {
              const checked = topics.includes(r.topic);
              return (
                <label
                  key={r.topic}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
                    checked ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={checked}
                    onChange={() =>
                      setTopics((prev) =>
                        checked ? prev.filter((k) => k !== r.topic) : [...prev, r.topic],
                      )
                    }
                  />
                  {topicLabel(r.topic)}
                  <span className="font-mono text-xs text-muted-foreground">{r.available}</span>
                  {r.missed > 0 ? (
                    <span
                      className="rounded-full bg-warning/15 px-1.5 font-mono text-xs text-warning"
                      title="Questions you lost marks on last time"
                    >
                      {r.missed} to revisit
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Which questions?</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {FOCUS_OPTIONS.map((o) => (
              <button
                key={o.key}
                type="button"
                aria-pressed={focus === o.key}
                onClick={() => setFocus(o.key)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  focus === o.key
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-secondary/40"
                }`}
              >
                <span className="block font-medium">{o.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{o.blurb}</span>
              </button>
            ))}
          </div>
          {totals.missed > 0 ? (
            <p className="text-sm text-muted-foreground">
              You have <strong>{totals.missed}</strong> question{totals.missed === 1 ? "" : "s"} to
              revisit{topics.length ? " in these topics" : ""}.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing to revisit yet — mark a paper (or get an assessment marked) and the questions
              you lose marks on will come back here.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Number of questions</span>
            <select
              className="w-full rounded-md border border-border bg-card px-3 py-2"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {COUNTS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            {totals.available > 0 && askFor < count ? (
              <span className="block text-xs text-muted-foreground">
                Only {totals.available} available here.
              </span>
            ) : null}
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Timer</span>
            <select
              className="w-full rounded-md border border-border bg-card px-3 py-2"
              value={String(timer)}
              onChange={(e) => setTimer(e.target.value === "null" ? null : Number(e.target.value))}
            >
              {TIMERS.map((t) => (
                <option key={String(t.value)} value={String(t.value)}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Name (optional)</span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={defaultTitle(board, topics, topicLabel)}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={build} disabled={!canBuild}>
            {building ? "Building…" : `Build my paper${askFor >= 3 ? ` (${askFor} questions)` : ""}`}
          </Button>
          {totals.available > 0 && totals.available < 3 ? (
            <span className="text-sm text-muted-foreground">
              A paper needs at least 3 questions — choose more topics.
            </span>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Your papers</h2>
        {papers.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
        {!papers.isLoading && history.length === 0 ? (
          <p className="text-muted-foreground">
            You haven't built a paper yet. Build one above — your marks are saved here.
          </p>
        ) : null}
        <div className="space-y-3">
          {history.map((p) => {
            const markedQuestions = p.revision_answers.filter((a) => a.marked).length;
            const state = paperState({
              submitted_at: p.submitted_at,
              marked_at: p.marked_at,
              marked_questions: markedQuestions,
            });
            const earned = p.revision_answers.reduce(
              (s, a) => s + (a.marked ? a.marks_awarded : 0),
              0,
            );
            return (
              <div key={p.id} className="panel flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.title}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {fmt(p.created_at)} · {p.question_count} questions · {p.total_marks} marks
                    {p.weak_count > 0 ? ` · ${p.weak_count} revisited` : ""}
                  </p>
                </div>
                {state === "marked" ? (
                  <span
                    className={`rounded-full px-3 py-1 font-mono text-sm font-semibold ${
                      earned / Math.max(1, p.total_marks) >= 0.75
                        ? "bg-success/15 text-success"
                        : earned / Math.max(1, p.total_marks) >= 0.5
                          ? "bg-warning/15 text-warning"
                          : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {earned}/{p.total_marks} · {Math.round((earned / Math.max(1, p.total_marks)) * 100)}%
                  </span>
                ) : (
                  <span className="rounded-full bg-secondary px-3 py-1 font-mono text-xs">
                    {STATE_LABEL[state]}
                  </span>
                )}
                <Button asChild size="sm" variant={state === "marked" ? "secondary" : "default"}>
                  <Link to="/revise/$paperId" params={{ paperId: p.id }}>
                    {state === "in_progress"
                      ? "Continue"
                      : state === "marked"
                        ? "View"
                        : "Mark it"}
                  </Link>
                </Button>
                {confirmDelete === p.id ? (
                  <span className="flex items-center gap-2 text-sm">
                    Delete?
                    <Button size="sm" variant="destructive" onClick={() => void deletePaper(p.id)}>
                      Yes
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(null)}>
                      No
                    </Button>
                  </span>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(p.id)}>
                    Delete
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
