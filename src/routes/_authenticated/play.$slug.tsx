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
import { checkSyntax, getPyodide, runInteractive, runTests, type RunOutcome } from "@/lib/python-runner";
import { highlightErrorLine, pythonEditorExtensions } from "@/lib/python-lint";
import { pickChallenge, recordAttempt, type Challenge } from "@/lib/progress";
import {
  completedTaskSlugs,
  projectsForTopic,
  tasksForLesson,
  tasksInGroup,
  withContent,
} from "@/lib/content";
import { inline } from "@/lib/markdown";
import { diffStrings } from "@/lib/diff";

type Search = {
  mode: "practice" | "boss" | "duel" | "homework" | "recap" | "project";
  track?: TrackKey;
  topic?: string;
  duel?: string;
  hw?: string;
  lesson?: string;
};

type BossState = { endsAt: number; score: number; track: TrackKey; topic: string | null };

export const Route = createFileRoute("/_authenticated/play/$slug")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: (
      ["practice", "boss", "duel", "homework", "recap", "project"] as const
    ).includes(s["mode"] as never)
      ? (s["mode"] as Search["mode"])
      : "practice",
    ...(s["track"] === "alevel" || s["track"] === "gcse" ? { track: s["track"] } : {}),
    ...(typeof s["topic"] === "string" ? { topic: s["topic"] } : {}),
    ...(typeof s["duel"] === "string" ? { duel: s["duel"] } : {}),
    ...(typeof s["hw"] === "string" ? { hw: s["hw"] } : {}),
    ...(typeof s["lesson"] === "string" ? { lesson: s["lesson"] } : {}),
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
  const [consoleOutput, setConsoleOutput] = useState<string | null>(null);
  const [consoleError, setConsoleError] = useState<string | null>(null);
  const [consoleAnswers, setConsoleAnswers] = useState<string[]>([]);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState("");
  const [consoleRunning, setConsoleRunning] = useState(false);
  const startedAt = useRef(Date.now());
  const editorViewRef = useRef<EditorView | null>(null);
  const inputFieldRef = useRef<HTMLInputElement | null>(null);

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

  // Restricts the "Next challenge" fallback (when not following a lesson's
  // own task order) to material the student has actually covered, same as
  // Practice/Recap - see completedTaskSlugs in content.ts. A-level has no
  // lesson content yet, so this only meaningfully restricts GCSE.
  const { data: onlySlugs } = useQuery({
    queryKey: ["completed-task-slugs", user?.id, challenge?.track],
    enabled: !!user && !!challenge,
    queryFn: async () => {
      const [passedRes, quizRes] = await Promise.all([
        supabase
          .from("attempts")
          .select("passed, challenges!inner(slug)")
          .eq("user_id", user!.id)
          .eq("passed", true),
        supabase.from("quiz_attempts").select("lesson_slug").eq("user_id", user!.id).eq("passed", true),
      ]);
      const passedSlugs = new Set(
        ((passedRes.data ?? []) as unknown as { challenges: { slug: string } }[]).map(
          (r) => r.challenges.slug,
        ),
      );
      const quizPassed = new Set((quizRes.data ?? []).map((r) => r.lesson_slug));
      return completedTaskSlugs(challenge!.track, passedSlugs, quizPassed);
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
      setConsoleOutput(null);
      setConsoleError(null);
      setConsoleAnswers([]);
      setWaitingForInput(false);
      setPendingAnswer("");
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

  // Free-form "Run": lets a student try their own input and see real output,
  // as many times as they like, without it counting as an attempt - keeps
  // the adaptive skill signal clean (see recordAttempt in progress.ts),
  // since "still debugging" and "I think I'm done, check me" are very
  // different signals that used to get conflated into one button.
  const executeConsole = async (nextAnswers: string[]) => {
    setConsoleRunning(true);
    try {
      const result = await runInteractive(code, nextAnswers);
      setConsoleOutput(result.output);
      setConsoleError(result.error ?? null);
      setWaitingForInput(result.waiting);
      if (result.waiting) {
        setPendingAnswer("");
        requestAnimationFrame(() => inputFieldRef.current?.focus());
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Run failed");
    } finally {
      setConsoleRunning(false);
    }
  };

  const runConsole = async () => {
    const syntaxIssue = await checkSyntax(code);
    setSyntaxError(syntaxIssue);
    if (editorViewRef.current) {
      highlightErrorLine(editorViewRef.current, syntaxIssue?.line ?? null);
    }
    setConsoleAnswers([]);
    await executeConsole([]);
  };

  const submitConsoleAnswer = async () => {
    const next = [...consoleAnswers, pendingAnswer];
    setConsoleAnswers(next);
    await executeConsole(next);
  };

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

    // Projects are a fixed, difficulty-ordered list per topic (see
    // projectsForTopic in content.ts), not something pickChallenge() should
    // ever pick at random - move to the next one in that order, or back to
    // the Projects section on Practice once they're all done.
    if (search.mode === "project") {
      const projects = projectsForTopic(challenge.track, challenge.topic);
      const myIndex = projects.findIndex((p) => p.slug === challenge.slug);
      const nextProject = projects[myIndex + 1];
      if (nextProject) {
        void navigate({ to: "/play/$slug", params: { slug: nextProject.slug }, search });
      } else {
        void navigate({ to: "/practice" });
      }
      return;
    }

    // Came from a lesson's task list: follow that lesson's task order
    // rather than picking something random from the whole topic. Once
    // there's nothing left in the lesson (including the stretch task),
    // go back to the lesson page instead of falling through to a random
    // challenge from the whole topic - staying "in lesson mode" is what
    // the student expects, not a topic-wide grab bag.
    if (search.lesson) {
      const lessonTasks = tasksForLesson(search.lesson);
      const myIndex = lessonTasks.findIndex((t) => t.slug === challenge.slug);
      const nextTask = lessonTasks[myIndex + 1];
      if (nextTask) {
        void navigate({ to: "/play/$slug", params: { slug: nextTask.slug }, search });
      } else {
        void navigate({ to: "/learn/$lessonSlug", params: { lessonSlug: search.lesson } });
      }
      return;
    }

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
      ...(onlySlugs ? { onlySlugs } : {}),
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

  // Came from a lesson's task list: show where this task sits in that
  // lesson so it doesn't feel like an anonymous challenge dropped in
  // isolation.
  const lessonTasks = search.lesson ? tasksForLesson(search.lesson) : [];
  const requiredLessonTasks = lessonTasks.filter((t) => !t.stretch);
  const isStretchTask = lessonTasks.some((t) => t.slug === challenge.slug && t.stretch);
  const taskPosition = requiredLessonTasks.findIndex((t) => t.slug === challenge.slug);

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
        {isStretchTask ? (
          <span className="rounded-full bg-primary/15 px-3 py-1 font-mono text-xs text-primary">
            ⭐ Extra challenge
          </span>
        ) : taskPosition >= 0 ? (
          <span className="rounded-full bg-secondary px-3 py-1 font-mono text-xs text-foreground">
            Task {taskPosition + 1} of {requiredLessonTasks.length}
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
        {search.mode === "project" ? (
          <span className="ml-auto rounded-full bg-accent/15 px-3 py-1 font-mono text-sm text-accent">
            🏗 Project
          </span>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <div className="panel p-5">
            <h1 className="text-2xl font-bold">{challenge.title}</h1>
            <p className="mt-3 whitespace-pre-wrap text-muted-foreground">
              {inline(challenge.brief)}
            </p>
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
                <li key={i}>💡 {inline(h)}</li>
              ))}
              {hintsShown === 0 ? <li>Have a go first — hints reduce your first-try bonus.</li> : null}
            </ul>
          </div>

          {outcome ? (
            <div className="panel p-5">
              <h2 className="text-lg font-semibold">
                {outcome.passed
                  ? `🎉 All ${outcome.total} tests passed!`
                  : `${outcome.passedCount} out of ${outcome.total} correct so far`}
              </h2>
              <ul className="mt-4 space-y-3 text-sm">
                {outcome.results.map((r) => (
                  <li
                    key={r.index}
                    className={`rounded-lg border p-3 ${
                      r.passed ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          r.passed ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {r.passed ? "✓" : "✗"}
                      </span>
                      <p className={`font-semibold ${r.passed ? "text-success" : "text-destructive"}`}>
                        Test {r.index + 1}: {r.passed ? "Correct!" : "Not quite right yet"}
                      </p>
                    </div>
                    {!r.passed ? (
                      <div className="mt-3 space-y-3 pl-8">
                        {r.stdin ? (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              🔤 We typed this in:
                            </p>
                            <div className="mt-1 rounded-md bg-secondary/50 p-2 font-mono text-xs">
                              {r.stdin.split("\n").map((line, i) => (
                                <div key={i}>{line || " "}</div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {(() => {
                          const { expectedParts, actualParts } = diffStrings(r.expected, r.actual);
                          // A highlighted run that's just a space or two renders as an
                          // invisible sliver otherwise - browsers collapse whitespace by
                          // default, and even with that off, a lone space with only a
                          // background tint is easy to miss entirely. Swap spaces for a
                          // visible middle dot inside highlighted runs only, so a missing
                          // or extra space is as obvious as a wrong letter. Newlines inside
                          // a part render as real line breaks rather than a symbol crammed
                          // onto one line - multi-line output is much easier to read that way.
                          const renderText = (text: string, markSpaces: boolean) => {
                            const shown = markSpaces ? text.replace(/ /g, "·") : text;
                            const lines = shown.split("\n");
                            return lines.map((line, li) => (
                              <span key={li}>
                                {line}
                                {li < lines.length - 1 ? <br /> : null}
                              </span>
                            ));
                          };
                          return (
                            <>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                  ✅ Your code should print:
                                </p>
                                <p className="mt-1 rounded-md bg-secondary/50 p-2 font-mono text-xs">
                                  {expectedParts.map((part, pi) =>
                                    part.type === "removed" ? (
                                      <span
                                        key={pi}
                                        className="rounded-sm bg-warning/30 px-0.5 text-warning underline decoration-warning decoration-2"
                                      >
                                        {renderText(part.text, true)}
                                      </span>
                                    ) : (
                                      <span key={pi}>{renderText(part.text, false)}</span>
                                    ),
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                  📝 Your code printed:
                                </p>
                                <p className="mt-1 rounded-md bg-secondary/50 p-2 font-mono text-xs">
                                  {r.actual ? (
                                    actualParts.map((part, pi) =>
                                      part.type === "added" ? (
                                        <span
                                          key={pi}
                                          className="rounded-sm bg-destructive/30 px-0.5 text-destructive underline decoration-destructive decoration-2"
                                        >
                                          {renderText(part.text, true)}
                                        </span>
                                      ) : (
                                        <span key={pi}>{renderText(part.text, false)}</span>
                                      ),
                                    )
                                  ) : (
                                    <span className="text-destructive">(nothing was printed)</span>
                                  )}
                                </p>
                              </div>
                              {r.actual && r.expected !== r.actual ? (
                                <p className="text-xs text-muted-foreground">
                                  🔎 The highlighted bit is different — check spelling, capital
                                  letters, and spaces (shown as a dot ·).
                                </p>
                              ) : null}
                            </>
                          );
                        })()}
                        {r.error ? (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              ⚠️ Your code had a problem:
                            </p>
                            <p className="mt-1 rounded-md bg-destructive/10 p-2 font-mono text-xs text-destructive">
                              {r.error}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="h-[20rem] overflow-hidden rounded-xl border border-border sm:h-[26rem]">
            <CodeMirror
              value={code}
              height="100%"
              theme="dark"
              extensions={pythonEditorExtensions}
              onChange={(value) => {
                setCode(value);
                setSyntaxError(null);
                setWaitingForInput(false);
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
            <Button
              variant="secondary"
              onClick={runConsole}
              disabled={consoleRunning || !engineReady}
              title="Try it out and see what it prints — doesn't count as an attempt"
            >
              {!engineReady ? "Starting Python…" : consoleRunning ? "Running…" : "▶ Run"}
            </Button>
            <Button
              onClick={run}
              disabled={running || !engineReady}
              title="Check your answer against the real tests"
            >
              {!engineReady ? "Starting Python…" : running ? "Testing…" : "✅ Test"}
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
          <p className="text-xs text-muted-foreground">
            <strong>Run</strong> lets you try your own input and see what happens.{" "}
            <strong>Test</strong> checks your answer for real, once you think you're done.
          </p>

          {consoleOutput != null || consoleError != null || waitingForInput ? (
            <div className="panel p-4">
              <p className="text-sm font-semibold">Console</p>
              <div className="mt-2 space-y-1 font-mono text-xs">
                {consoleOutput ? <pre className="whitespace-pre-wrap">{consoleOutput}</pre> : null}
                {waitingForInput ? (
                  <div className="flex items-center gap-1">
                    <span className="text-primary">›</span>
                    <input
                      ref={inputFieldRef}
                      className="flex-1 border-none bg-transparent font-mono text-xs text-foreground outline-none"
                      value={pendingAnswer}
                      onChange={(e) => setPendingAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void submitConsoleAnswer();
                      }}
                      autoFocus
                    />
                  </div>
                ) : null}
                {consoleError ? (
                  <pre className="whitespace-pre-wrap text-destructive">{consoleError}</pre>
                ) : null}
                {!consoleOutput && !consoleError && !waitingForInput ? (
                  <p className="text-muted-foreground">(no output)</p>
                ) : null}
              </div>
            </div>
          ) : null}

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
