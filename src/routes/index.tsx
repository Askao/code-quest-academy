import { createFileRoute, Link } from "@tanstack/react-router";
import type { ComponentType } from "react";
import {
  BookOpenCheck,
  Code2,
  Compass,
  FlaskConical,
  Gauge,
  GraduationCap,
  Hammer,
  Heart,
  Link as LinkIcon,
  ListChecks,
  Server,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { GCSE_TOPICS, ALEVEL_TOPICS } from "@/lib/game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "H-Code — free Python practice for GCSE & A level" },
      {
        name: "description",
        content:
          "Structured Python lesson paths, per-topic adaptive skill tracking, longer assessment projects and a free in-browser IDE for GCSE OCR and A level — with teacher-paced classes, personalised homework and class-wide analytics.",
      },
      { property: "og:title", content: "H-Code — free Python practice for GCSE & A level" },
      {
        property: "og:description",
        content:
          "Lesson paths, a real adaptive engine, projects, teacher classes and a free browser IDE for computer science students.",
      },
    ],
  }),
  component: Landing,
});

type Tint = "primary" | "accent" | "success" | "warning";

const tintClasses: Record<Tint, { bg: string; text: string; ring: string }> = {
  primary: { bg: "bg-primary/15", text: "text-primary", ring: "ring-primary/25" },
  accent: { bg: "bg-accent/15", text: "text-accent", ring: "ring-accent/25" },
  success: { bg: "bg-success/15", text: "text-success", ring: "ring-success/25" },
  warning: { bg: "bg-warning/15", text: "text-warning", ring: "ring-warning/25" },
};

function IconBadge({
  icon: Icon,
  tint,
  idle,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  tint: Tint;
  /** A continuous idle animation for icons where a hover-only cue isn't enough (e.g. a trophy). */
  idle?: "wiggle" | "pulse" | undefined;
}) {
  const c = tintClasses[tint];
  const idleClass =
    idle === "wiggle"
      ? "motion-safe:animate-wiggle"
      : idle === "pulse"
        ? "motion-safe:animate-pulse"
        : "";
  return (
    <span
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ring-1 ${c.ring} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6`}
    >
      <Icon className={`h-5 w-5 ${c.text} ${idleClass}`} strokeWidth={1.9} />
    </span>
  );
}

function Eyebrow({ children, tint = "primary" }: { children: React.ReactNode; tint?: Tint }) {
  const c = tintClasses[tint];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${c.bg} px-3 py-1 font-mono text-xs font-medium tracking-wide ${c.text}`}
    >
      {children}
    </span>
  );
}

function FeatureCard({
  icon,
  tint,
  title,
  desc,
  idle,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  tint: Tint;
  title: string;
  desc: string;
  idle?: "wiggle" | "pulse" | undefined;
}) {
  return (
    <div className="panel group p-5 transition-transform hover:-translate-y-0.5">
      <IconBadge icon={icon} tint={tint} idle={idle} />
      <h3 className="mt-3.5 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function StatCard({ n, label, tint }: { n: string; label: string; tint: Tint }) {
  const c = tintClasses[tint];
  return (
    <div className="panel p-5 text-center">
      <p className={`font-display text-3xl font-semibold sm:text-4xl ${c.text}`}>{n}</p>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
    </div>
  );
}

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
      <div className="border-t border-border bg-success/10 px-4 py-2.5 font-mono text-xs font-medium text-success">
        ✓ 3/3 tests passed · +25 XP
      </div>
    </div>
  );
}

function XpFloatCard() {
  return (
    <div className="panel hidden w-44 -translate-y-6 translate-x-6 rotate-2 p-3.5 shadow-glow sm:block">
      <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
        Iteration · skill
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full w-[58%] rounded-full bg-accent" />
      </div>
      <p className="mt-1.5 text-xs font-medium text-accent">58% — up from 42%</p>
    </div>
  );
}

function SkillMock() {
  return (
    <div className="panel p-5 shadow-glow">
      <p className="font-mono text-xs text-muted-foreground uppercase">
        Iteration · class skill level
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full w-[58%] rounded-full bg-accent" />
      </div>
      <p className="mt-1.5 font-mono text-xs text-accent">58% — up from 42% this week</p>
      <div className="mt-4 space-y-2.5 text-sm">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-success">✓</span>
          <span className="text-muted-foreground">
            Fast, first-try pass — <span className="text-foreground">bigger bump</span>, not a flat
            +1
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-warning">•</span>
          <span className="text-muted-foreground">
            One wrong answer — <span className="text-foreground">gentle −12%</span>, never a reset
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-destructive">✗</span>
          <span className="text-muted-foreground">
            Three wrong in a row — <span className="text-foreground">that's</span> when it steps
            down a level
          </span>
        </div>
      </div>
    </div>
  );
}

function LessonMock() {
  return (
    <div className="panel overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border bg-primary/10 px-4 py-2.5">
        <span className="font-mono text-xs text-primary">/learn</span>
        <BookOpenCheck className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Getting started</p>
          <span className="font-mono text-xs text-muted-foreground">2/20 tasks</span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-[10%] rounded-full bg-primary" />
        </div>
        <div className="mt-3 space-y-2">
          {[
            { n: "1", t: "Using the IDE & print()", d: "1/5 tasks" },
            { n: "2", t: "Variables — storing a value", d: "1/5 tasks" },
            { n: "3", t: "Getting input from the user", d: "0/5 tasks" },
          ].map((l) => (
            <div key={l.n} className="rounded-lg border border-border p-2.5 text-xs">
              <span className="font-mono text-muted-foreground">Lesson {l.n}</span>
              <p className="font-medium">{l.t}</p>
              <p className="mt-0.5 font-mono text-muted-foreground">{l.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectMock() {
  return (
    <div className="panel overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border bg-success/10 px-4 py-2.5">
        <span className="font-mono text-xs text-success">/practice — Projects</span>
        <Hammer className="h-3.5 w-3.5 text-success" strokeWidth={2} />
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold text-muted-foreground">Iteration</p>
        <div className="mt-2 space-y-2">
          {[
            { t: "Class Average Report", d: "difficulty 2/5 · 40 XP", done: true },
            { t: "Savings Goal Tracker", d: "difficulty 3/5 · 60 XP", done: false },
            { t: "Exam Results Summary", d: "difficulty 4/5 · 80 XP", done: false },
          ].map((p) => (
            <div
              key={p.t}
              className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-xs"
            >
              <span className={p.done ? "text-success" : "text-muted-foreground"}>
                {p.done ? "✓" : "🏗"}
              </span>
              <div className="flex-1">
                <p className="font-medium">{p.t}</p>
                <p className="font-mono text-muted-foreground">{p.d}</p>
              </div>
              <span className="rounded-md bg-success/90 px-2 py-1 font-mono text-success-foreground">
                {p.done ? "Redo" : "Start"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TeacherMock() {
  return (
    <div className="panel overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border bg-accent/10 px-4 py-2.5">
        <span className="font-mono text-xs text-accent">/teacher/[class] — Overview</span>
        <Gauge className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold text-muted-foreground">Class strength by topic</p>
        <div className="mt-2 space-y-2.5">
          {[
            { t: "Getting started", pct: 19 },
            { t: "Data types & variables", pct: 19 },
            { t: "Sequencing", pct: 16 },
          ].map((row) => (
            <div key={row.t} className="rounded-lg border border-border p-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium">{row.t}</span>
                <span className="font-mono text-muted-foreground">{row.pct}%</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-accent" style={{ width: `${row.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 border-t border-border pt-3 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>John Smith</span>
            <span className="font-mono">Level 2 · 45% accuracy</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Ada Lovelace</span>
            <span className="font-mono">Level 1 · 67% accuracy</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Landing() {
  const { user, loading } = useAuth();
  return (
    <div className="min-h-screen overflow-x-clip">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="flex items-center gap-2 font-mono text-lg font-bold text-primary">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
              &gt;_
            </span>
            H-Code
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/ide">Try the IDE</Link>
            </Button>
            {loading ? null : user ? (
              <Button asChild size="sm">
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Get started
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] overflow-hidden"
        >
          <div className="absolute -top-24 left-[8%] h-72 w-72 rounded-full bg-primary/20 blur-3xl motion-safe:animate-float" />
          <div
            className="absolute top-10 right-[10%] h-80 w-80 rounded-full bg-accent/15 blur-3xl motion-safe:animate-float"
            style={{ animationDelay: "-2.5s" }}
          />
          <div
            className="absolute top-56 left-[40%] h-56 w-56 rounded-full bg-success/10 blur-3xl motion-safe:animate-float"
            style={{ animationDelay: "-5s" }}
          />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-14 pb-16 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div>
            <Eyebrow tint="primary">
              <Sparkles className="h-3.5 w-3.5 motion-safe:animate-pulse" strokeWidth={2} />
              100% free · self-hosted by your department
            </Eyebrow>
            <h1 className="mt-5 max-w-xl text-4xl font-bold text-balance sm:text-5xl">
              Python practice built for the classroom, not a generic tutorial site.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Structured lesson paths, a real adaptive difficulty engine, and a free in-browser IDE
              — with classes, homework and progress tracking your department actually owns.
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
            <p className="mt-4 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
              Runs entirely in the browser — nothing executes on your server.
            </p>
          </div>
          <div className="relative">
            <CodeMock />
            <div className="absolute -right-2 -bottom-8 sm:-right-8">
              <XpFloatCard />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-16">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard n="150+" label="GCSE tasks" tint="primary" />
            <StatCard n="13" label="OCR-aligned topics" tint="accent" />
            <StatCard n="4" label="wording tiers, ladder-style" tint="success" />
            <StatCard n="£0" label="cost, forever" tint="warning" />
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={BookOpenCheck}
            tint="primary"
            title="Lesson paths"
            desc="Notes, a worked example, then practice — every topic, same reliable shape."
          />
          <FeatureCard
            icon={Gauge}
            tint="accent"
            title="Adapts to you"
            desc="Wording and difficulty track a live per-topic skill level, not just right/wrong."
          />
          <FeatureCard
            icon={Code2}
            tint="success"
            title="Free IDE"
            desc="Write and run any Python, no challenge needed, no account required."
          />
          <FeatureCard
            icon={UserCheck}
            tint="warning"
            title="Teacher-paced classes"
            desc="Or fully self-paced — lessons only unlock when you're ready."
          />
        </div>
      </section>

      {/* How a lesson works */}
      <section className="border-y border-border bg-secondary/20 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <Eyebrow tint="accent">How a lesson works</Eyebrow>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold text-balance">
            Every topic runs the same path, start to finish.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                { t: "Teaching notes", d: "Plain English, not a wall of jargon.", tint: "primary" },
                { t: "Worked example", d: "See real code run before writing your own.", tint: "accent" },
                { t: "Laddered tasks", d: "Direct instructions, building to exam-style wording.", tint: "success" },
                { t: "Quick check", d: "A few questions to check the theory landed too.", tint: "warning" },
              ] as { t: string; d: string; tint: Tint }[]
            ).map((s, i) => {
              const c = tintClasses[s.tint];
              return (
                <div key={s.t} className="relative panel p-5">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${c.bg} font-mono text-sm font-semibold ${c.text}`}
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-3 font-semibold">{s.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                  {i < 3 ? (
                    <span className="absolute top-1/2 -right-4 hidden -translate-y-1/2 font-mono text-muted-foreground lg:block">
                      →
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Lessons unlock in order as each is mastered. Recap questions from earlier topics keep
            resurfacing so nothing gets forgotten.
          </p>
        </div>
      </section>

      {/* Screenshots */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Eyebrow tint="success">See it in action</Eyebrow>
        <h2 className="mt-3 max-w-xl text-3xl font-semibold text-balance">
          Real screens — a lesson, a project, a teacher's view.
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Actual screens from the app, not stock photos.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <LessonMock />
          <ProjectMock />
          <TeacherMock />
        </div>
      </section>

      {/* Who it's for */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <Eyebrow tint="warning">Not in a class?</Eyebrow>
        <h2 className="mt-3 max-w-xl text-3xl font-semibold text-balance">
          Built for classrooms first — but you don't need one.
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Every lesson, adaptive challenge and the free IDE work exactly the same without a teacher
          or class attached — sign up, pick GCSE or A level, and go.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={Compass}
            tint="primary"
            title="Self-learners"
            desc="A structured path instead of a random tutorial, on your own timeline."
          />
          <FeatureCard
            icon={Heart}
            tint="accent"
            title="Parents & tutors"
            desc="Help fill gaps between lessons, no enrolment needed."
          />
          <FeatureCard
            icon={Code2}
            tint="success"
            title="Curious developers"
            desc="A free, no-signup Python sandbox — the IDE needs no account at all."
          />
        </div>
      </section>

      {/* For teachers */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Eyebrow tint="primary">For teachers</Eyebrow>
        <h2 className="mt-3 max-w-xl text-3xl font-semibold text-balance">
          Run your class at your own pace, not the app's.
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={LinkIcon}
            tint="primary"
            title="One join link per class"
            desc="Students sign up through your link and land straight in your class."
          />
          <FeatureCard
            icon={GraduationCap}
            tint="accent"
            title="You control pacing"
            desc="Lessons stay locked until you assign them, however far ahead the content goes."
          />
          <FeatureCard
            icon={ListChecks}
            tint="success"
            title="Personalised homework"
            desc="Each student gets challenges at their own skill level, not one shared list."
          />
          <FeatureCard
            icon={FlaskConical}
            tint="warning"
            title="Class-wide topic strength"
            desc="See which topic the whole class needs re-taught, not just one student."
          />
        </div>

        <div className="mt-6 grid items-center gap-8 rounded-2xl border border-accent/25 bg-accent/5 p-6 lg:grid-cols-[1fr_0.9fr] lg:p-8">
          <div>
            <Eyebrow tint="accent">Not a black box</Eyebrow>
            <h3 className="mt-3 text-2xl font-semibold text-balance">
              An adaptive engine tuned to not overreact.
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Most "adaptive" tools just count right vs. wrong. H-Code tracks a live skill level
              per student, per topic, built around one known failure mode: overreacting to a
              single bad answer.
            </p>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-success">✓</span>
                <span className="text-muted-foreground">
                  A fast, clean pass earns <span className="text-foreground">more</span>, pushing
                  confident students harder
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-warning">•</span>
                <span className="text-muted-foreground">
                  One mistake barely moves the needle — <span className="text-foreground">no</span>{" "}
                  reset to square one
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-foreground">→</span>
                <span className="text-muted-foreground">
                  Every signal rolls up class-wide:{" "}
                  <span className="text-foreground">"this class needs Iteration re-taught"</span>
                </span>
              </div>
            </div>
          </div>
          <SkillMock />
        </div>

        <Button asChild className="mt-6" size="lg" variant="secondary">
          <Link to="/auth" search={{ mode: "signup", role: "teacher" }}>
            Set up a class
          </Link>
        </Button>
      </section>

      {/* Spec coverage */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="panel overflow-hidden p-0">
            <div className="border-b border-primary/20 bg-primary/10 px-6 py-4">
              <span className="rounded-full bg-primary/20 px-3 py-1 font-mono text-xs font-medium text-primary">
                GCSE · OCR
              </span>
              <h2 className="mt-3 text-xl font-semibold">Exactly the spec, nothing more</h2>
            </div>
            <ul className="grid grid-cols-1 gap-x-4 gap-y-2 p-6 text-sm sm:grid-cols-2">
              {GCSE_TOPICS.map((t) => (
                <li key={t.key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{t.label}</span> — {t.blurb}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel overflow-hidden p-0">
            <div className="border-b border-accent/20 bg-accent/10 px-6 py-4">
              <span className="rounded-full bg-accent/20 px-3 py-1 font-mono text-xs font-medium text-accent">
                A level · separate track
              </span>
              <h2 className="mt-3 text-xl font-semibold">Higher content, walled off</h2>
            </div>
            <ul className="space-y-2 p-6 text-sm">
              {ALEVEL_TOPICS.map((t) => (
                <li key={t.key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{t.label}</span> — {t.blurb}
                  </span>
                </li>
              ))}
            </ul>
            <p className="border-t border-border px-6 py-4 text-xs text-muted-foreground">
              GCSE students never see these topics unless their teacher switches their class track.
            </p>
          </div>
        </div>
      </section>

      {/* Motivation strip */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <Eyebrow tint="warning">Stay motivated</Eyebrow>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <FeatureCard
            icon={Gauge}
            tint="primary"
            title="Adaptive practice"
            desc="Challenges chosen from your live skill level."
          />
          <FeatureCard
            icon={Hammer}
            tint="accent"
            title="Projects"
            desc="Longer assessments per topic that pull everything together."
          />
          <FeatureCard
            icon={FlaskConical}
            tint="success"
            title="Boss battles"
            desc="Timed rapid-fire runs for XP multipliers."
          />
          <FeatureCard
            icon={Swords}
            tint="warning"
            title="Duels"
            desc="Race a classmate on the same challenge."
          />
          <FeatureCard
            icon={Trophy}
            tint="primary"
            title="Leaderboards"
            desc="Top 10 by XP, plus who's improved most recently."
            idle="wiggle"
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-secondary/20 p-8 text-center sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(45rem_20rem_at_50%_0%,oklch(0.82_0.075_88/0.12),transparent_65%)]"
          />
          <Eyebrow tint="primary">
            <Server className="h-3.5 w-3.5" strokeWidth={2} />
            Self-hosted · your data stays yours
          </Eyebrow>
          <h2 className="mx-auto mt-4 max-w-xl text-3xl font-semibold text-balance">
            Free for every computer science department that wants it.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            No subscription, no per-seat pricing, no vendor lock-in — set up a class in minutes.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup", role: "teacher" }}>
                Set up your department
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/ide">Try the IDE first</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        H-Code — self-hostable Python practice for computer science departments.
      </footer>
    </div>
  );
}
