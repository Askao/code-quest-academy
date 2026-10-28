import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/SiteFooter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { GCSE_TOPICS } from "@/lib/game";

const TITLE = "Features — H-Code Academy";
const DESCRIPTION =
  "Everything H-Code Academy does: lesson paths, a Python editor that points out mistakes, adaptive practice, revision papers, homework, a markbook, class reports and exam-style assessments for GCSE and A level computer science.";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "https://www.hcodeacademy.co.uk/features" }],
  }),
  component: Features,
});

// The screenshots in public/features/ are of the real site, filled with
// made-up students ("H Code 1", "H Code 2"...). Sizes are the files' own, so
// the page doesn't jump about while they load.
type Shot = { src: string; w: number; h: number; alt: string };
const shot = (name: string, w: number, h: number, alt: string): Shot => ({
  src: `/features/${name}.jpg`,
  w,
  h,
  alt,
});
const SHOTS = {
  learn: shot(
    "learn",
    1200,
    607,
    "The Lessons page: Iteration lessons 1 and 2 open, lessons 3 to 5 locked, and Combining techniques locked until Iteration is complete.",
  ),
  lessonNotes: shot(
    "lesson-notes",
    1200,
    703,
    "A lesson's teaching notes on count-controlled loops.",
  ),
  lessonExample: shot(
    "lesson-example",
    1200,
    381,
    "A worked example with Step and Run buttons and a console.",
  ),
  lessonQuiz: shot(
    "lesson-quiz",
    1200,
    559,
    "A lesson's quick check: multiple-choice questions about range().",
  ),
  taskError: shot(
    "task-error",
    1200,
    710,
    "A task with a missing colon: line 2 is highlighted red with the message Line 2: expected ':', and the test shows what should have been printed.",
  ),
  taskPass: shot(
    "task-pass",
    1200,
    526,
    "The same task fixed: all tests passed, with a Next challenge button.",
  ),
  ide: shot(
    "ide",
    1200,
    547,
    "The Python editor running a short program, with its output in the console.",
  ),
  practice: shot(
    "practice",
    1200,
    890,
    "The Practise page: today's recap, then a card for each topic with a skill bar.",
  ),
  revise: shot(
    "revise",
    1200,
    1054,
    "Building a revision paper: exam board, topics, question type, number of questions and a timer.",
  ),
  dashboard: shot(
    "dashboard",
    1200,
    984,
    "A student's dashboard: level, streak, XP, homework due and recap.",
  ),
  lessonsTab: shot(
    "lessons-tab",
    1200,
    1005,
    "A class's Lessons tab: lessons ticked as Allowed for four topics, and Iteration's lessons not yet allowed.",
  ),
  homeworkTab: shot(
    "homework-tab",
    1200,
    573,
    "Setting homework: title, due date, topics and how much work.",
  ),
  homeworkStudent: shot(
    "homework-student",
    1200,
    609,
    "A student's homework page with their five tasks, four done.",
  ),
  markbook: shot(
    "markbook",
    1200,
    531,
    "The markbook: eight students, a skill level from 1 to 5 for each topic, homework percentages, flags and last active dates.",
  ),
  report: shot(
    "report",
    1200,
    956,
    "The class report: homework done, students struggling, and strength by topic with the weakest first.",
  ),
  roster: shot(
    "roster",
    1200,
    539,
    "The class list: each student's level, accuracy, average skill, practice done and last active date.",
  ),
  emailTeacher: shot(
    "email-weekly-teacher",
    800,
    1250,
    "The weekly teacher email: students who need a nudge, homework handed in, and marking waiting.",
  ),
  emailStudent: shot(
    "email-weekly-student",
    800,
    1250,
    "The weekly student email: tasks passed, XP and homework to finish.",
  ),
  duels: shot("duels", 1200, 806, "The Duels page: classmates to challenge and recent duels."),
  leaderboard: shot(
    "leaderboard",
    1200,
    900,
    "The class leaderboard: students ranked by XP with their level and streak.",
  ),
  locker: shot(
    "locker",
    1200,
    881,
    "The Locker: avatars to unlock by levelling up, duels and streaks.",
  ),
};

function Screenshot({ s }: { s: Shot }) {
  return (
    <img
      src={s.src}
      width={s.w}
      height={s.h}
      alt={s.alt}
      loading="lazy"
      decoding="async"
      className="block h-auto w-full rounded-lg border border-border bg-card"
    />
  );
}

function Row({
  title,
  tag,
  flip,
  shots,
  caption,
  children,
}: {
  title: string;
  tag?: string;
  flip?: boolean;
  shots: Shot[];
  caption?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid items-center gap-6 md:grid-cols-[5fr_6fr] md:gap-10">
      <div className={`min-w-0 ${flip ? "md:order-2" : ""}`}>
        <h3 className="font-display flex flex-wrap items-baseline gap-x-3 text-2xl font-semibold text-balance">
          {title}
          {tag ? (
            <span className="font-mono text-xs font-normal tracking-wide text-accent uppercase">
              {tag}
            </span>
          ) : null}
        </h3>
        <div className="mt-2 space-y-3 text-muted-foreground [&_li]:mt-1 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-sm">
          {children}
        </div>
      </div>
      <figure className={`m-0 min-w-0 ${flip ? "md:order-1" : ""}`}>
        <div className={shots.length > 1 ? "grid grid-cols-2 items-start gap-3" : ""}>
          {shots.map((s) => (
            <Screenshot key={s.src} s={s} />
          ))}
        </div>
        {caption ? (
          <figcaption className="mt-2 text-xs text-muted-foreground">{caption}</figcaption>
        ) : null}
      </figure>
    </div>
  );
}

function Part({
  id,
  who,
  title,
  intro,
  children,
}: {
  id: string;
  who: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-border">
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-14">
        <div className="max-w-2xl">
          <p className="font-mono text-xs tracking-[0.08em] text-primary uppercase">{who}</p>
          <h2 className="font-display mt-2 text-3xl font-semibold text-balance sm:text-4xl">
            {title}
          </h2>
          {intro ? <p className="mt-3 text-muted-foreground">{intro}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

const JUMP = [
  ["learning", "Learning"],
  ["writing-code", "Writing code"],
  ["practice", "Practice and revision"],
  ["teachers", "For teachers"],
  ["motivation", "Motivation"],
  ["privacy", "Privacy"],
] as const;

function Features() {
  const { user, loading } = useAuth();
  return (
    <div className="min-h-screen overflow-x-clip">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-4">
          <Link to="/" className="flex items-center gap-2 font-mono text-lg font-bold text-primary">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
              &gt;_
            </span>
            <span className="hidden min-[420px]:inline">H-Code Academy</span>
          </Link>
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
              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get started
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-14 pb-12 lg:pt-20">
        <p className="font-mono text-xs tracking-[0.08em] text-primary uppercase">Features</p>
        <h1 className="font-display mt-4 max-w-3xl text-4xl leading-[1.05] font-semibold text-balance sm:text-6xl">
          Everything <span className="whitespace-nowrap">H-Code</span> Academy does
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Python practice for GCSE and A level computer science, built by a UK computer science
          teacher around the OCR and AQA specifications. Students learn, practise and revise;
          teachers set the work and see who needs help. It all runs in a web browser, with nothing
          to install.
        </p>
        <p className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground tabular-nums">{GCSE_TOPICS.length}</strong> GCSE
            topics
          </span>
          <span>
            <strong className="text-foreground tabular-nums">700+</strong> auto-marked tasks
          </span>
          <span>
            <strong className="text-foreground tabular-nums">414</strong> exam-style questions
          </span>
          <span>OCR and AQA</span>
        </p>
        <nav aria-label="Jump to" className="mt-6 flex flex-wrap gap-2">
          {JUMP.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-full border border-border px-3 py-1 text-sm transition-colors hover:border-primary hover:text-primary"
            >
              {label}
            </a>
          ))}
        </nav>
      </section>

      <Part
        id="learning"
        who="For students"
        title="Learning, one lesson at a time"
        intro="Each topic is a short path of lessons that build on each other, from the first print() to file handling and sorting algorithms."
      >
        <Row title="Lesson paths that unlock in order" shots={[SHOTS.learn]}>
          <p>
            Students work down each topic in order. The next lesson opens once they've passed the
            one before, and the next topic once the topic before it is done, so nobody skips the
            basics.
          </p>
          <ul>
            <li>
              <strong>{GCSE_TOPICS.length} GCSE topics</strong>, from Getting started to Robust
              programs, plus capstone projects
            </li>
            <li>A progress strip across the top shows where they are and what's next</li>
            <li>Each topic shows how many of its tasks they've passed</li>
          </ul>
        </Row>
        <Row
          title="Notes, then an example you can step through"
          flip
          shots={[SHOTS.lessonNotes, SHOTS.lessonExample]}
        >
          <p>
            Every lesson starts with short teaching notes and the key vocabulary for the exam. Then
            comes a worked example students can run one line at a time, predicting what each line
            will do before they click Step.
          </p>
          <ul>
            <li>Notes follow the OCR and AQA specifications, with exam-style terms</li>
            <li>The worked example runs real Python in the browser</li>
          </ul>
        </Row>
        <Row title="A quick check before the tasks" shots={[SHOTS.lessonQuiz]}>
          <p>
            A few multiple-choice questions check the theory has landed. Then come the lesson's
            tasks, ending with a stretch task for students who want more.
          </p>
        </Row>
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <h3 className="font-semibold">OCR or AQA</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose your exam board and the topic list matches its specification.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">SQL as well as Python</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              AQA's databases topic has real SQL queries against a sample database.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">
              A level{" "}
              <span className="ml-1 font-mono text-xs font-normal tracking-wide text-accent uppercase">
                coming soon
              </span>
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Every GCSE topic as foundations, plus object-oriented programming, recursion, data
              structures, algorithms, SQL and more.
            </p>
          </div>
        </div>
      </Part>

      <Part
        id="writing-code"
        who="For students"
        title="Writing real code"
        intro="Every task has a proper code editor next to it. Python runs inside the browser, so it works on school computers, Chromebooks and home laptops alike."
      >
        <Row title="Mistakes are pointed out, not just failed" shots={[SHOTS.taskError]}>
          <p>
            When code has an error, the line is highlighted in red and the error is shown above the
            buttons. Each test shows what was typed in, what the code should have printed and what
            it actually printed.
          </p>
          <ul>
            <li>
              <strong>Run</strong> to try your own input and see what happens
            </li>
            <li>
              <strong>Test</strong> to check the answer against the real tests
            </li>
            <li>Two hints per task, for when they're stuck</li>
          </ul>
        </Row>
        <Row title="Marked straight away" flip shots={[SHOTS.taskPass]}>
          <p>
            Every task is marked the moment students press Test, so they know straight away whether
            it's right and can move on to the next challenge.
          </p>
          <ul>
            <li>Colour-coded code that's easy to read</li>
            <li>Download any program to keep it</li>
          </ul>
        </Row>
        <Row title="An open Python editor" shots={[SHOTS.ide]}>
          <p>
            An editor for trying anything, with no task attached. Anyone can use it without an
            account. Students who are signed in can save their programs and come back to them.
          </p>
          <p>
            <Link to="/ide" className="text-primary underline-offset-4 hover:underline">
              Try the Python editor
            </Link>
          </p>
        </Row>
      </Part>

      <Part
        id="practice"
        who="For students"
        title="Practice and revision"
        intro="Lessons teach a topic once. Practice and revision keep it fresh until the exam."
      >
        <Row title="Practice at the right level" shots={[SHOTS.practice]}>
          <p>
            Each practice session picks tasks just above what the student can already do, and their
            skill level for that topic changes as they work.
          </p>
          <ul>
            <li>
              <strong>Today's recap</strong>: one quick task and one quick question each day
            </li>
            <li>
              <strong>Surprise me</strong> for a task from any topic they've covered
            </li>
            <li>
              <strong>Mixed boss battles</strong> across several topics, and longer projects
            </li>
          </ul>
        </Row>
        <Row title="Build your own revision paper" flip shots={[SHOTS.revise]}>
          <p>
            Students choose their exam board, topics, number of questions and an optional timer, and
            get an exam-style paper. They mark it themselves against the mark scheme and see which
            topics need more work.
          </p>
          <ul>
            <li>"Fix my mistakes" papers go back over questions they got wrong</li>
            <li>
              Teachers see a summary only: how much each student has done and how they scored
              themselves
            </li>
          </ul>
        </Row>
        <Row title="A dashboard that shows progress" shots={[SHOTS.dashboard]}>
          <p>
            Students see their level, streak and XP, any homework due, and a skill bar for every
            topic, so they always know what to work on next.
          </p>
        </Row>
      </Part>

      <Part
        id="teachers"
        who="For teachers"
        title="Classes, homework and the markbook"
        intro="Create a class, share its join link, and everything your students do appears in your class straight away."
      >
        <Row title="You choose what's open" shots={[SHOTS.lessonsTab]}>
          <p>
            Tick which lessons your class can see, topic by topic, as you teach them. Students can't
            race ahead of the class, and anyone who falls behind can catch up on what's been opened.
          </p>
          <ul>
            <li>One join link or code per class</li>
            <li>Add a co-teacher for shared or cover classes</li>
            <li>GCSE (OCR or AQA) or A level, per class</li>
          </ul>
        </Row>
        <Row
          title="Homework that fits each student"
          flip
          shots={[SHOTS.homeworkTab, SHOTS.homeworkStudent]}
          caption="Setting homework (left) and what a student sees (right)."
        >
          <p>
            Pick topics, a due date and how much work, and each student gets their own set of tasks
            at their own skill level, not the same list for everyone. It's marked as they go.
          </p>
          <ul>
            <li>Add instructions, and message the class</li>
            <li>Students can ask for help on a task</li>
            <li>Students who join the class later still get it</li>
            <li>See who's done it, and export the results</li>
          </ul>
        </Row>
        <Row title="A markbook that fills itself in" shots={[SHOTS.markbook]}>
          <p>
            Every student and every topic in one grid: skill level from 1 to 5, assessment and
            homework scores, flags and when they were last on.
          </p>
          <ul>
            <li>
              <strong>Sort by weakest topic</strong> to see who needs help
            </li>
            <li>
              <strong>Export it to a spreadsheet</strong> for your own records
            </li>
          </ul>
        </Row>
        <Row title="See where the class is struggling" flip shots={[SHOTS.report]}>
          <p>
            The class report puts the weakest topic at the top, so you know what to reteach.
            Students who keep getting tasks wrong, or who are ready for more, are flagged for you.
          </p>
          <ul>
            <li>Look at one student, or several, in detail</li>
            <li>
              Download assessment marks, question-by-question detail or the whole class as a
              spreadsheet
            </li>
          </ul>
        </Row>
        <Row title="Every student at a glance" shots={[SHOTS.roster]}>
          <p>
            The class list shows each student's level, accuracy, average skill, how much practice
            they've done and when they were last active. Open any student for the detail.
          </p>
          <h3 className="font-display pt-2 text-2xl font-semibold text-foreground">
            Exam-style assessments
          </h3>
          <p>
            Build a timed paper of OCR or AQA style questions for your class. You mark each answer
            against the mark scheme, then release the results when you're ready. The results
            analysis shows which questions the class found hardest.
          </p>
        </Row>
        <Row
          title="A weekly email"
          flip
          shots={[SHOTS.emailTeacher, SHOTS.emailStudent]}
          caption="The teacher's email (left) and a student's (right)."
        >
          <p>
            Every Monday morning, teachers get a summary of the week before: who needs a nudge,
            homework handed in, and anything waiting to be marked. Students get their own weekly
            email about their progress and the homework they have due.
          </p>
        </Row>
      </Part>

      <Part
        id="motivation"
        who="For students"
        title="Reasons to come back"
        intro="Small rewards for practising a little and often."
      >
        <Row title="Duels" shots={[SHOTS.duels]}>
          <p>Challenge a classmate to the same task. Whoever gets a correct answer fastest wins.</p>
        </Row>
        <Row title="Leaderboards" flip shots={[SHOTS.leaderboard]}>
          <p>
            Class and school leaderboards for top XP and most improved. XP only counts the first
            time a task is passed, so repeating easy tasks doesn't help.
          </p>
        </Row>
        <Row title="The Locker, streaks and badges" shots={[SHOTS.locker]}>
          <p>
            Avatars and banners unlock as students level up, win duels and keep a streak going.
            Badges mark milestones like a first pass or mastering a topic.
          </p>
        </Row>
      </Part>

      <Part id="privacy" who="For schools" title="Privacy and practicalities">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [
              "Only what it needs",
              "A name, an email address and progress. No adverts, and nothing is sold.",
            ],
            [
              "Delete any time",
              "Students and teachers can delete their own account and its data from their account page.",
            ],
            [
              "Nothing to install",
              "Runs in any modern browser. Python runs on the student's own device, not on a server.",
            ],
            ["Light or dark", "Switch between a light and a dark look at any time."],
            ["Made by a teacher", "Written by a UK computer science teacher, for real classes."],
            ["Questions?", "Use the contact form at the bottom of any page."],
          ].map(([t, d]) => (
            <div key={t}>
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          The full details are in the{" "}
          <Link to="/privacy" className="text-primary underline-offset-4 hover:underline">
            privacy policy
          </Link>
          .
        </p>
      </Part>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="panel flex flex-wrap items-center justify-between gap-6 px-6 py-10">
          <h2 className="font-display text-3xl font-semibold text-balance">
            See it with your own class.
          </h2>
          <div className="flex flex-wrap gap-3">
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
