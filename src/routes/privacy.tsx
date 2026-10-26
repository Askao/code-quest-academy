import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

// Who runs the site, shown in "Who we are", and where privacy questions go.
const RUN_BY = "Charlie Hughes";
const PRIVACY_EMAIL = "privacy@hcodeacademy.co.uk";
const LAST_UPDATED = "26 October 2026";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy policy — H-Code" },
      {
        name: "description",
        content:
          "What H-Code Academy stores about students and teachers, who can see it, and how to have it deleted.",
      },
      { property: "og:title", content: "Privacy policy — H-Code" },
    ],
  }),
  component: Privacy,
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="space-y-3 text-muted-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}

const mail = (
  <a className="text-primary underline" href={`mailto:${PRIVACY_EMAIL}`}>
    {PRIVACY_EMAIL}
  </a>
);

function Privacy() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold">
            H-Code Academy
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-10 px-4 py-10 leading-relaxed">
        <div>
          <h1 className="text-3xl font-bold">Privacy policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated {LAST_UPDATED}</p>
          <p className="mt-4">
            H-Code Academy is a free site where GCSE and A level students practise Python and their
            teachers set work and follow their progress. This page explains, in plain English, what
            we keep about you, why, who can see it, and how to get it removed. If you're a student
            and anything here is unclear, ask your teacher or email {mail}.
          </p>
        </div>

        <Section title="Who we are">
          <p>
            H-Code Academy (hcodeacademy.co.uk) is run by{" "}
            {RUN_BY
              ? `${RUN_BY}, a computer science teacher in the UK`
              : "a computer science teacher in the UK"}
            , who is responsible for the personal data described here (the "data controller"). For
            any question about your data, email {mail}.
          </p>
        </Section>

        <Section title="What we keep">
          <p>
            <strong>Your account:</strong> your name, email address and password (stored scrambled,
            so nobody can read it, us included), whether you're a student or a teacher, and which
            school and classes you belong to.
          </p>
          <p>
            <strong>Your work:</strong> the code you write and run in tasks, homework and
            assessments, whether it passed, your answers and marks, programs you save in the IDE,
            help requests and homework messages, and the progress the site works out from all of
            that (skill level per topic, XP, streaks, badges, and the avatar you pick).
          </p>
          <p>
            <strong>Emails we've sent you</strong> (homework notices and weekly reports), so nobody
            gets the same email twice.
          </p>
          <p>
            <strong>Contact form messages:</strong> if you use the Contact us form, your name, email
            address and message are emailed to us so we can reply. They aren't saved on the site.
          </p>
          <p>
            <strong>Rough visitor numbers:</strong> once you scroll, tap or type on a page, your
            browser tells our server it was visited, and whether it was the homepage or the sign-up
            page. Using files on our own server, it works out roughly which town and country the
            connection comes from, and whether it comes from a cloud data centre (which usually
            means a bot). We keep only daily counts (for example "Leeds: 12 visits"). We don't keep
            the IP address, and the counts can't be traced back to any person or account.
          </p>
          <p>
            We don't ask for dates of birth, addresses, phone numbers or photos, and we never show
            adverts.
          </p>
        </Section>

        <Section title="Why we keep it">
          <ul>
            <li>To run your account and sign you in.</li>
            <li>
              To mark your code, choose tasks that suit your level and unlock the next lessons.
            </li>
            <li>So your teacher can set homework and see how you're getting on.</li>
            <li>
              To send homework emails and weekly progress emails (you can turn weekly ones off).
            </li>
            <li>To keep the site working and secure, and to see roughly where it's being used.</li>
          </ul>
          <p>
            Under UK data protection law, we rely on our legitimate interest in providing a learning
            service that students and teachers have chosen to use. We don't use your data for
            anything else, and we never sell it or use it for marketing.
          </p>
        </Section>

        <Section title="Who can see it">
          <ul>
            <li>
              <strong>Your teachers</strong> (and other teachers at your school on H-Code) can see
              your progress, attempts, code and homework for their classes.
            </li>
            <li>
              <strong>Other students</strong> in your class or school can see your name, avatar and
              XP on leaderboards, and your name when you play them in a duel. They can't see your
              email or your code.
            </li>
            <li>
              <strong>The site administrator</strong> can manage accounts, but sees only shortened
              names and emails (like "Ada L." and "a***@school.org").
            </li>
          </ul>
        </Section>

        <Section title="Services we use">
          <p>
            A few trusted companies help run the site. They handle data only to provide their
            service to us:
          </p>
          <ul>
            <li>
              <strong>Supabase:</strong> stores the database and handles sign-in. Our database is
              hosted in the UK/EU.
            </li>
            <li>
              <strong>Railway:</strong> runs the web server. Like any web host, it may keep
              short-lived technical logs, including IP addresses, for security.
            </li>
            <li>
              <strong>Resend:</strong> delivers our emails, so it receives your email address and
              the message. It may process data in the United States, under the safeguards set out in
              its data processing agreement.
            </li>
            <li>
              <strong>Google Fonts and jsDelivr:</strong> your browser downloads the site's fonts
              and the in-browser Python from these services, which means they see your IP address.
              They receive nothing else about you.
            </li>
          </ul>
          <p>
            Your Python code runs inside your own browser, so it isn't sent to anyone else to run.
          </p>
        </Section>

        <Section title="Cookies and browser storage">
          <p>
            We don't use advertising or tracking cookies. Your browser stores only what the site
            needs: your sign-in session, your light/dark theme choice, an unsaved draft in the IDE,
            and the state of a game you're in the middle of. The visitor count doesn't use cookies
            or store anything in your browser.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            We keep your account and work for as long as your account exists, so your progress is
            there when you come back. You can delete your account yourself at any time from your
            Account page, and its work and progress are deleted with it straight away. If you're a
            teacher, any class you own is passed to its co-teacher if it has one, and otherwise
            deleted. If your school stops using H-Code, your teacher can ask us to delete all of its
            students' accounts. The daily visitor location counts contain no personal data.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            You can delete your account yourself from your Account page. You can also ask us, at any
            time, to:
          </p>
          <ul>
            <li>send you a copy of the data we hold about you;</li>
            <li>correct anything that's wrong;</li>
            <li>delete your account and everything in it;</li>
            <li>stop using your data in a particular way.</li>
          </ul>
          <p>
            Email {mail} from the address on your account, or ask your teacher to pass it on. We'll
            reply within one month. If you're unhappy with how we've handled your data, you can
            complain to the Information Commissioner's Office at{" "}
            <a
              className="text-primary underline"
              href="https://ico.org.uk"
              target="_blank"
              rel="noreferrer"
            >
              ico.org.uk
            </a>
            .
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If we change what we collect or how we use it, we'll update this page and change the
            date at the top. For big changes, we'll tell teachers by email first.
          </p>
        </Section>
      </main>
    </div>
  );
}
