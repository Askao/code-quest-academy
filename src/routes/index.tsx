import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpenCheck,
  Code2,
  FlaskConical,
  Gauge,
  GraduationCap,
  Link as LinkIcon,
  ListChecks,
  Swords,
  Trophy,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GCSE_TOPICS, ALEVEL_TOPICS } from "@/lib/game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "H-Code — free Python practice for GCSE & A level" },
      {
        name: "description",
        content:
          "Structured Python lesson paths, an adaptive task bank and a free in-browser IDE for GCSE OCR and A level, with teacher-paced classes, homework and leaderboards.",
      },
      { property: "og:title", content: "H-Code — free Python practice for GCSE & A level" },
      {
        property: "og:description",
        content:
          "Lesson paths, adaptive practice, teacher classes and a free browser IDE for computer science students.",
      },
    ],
  }),
  component: Landing,
});

function CodeMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-secondary/30 shadow-lg shadow-black/20">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        <span className="ml-2 font-mono text-xs text-muted-foreground">practice.py</span>
      </div>
      <pre className="overflow-x-auto p-4 text-left font-mono text-xs leading-relaxed sm:text-sm">
        <code>
          <span className="text-muted-foreground"># A till system rounds up the paint needed</span>
          {"\n"}
          <span className="text-accent">name</span> = <span className="text-primary">input</span>
          ()
          {"\n"}
          <span className="text-accent">area</span> = <span className="text-accent">width</span> *{" "}
          <span className="text-accent">height</span>
          {"\n"}
          <span className="text-primary">print</span>(f
          <span className="text-success">"Litres needed: {"{litres}"}"</span>)
        </code>
      </pre>
      <div className="border-t border-border bg-background/60 px-4 py-2.5 font-mono text-xs text-success">
        ✓ 3/3 tests passed · +25 XP
      </div>
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="font-mono text-lg font-bold text-primary">&gt;_ H-Code</span>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/ide">Try the IDE</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth" search={{ mode: "signup" }}>
                Get started
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-14 pb-16 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <div>
          <p className="font-mono text-sm text-primary">python practice, built for the classroom</p>
          <h1 className="mt-4 max-w-xl text-4xl font-bold text-balance sm:text-5xl">
            Structured lessons, adaptive practice, and a free Python IDE.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Every GCSE and A level topic runs as a lesson path — teaching notes, a worked example,
            laddered practice tasks and a quick check — with challenges chosen automatically at
            each student's own level.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup" }}>
                Create a free account
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/ide">Try the IDE — no account needed</Link>
            </Button>
          </div>
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            Free for students, always. Runs entirely in the browser — nothing executes on the
            server.
          </p>
        </div>
        <CodeMock />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { icon: BookOpenCheck, t: "Lesson paths", d: "Notes, a worked example, then practice." },
            { icon: Gauge, t: "Adapts to you", d: "Wording and difficulty match your level." },
            { icon: Code2, t: "Free IDE", d: "Write and run any Python, no challenge needed." },
            { icon: UserCheck, t: "Teacher-paced classes", d: "Or fully self-paced — your call." },
          ].map((c) => (
            <div key={c.t} className="panel p-5">
              <c.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
              <h3 className="mt-3 font-semibold">{c.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/20 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
            How a lesson works
          </p>
          <h2 className="mt-2 max-w-xl text-3xl font-semibold text-balance">
            Every topic runs the same reliable path, start to finish.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "1", t: "Teaching notes", d: "Plain-English explanations, not a wall of jargon." },
              { n: "2", t: "Worked example", d: "See real code run before writing your own." },
              {
                n: "3",
                t: "Laddered tasks",
                d: "Direct instructions first, working up to exam-style wording.",
              },
              { n: "4", t: "Quick check", d: "A few questions to check the theory landed, not just the code." },
            ].map((s, i) => (
              <div key={s.n} className="relative panel p-5">
                <span className="font-mono text-xs text-primary">{s.n}</span>
                <h3 className="mt-2 font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                {i < 3 ? (
                  <span className="absolute top-1/2 -right-4 hidden -translate-y-1/2 font-mono text-muted-foreground lg:block">
                    →
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Lessons unlock in order as each is mastered, and short recap questions from earlier
            topics keep resurfacing so nothing gets forgotten.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
          For teachers
        </p>
        <h2 className="mt-2 max-w-xl text-3xl font-semibold text-balance">
          Run your class at your own pace, not the app's.
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: LinkIcon,
              t: "One join link per class",
              d: "Students sign up through your link and land straight in your class — no separate join step.",
            },
            {
              icon: GraduationCap,
              t: "You control pacing",
              d: "Lessons stay locked for your students until you assign them, however far ahead the content goes.",
            },
            {
              icon: ListChecks,
              t: "Personalised homework",
              d: "Each student gets challenges picked at their own skill level for the topic you set — not one shared list.",
            },
            {
              icon: FlaskConical,
              t: "Real progress, not guesswork",
              d: "See exactly who's held back by mastery vs. who's just waiting on the next lesson to be set.",
            },
          ].map((c) => (
            <div key={c.t} className="panel p-5">
              <c.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
              <h3 className="mt-3 font-semibold">{c.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
        <Button asChild className="mt-6" variant="secondary">
          <Link to="/auth" search={{ mode: "signup", role: "teacher" }}>
            Set up a class
          </Link>
        </Button>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 md:grid-cols-2">
        <div className="panel p-6">
          <span className="rounded-full bg-gcse/15 px-3 py-1 font-mono text-xs text-gcse">
            GCSE · OCR
          </span>
          <h2 className="mt-4 text-2xl font-semibold">Exactly the GCSE spec, nothing more</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {GCSE_TOPICS.map((t) => (
              <li key={t.key}>
                <span className="text-foreground">{t.label}</span> — {t.blurb}
              </li>
            ))}
          </ul>
        </div>
        <div className="panel p-6">
          <span className="rounded-full bg-alevel/15 px-3 py-1 font-mono text-xs text-alevel">
            A level · separate track
          </span>
          <h2 className="mt-4 text-2xl font-semibold">Higher content, walled off</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {ALEVEL_TOPICS.map((t) => (
              <li key={t.key}>
                <span className="text-foreground">{t.label}</span> — {t.blurb}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            GCSE students never see these topics unless their teacher switches their class track.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Stay motivated
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Gauge, t: "Adaptive practice", d: "Challenges chosen from your live skill level." },
            { icon: FlaskConical, t: "Boss battles", d: "Timed rapid-fire runs for XP multipliers." },
            { icon: Swords, t: "Duels", d: "Race a classmate on the same challenge." },
            { icon: Trophy, t: "Class leaderboards", d: "XP, streaks and badges per class." },
          ].map((c) => (
            <div key={c.t} className="panel p-5">
              <c.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
              <h3 className="mt-3 font-semibold">{c.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        H-Code — self-hostable Python practice for computer science departments.
      </footer>
    </div>
  );
}
