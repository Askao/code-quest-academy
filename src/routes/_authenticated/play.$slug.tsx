import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import CodeMirror from "@uiw/react-codemirror";
import type { EditorView } from "@codemirror/view";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BADGES, topicLabel, type TrackKey } from "@/lib/game";
import { checkSyntax, getPyodide, runTests, type RunOutcome } from "@/lib/python-runner";
import { highlightErrorLine, pythonEditorExtensions } from "@/lib/python-lint";
import { pickChallenge, recordAttempt, type Challenge } from "@/lib/progress";
import { tasksInGroup, withContent } from "@/lib/content";

type Search = {
  mode: "practice" | "boss" | "duel" | "homework" | "recap";
  track?: TrackKey;
  topic?: string;
  duel?: string;
  hw?: string;
};

type BossState = { endsAt: number; score: number; track: TrackKey; topic: string | null };

export const Route = createFileRoute("/_authenticated/play/$slug")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: (["practice", "boss", "duel", "homework", "recap"] as const).includes(s["mode"] as never)
      ? (s["mode"] as Search["mode"])
      : "practice",
    ...(s["track"] === "alevel" || s["track"] === "gcse" ? { track: s["track"] } : {}),
    ...(typeof s["topic"] === "string" ? { topic: s["topic"] } : {}),
    ...(typeof s["duel"] === "string" ? { duel: s["duel"] } : {}),
    ...(typeof s["hw"] === "string" ? { hw: s["hw"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Challenge — H-Code" },
      { name: "description", content: "Write and test Python in the browser." },
      { property: "og:title", content: "Challenge — H-Code" },
      { property: "og:description", content: "Write and test Python in the browser." },
    ],
  }),
  component: Play,
});

function readBoss(): BossState | null {
  try {
    const raw = sessionStorage.getItem("hcode-boss");
    return raw ? (JSON.parse(raw) as BossState) : null;
  } catch {
    return null;
  }
}

function Play() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [running, setRunning] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [tries, setTries] = useState(0);
  const [solved, setSolved] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [syntaxError, setSyntaxError] = useState<{ line: number; message: string } | null>(null);
  const startedAt = useRef(Date.now());
  const editorViewRef = useRef<EditorView | null>(null);

  const { data: challenge } = useQuery({
    queryKey: ["challenge", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? withContent(data as unknown as Challenge) : null;
    },
  });

  useEffect(() => {
    if (challenge) {
      setCode(challenge.starter_code || "");
      setOutcome(null);
      setSolved(false);
      setTries(0);
      setHintsShown(0);
      setSyntaxError(null);
      startedAt.current = Date.now();
    }
  }, [challenge]);

  useEffect(() => {
    void getPyodide()
      .then(() => setEngineReady(true))
      .catch(() => toast.error("Could not start the Python engine"));
  }, []);

  // Boss battle countdown
  useEffect(() => {
    if (search.mode !== "boss") return;
    const tick = () => {
      const boss = readBoss();
      if (!boss) return;
      const left = Math.max(0, Math.round((boss.endsAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        sessionStorage.removeItem("hcode-boss");
        toast.success(`Boss battle over — ${boss.score} challenge(s) cleared!`);
        void navigate({ to: "/practice" });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [search.mode, navigate]);

  const run = async () => {
    if (!challenge || !user) return;
    setRunning(true);
    try {
      const syntaxIssue = await checkSyntax(code);
      setSyntaxError(syntaxIssue);
      if (editorViewRef.current) {
        highlightErrorLine(editorViewRef.current, syntaxIssue?.line ?? null);
      }

      const result = await runTests(code, challenge.tests);
      setOutcome(result);
      const attemptNumber = tries + 1;
      setTries(attemptNumber);

      if (result.passed && !solved) {
        setSolved(true);
        const summary = await recordAttempt({
          userId: user.id,
          challenge,
          outcome: result,
          code,
          mode: search.mode,
          firstTry: attemptNumber === 1 && hintsShown === 0,
        });
        toast.success(`Passed! +${summary.xpAwarded} XP`);
        summary.newBadges.forEach((b) =>
          toast(`${BADGES[b]?.icon ?? "🏅"} Badge unlocked: ${BADGES[b]?.name ?? b}`),
        );

        if (search.mode === "boss") {
          const boss = readBoss();
          if (boss) {
            boss.score += 1;
            sessionStorage.setItem("hcode-boss", JSON.stringify(boss));
          }
        }
        if (search.mode === "duel" && search.duel) {
          await submitDuelTime(search.duel, user.id, Date.now() - startedAt.current);
        }
      } else if (!result.passed) {
        await recordAttempt({
          userId: user.id,
          challenge,
          outcome: result,
          code,
          mode: search.mode,
          firstTry: false,
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Run failed");
    } finally {
      setRunning(false);
    }
  };

  const nextChallenge = async () => {
    if (!challenge) return;

    // Multi-part problems: once this part is passed, go straight to the
    // next part of the same scenario rather than picking something random.
    if (challenge.group) {
      const parts = tasksInGroup(challenge.group);
      const myIndex = parts.findIndex((p) => p.slug === challenge.slug);
      const nextPart = parts[myIndex + 1];
      if (nextPart) {
        void navigate({ to: "/play/$slug", params: { slug: nextPart.slug }, search });
        return;
      }
    }

    const next = await pickChallenge({
      track: (search.track ?? challenge.track) as TrackKey,
      ...(search.topic ?? (search.mode === "boss" ? undefined : challenge.topic)
        ? { topic: search.topic ?? challenge.topic }
        : {}),
      level: challenge.difficulty,
      excludeIds: [challenge.id],
    });
    if (!next) {
      toast.error("No more challenges here yet");
      return;
    }
    void navigate({ to: "/play/$slug", params: { slug: next.slug }, search });
  };

  if (!challenge) {
    return <p className="text-muted-foreground">Loading challenge…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 font-mono text-xs ${
            challenge.track === "gcse" ? "bg-gcse/15 text-gcse" : "bg-alevel/15 text-alevel"
          }`}
        >
          {challenge.track === "gcse" ? "GCSE · OCR" : "A LEVEL"}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {topicLabel(challenge.topic)} · difficulty {challenge.difficulty}/5 · {challenge.xp} XP
        </span>
        {challenge.part ? (
          <span className="rounded-full bg-secondary px-3 py-1 font-mono text-xs text-foreground">
            Part {challenge.part}
          </span>
        ) : null}
        {search.mode === "boss" && remaining !== null ? (
          <span className="ml-auto rounded-full bg-warning/15 px-3 py-1 font-mono text-sm text-warning">
            ⏱ {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
          </span>
        ) : null}
        {search.mode === "duel" ? (
          <span className="ml-auto rounded-full bg-destructive/15 px-3 py-1 font-mono text-sm text-destructive">
            ⚔ Duel — fastest correct answer wins
          </span>
        ) : null}
        {search.mode === "recap" ? (
          <span className="ml-auto rounded-full bg-primary/15 px-3 py-1 font-mono text-sm text-primary">
            ↻ Daily recap
          </span>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <div className="panel p-5">
            <h1 className="text-2xl font-bold">{challenge.title}</h1>
            <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{challenge.brief}</p>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Hints</h2>
              <Button
                size="sm"
                variant="secondary"
                disabled={hintsShown >= challenge.hints.length}
                onClick={() => setHintsShown((n) => n + 1)}
              >
                Reveal a hint
              </Button>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {challenge.hints.slice(0, hintsShown).map((h, i) => (
                <li key={i}>💡 {h}</li>
              ))}
              {hintsShown === 0 ? <li>Have a go first — hints reduce your first-try bonus.</li> : null}
            </ul>
          </div>

          {outcome ? (
            <div className="panel p-5">
              <h2 className="font-semibold">
                Tests: {outcome.passedCount}/{outcome.total} passed
              </h2>
              <ul className="mt-3 space-y-3 text-sm">
                {outcome.results.map((r) => (
                  <li key={r.index} className="rounded-md border border-border p-3">
                    <p className={r.passed ? "text-success" : "text-destructive"}>
                      {r.passed ? "✓ Passed" : "✗ Failed"} — test {r.index + 1}
                    </p>
                    {!r.passed ? (
                      <div className="mt-2 space-y-1 font-mono text-xs">
                        {r.stdin ? <p>input: {r.stdin.replace(/\n/g, " ⏎ ")}</p> : null}
                        <p>expected: {r.expected.replace(/\n/g, " ⏎ ")}</p>
                        <p>you gave: {r.actual.replace(/\n/g, " ⏎ ") || "(nothing)"}</p>
                        {r.error ? <p className="text-destructive">{r.error}</p> : null}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-border">
            <CodeMirror
              value={code}
              height="26rem"
              theme="dark"
              extensions={pythonEditorExtensions}
              onChange={(value) => {
                setCode(value);
                setSyntaxError(null);
              }}
              onCreateEditor={(view) => {
                editorViewRef.current = view;
              }}
              placeholder="# write your Python here"
              basicSetup={{ tabSize: 4 }}
            />
          </div>
          {syntaxError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 font-mono text-sm text-destructive">
              Line {syntaxError.line}: {syntaxError.message}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button onClick={run} disabled={running || !engineReady}>
              {!engineReady ? "Starting Python…" : running ? "Running…" : "Run tests"}
            </Button>
            <Button variant="secondary" onClick={() => setCode(challenge.starter_code || "")}>
              Reset
            </Button>
            {solved ? (
              <Button variant="secondary" onClick={nextChallenge}>
                Next challenge →
              </Button>
            ) : null}
            <Button asChild variant="ghost">
              <Link to="/practice">Back to topics</Link>
            </Button>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            Python runs entirely in your browser — nothing is executed on the server.
          </p>
        </div>
      </div>
    </div>
  );
}

async function submitDuelTime(duelId: string, userId: string, ms: number) {
  const { data: duel } = await supabase.from("duels").select("*").eq("id", duelId).maybeSingle();
  if (!duel) return;
  const isChallenger = duel.challenger_id === userId;
  const theirs = isChallenger ? duel.opponent_ms : duel.challenger_ms;
  const done = theirs != null;
  const winner = done
    ? ms < theirs
      ? userId
      : isChallenger
        ? duel.opponent_id
        : duel.challenger_id
    : null;
  await supabase
    .from("duels")
    .update({
      ...(isChallenger ? { challenger_ms: ms } : { opponent_ms: ms }),
      status: done ? "complete" : "in_progress",
      ...(winner ? { winner_id: winner } : {}),
    })
    .eq("id", duelId);

}
