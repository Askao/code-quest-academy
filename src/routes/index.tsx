import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GCSE_TOPICS, ALEVEL_TOPICS } from "@/lib/game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "H-Code — free Python practice for GCSE & A level" },
      {
        name: "description",
        content:
          "Adaptive Python challenges for GCSE OCR programming and A level, with classes, homework, duels and class leaderboards. Free for students.",
      },
      { property: "og:title", content: "H-Code — free Python practice for GCSE & A level" },
      {
        property: "og:description",
        content:
          "Adaptive Python challenges, teacher classes, homework and gamified practice for computer science students.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <span className="font-mono text-lg font-bold text-primary">&gt;_ H-Code</span>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/auth" search={{ mode: "signup" }}>
              Get started
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-10 pb-16 text-center">
        <p className="font-mono text-sm text-primary">python practice, built for the classroom</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold text-balance sm:text-6xl">
          Every student gets a different challenge, at their own level.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          H-Code marks Python automatically in the browser, tracks a skill level per topic, and
          keeps GCSE OCR programming completely separate from A level content.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth" search={{ mode: "signup" }}>
              Create a free account
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/auth" search={{ mode: "signup", role: "teacher" }}>
              I'm a teacher
            </Link>
          </Button>
        </div>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Adaptive practice", d: "Challenges chosen from the student's live skill level." },
            { t: "Boss battles", d: "Timed rapid-fire runs for XP multipliers." },
            { t: "Duels", d: "Race a classmate on the same challenge." },
            { t: "Class leaderboards", d: "XP, streaks and badges per class." },
          ].map((c) => (
            <div key={c.t} className="panel p-5">
              <h3 className="font-semibold">{c.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
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
