import { createFileRoute, Link } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { BookOpenCheck, Code2, Gauge, GraduationCap, ListChecks, Swords } from "lucide-react";
import { LevelChip } from "@/components/Markbook";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/SiteFooter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { GCSE_TOPICS } from "@/lib/game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "H-Code Academy — Python practice for GCSE & A level" },
      {
        name: "description",
        content:
          "Python lessons, auto-marked tasks and OCR and AQA style exam questions for GCSE and A level computer science, with classes, homework and a markbook for teachers.",
      },
      { property: "og:title", content: "H-Code Academy — Python practice for GCSE & A level" },
      {
        property: "og:description",
        content:
          "Lessons, auto-marked tasks and exam-style questions, with a markbook that fills itself in. Made by a UK computer science teacher.",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.hcodeacademy.co.uk/" }],
  }),
  component: Landing,
});

// Kept short on purpose: what it is, proof, how it works, what's in it, then
// sign up. Everything else lives behind sign-in or in the footer links.

const STATS = [
  { n: String(GCSE_TOPICS.length), label: "GCSE topics, OCR and AQA" },
  { n: "700+", label: "auto-marked tasks" },
  { n: "414", label: "exam-style questions" },
  { n: "OCR + AQA", label: "both exam boards covered" },
];

const STEPS = [
  {
    t: "Create a class",
    d: "Share one join link. Students sign up and land in your class.",
  },
  {
    t: "Set the work",
    d: "Unlock lessons as you teach them. Homework adapts to each student.",
  },
  {
    t: "See who needs help",
    d: "The markbook updates as they work, plus a summary every Monday.",
  },
];

type Feature = {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  t: string;
  d: string;
  isNew?: boolean;
};

// "new" marks what arrived this term, for teachers who looked before. Take
// the tags off once they're no longer news.
const FEATURES: Feature[] = [
  { icon: BookOpenCheck, t: "Lessons", d: "Notes, a worked example, then tasks, for every topic." },
  { icon: Gauge, t: "Adaptive practice", d: "Each student gets tasks at their own level." },
  {
    icon: ListChecks,
    t: "Exam-style questions",
    d: "OCR and AQA style papers, plus revision papers.",
    isNew: true,
  },
  {
    icon: GraduationCap,
    t: "Markbook and reports",
    d: "Every student by topic, with CSV export.",
    isNew: true,
  },
  { icon: Code2, t: "Python editor", d: "Runs in the browser, with error help. No install." },
  {
    icon: Swords,
    t: "Duels, leaderboards and the Locker",
    d: "Reasons to come back, and XP only for first passes.",
    isNew: true,
  },
];

// Made-up students for the preview, drawn with the real markbook's chips.
const PREVIEW_TOPICS = ["Seq", "Sel", "Iter", "Lists"];
const PREVIEW_ROWS: {
  name: string;
  levels: (number | null)[];
  assess: string;
  hw: string;
  flag: "struggling" | "ready" | null;
  seen: string;
}[] = [
  {
    name: "Amira K.",
    levels: [4, 4, 3, 2],
    assess: "78%",
    hw: "100%",
    flag: null,
    seen: "25 Oct",
  },
  {
    name: "Ben T.",
    levels: [3, 2, 1, null],
    assess: "41%",
    hw: "60%",
    flag: "struggling",
    seen: "19 Oct",
  },
  {
    name: "Chloe R.",
    levels: [5, 5, 4, 4],
    assess: "86%",
    hw: "100%",
    flag: "ready",
    seen: "25 Oct",
  },
  {
    name: "Dev P.",
    levels: [3, 3, 2, 1],
    assess: "62%",
    hw: "80%",
    flag: null,
    seen: "24 Oct",
  },
  {
    name: "Ella M.",
    levels: [4, 2, 1, null],
    assess: "55%",
    hw: "80%",
    flag: "struggling",
    seen: "23 Oct",
  },
];

function MarkbookPreview() {
  return (
    <figure className="panel m-0 min-w-0 space-y-4 p-5" aria-label="Example markbook">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">Markbook</p>
          <p className="text-sm text-muted-foreground">
            Skill level per topic (1 to 5), plus assessment and homework percentages, in one grid.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" aria-hidden="true">
          <span className="rounded-md border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground">
            ↓ Sort: weakest topic
          </span>
          <span className="rounded-md border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground">
            Export CSV
          </span>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-max min-w-full text-left text-sm">
          <thead className="text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="border-r border-border px-3 py-2 font-medium">Student</th>
              {PREVIEW_TOPICS.map((t) => (
                <th key={t} className="px-1.5 py-2 text-center font-medium">
                  {t}
                </th>
              ))}
              <th className="px-3 py-2 text-center font-medium">Assess.</th>
              <th className="px-3 py-2 text-center font-medium">HW</th>
              <th className="px-3 py-2 text-center font-medium">Flags</th>
              <th className="px-3 py-2 font-medium">Last active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {PREVIEW_ROWS.map((r) => (
              <tr key={r.name}>
                <td className="border-r border-border px-3 py-2 font-medium whitespace-nowrap">
                  {r.name}
                </td>
                {r.levels.map((l, i) => (
                  <td key={i} className="px-1.5 py-2 text-center">
                    <LevelChip level={l} />
                  </td>
                ))}
                <td className="px-3 py-2 text-center tabular-nums">{r.assess}</td>
                <td className="px-3 py-2 text-center tabular-nums">{r.hw}</td>
                <td className="px-3 py-2 text-center text-sm">
                  {r.flag === "struggling" ? (
                    <span title="Struggling">🔴</span>
                  ) : r.flag === "ready" ? (
                    <span title="Ready for more">🟡</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground tabular-nums">
                  {r.seen}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <LevelChip level={1} /> new to the topic
        </span>
        <span className="flex items-center gap-1.5">
          <LevelChip level={3} /> getting there
        </span>
        <span className="flex items-center gap-1.5">
          <LevelChip level={5} /> confident
        </span>
      </figcaption>
    </figure>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-3xl font-semibold sm:text-4xl">{children}</h2>;
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
            <span className="hidden min-[420px]:inline">H-Code Academy</span>
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
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-14 pb-12 lg:grid-cols-[1fr_1.15fr] lg:pt-20">
        <div>
          <p className="font-mono text-xs tracking-[0.08em] text-primary uppercase">
            GCSE OCR &amp; AQA · A level
          </p>
          <h1 className="font-display mt-4 text-4xl leading-[1.05] font-semibold text-balance sm:text-6xl">
            Python practice for GCSE computer science.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Lessons, auto-marked tasks and exam-style questions, with a markbook that fills itself
            in. Made by a UK computer science teacher.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup", role: "teacher" }}>
                Set up your class
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth" search={{ mode: "signup" }}>
                I'm a student
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Just curious?{" "}
            <Link to="/ide" className="text-primary underline-offset-4 hover:underline">
              Try the Python editor
            </Link>
            , no account needed.
          </p>
        </div>
        <MarkbookPreview />
      </section>

      {/* At a glance */}
      <section aria-label="At a glance" className="border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-7 sm:grid-cols-4">
          {STATS.map((s) => (
            <p key={s.label}>
              <span className="font-display block text-4xl leading-none font-semibold text-primary">
                {s.n}
              </span>
              <span className="mt-1.5 block text-sm text-muted-foreground">{s.label}</span>
            </p>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <SectionHeading>How it works</SectionHeading>
        <ol className="mt-7 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.t} className="flex items-start gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary font-mono text-primary">
                {i + 1}
              </span>
              <span>
                <span className="block text-lg font-semibold">{s.t}</span>
                <span className="mt-1 block text-muted-foreground">{s.d}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* What's included */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <SectionHeading>What's included</SectionHeading>
        <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, t, d, isNew }) => (
            <li key={t} className="panel p-5">
              <Icon className="h-5 w-5 text-primary" strokeWidth={1.9} />
              <p className="mt-3 font-semibold">
                {t}
                {isNew ? (
                  <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 align-middle font-mono text-[11px] font-normal text-primary">
                    new
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5">
          <Link
            to="/features"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            See every feature, with screenshots →
          </Link>
        </p>
      </section>

      {/* Topics */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <SectionHeading>Every GCSE programming topic</SectionHeading>
        <ul className="mt-6 flex flex-wrap gap-2">
          {GCSE_TOPICS.map((t) => (
            <li key={t.key} className="rounded-full border border-border px-3 py-1.5 text-sm">
              {t.label}
              {"boards" in t ? <span className="ml-1 text-muted-foreground">(AQA)</span> : null}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          A level has its own separate track, which GCSE students never see.
        </p>
      </section>

      {/* Final call to action */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="panel px-6 py-12 text-center">
          <h2 className="font-display text-3xl font-semibold text-balance sm:text-4xl">
            Ready when your department is.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Set up a class in a couple of minutes and share one join link with your students.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup", role: "teacher" }}>
                Set up your class
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth" search={{ mode: "signup" }}>
                I'm a student
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
