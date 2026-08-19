# PyForge / Code Quest Academy — Project Context

This file is read automatically by Claude Code at the start of a session.
It exists because this project's context previously lived in a long chat
conversation — this is that context, carried over.

## What this is

A free, self-hosted Python learning platform for GCSE and A level Computer
Science students, built by the teacher (owner of this repo) using Lovable.
It exists specifically to **replace GoCodeIt.Online**, which the school used
until it went subscription-only and the school can't pay for it.

Students sign up, practise Python at a level matched to them, and teachers
create classes, set homework, and track progress. GCSE follows the OCR
specification. GCSE and A level content and progress are kept strictly
separate — GCSE students should never see A level ("higher programming")
material.

**Audience matters a lot here**: real students, several of them under 18,
will use this for real coursework. Content correctness and student data
handling are not "move fast" areas — see Constraints below.

## Original build brief (given to Lovable)

> I want a free way for students to sign up and practise depending on their
> skill level, with different challenges each time for thorough practice.
> GCSE OCR programming: sequencing, selection, iteration, lists, files,
> functions etc. GCSE kept separate from A level. Teachers create a class,
> set homework, check on students. Tasks matched to each student's skill
> level, and skill level updates as they go. A few gamemodes with
> gamification — students playing against each other, a leaderboard,
> teacher-student based. Self-hosted on the teacher's own server, own email
> sending, admin login, and a future way for people to subscribe and pay.

Follow-up brief, after the teacher asked Lovable to beat GoCodeIt specifically —
this is the **staged plan currently being built**:

### Stage 1 — Structured lessons and a deep task bank (in progress)
- Each topic (Sequencing, Selection, Iteration, Lists, Strings, Subprograms,
  File handling, plus separate A level topics) becomes a **lesson path**:
  a few lessons, each with teaching notes + a runnable worked example,
  followed by a task list, ending in a challenge set with exam-style
  wording. Lessons unlock in order; a progress ring shows topic completion;
  a pass threshold (configurable later) gates the next lesson.
- Free-choice **Practice mode** stays as-is alongside lesson paths.
- **Task bank with a wording ladder**: every task is tagged with a
  *wording tier* (1 = direct instruction, 2 = short context, 3 = scenario
  wording, 4 = OCR exam-style with success criteria/edge cases) as well as
  a difficulty. The adaptive engine should move a student up the wording
  ladder independently of code difficulty — a confident coder should still
  be stretched by the reading demand. Target ~20-30 tasks per GCSE topic
  (~150-200 GCSE tasks total), plus a smaller A level set, seeded topic by
  topic so each can be reviewed as it lands.
- **Task authoring UI** for the teacher: an admin/teacher editor to add or
  reword tasks without touching code (title, topic, difficulty, wording
  tier, brief, starter code, hints, test cases).

### Stage 2 — Exam-style theory quizzes (not started)
MCQ and short-answer questions per topic (trace tables, spot-the-error,
"state the purpose of…"), auto-marked where possible, short-answer items
flagged for teacher marking. Sit at the end of each lesson path; can be set
as homework.

### Stage 3 — Teacher markbook and reports (not started)
Grid of students × topics: skill level, tasks attempted/passed, accuracy,
quiz scores, last active. Filterable by class, sortable by weakest topic,
CSV export.

### Planned schema additions (per the original plan)
- New tables: `lessons` (topic, order, notes, worked example), a
  `lesson_tasks` link, `quiz_questions`, `quiz_attempts`.
- `wording_tier` and `lesson_id` columns added to the existing `challenges`
  table.
- `src/lib/progress.ts` adaptive selection extended to track a per-topic
  wording tier alongside the existing 1-5 skill level.
- Content seeded via SQL migrations (travels with the repo when
  self-hosted — nothing locked to the Lovable environment).
- Marking runs client-side in the browser via Pyodide — no code-execution
  server needed on the self-hosted box.

**Lovable's own progress note when it ran out of credits:**
> Done: `lessons` table created (track, topic, order, title, summary,
> notes, worked example; read access all signed-in, edit access
> teacher/admin). `challenges` extended with wording tier (1–4), optional
> lesson link, lesson order. `skills` extended with a wording tier column.
> Content authored (not yet loaded into the DB) for Sequencing, Selection,
> Iteration, and Lists — three lessons each, 12–16 tasks laddered across
> the four wording tiers.
> Still to do: content for Strings, Subprograms, File handling, and A
> level topics; loading authored content as seed migrations; the `/learn`
> lesson-path pages; tier-aware challenge selection in practice; the
> teacher/admin task editor; Stages 2 and 3 entirely.

## Explicit priority fixes from the teacher (most recent, and important)

These came after reviewing the build and take priority over extending the
Stage 1/2/3 plan further — **fix these before adding new surface area**:

1. **Classes still don't work properly.** Needs actual debugging — find out
   what's broken (creation? joining? membership queries? RLS?) before
   anything else touching classes/homework is built on top of it.
2. **The in-browser Python IDE needs to be much better**: syntax
   highlighting/colours, and actual error checking/debugging support, not
   just "run and see if tests pass."
3. **Visual design is too basic** and needs a real pass — see
   `frontend-design` skill for intentional visual design guidance rather
   than defaulting to generic component-library looks.
4. **Progressive/gated structure across the whole site**, not just within
   a topic's lessons: students should have to complete a section before
   the next unlocks, and the teacher should be able to see where each
   student currently is.
5. **Task wording quality is the biggest problem right now.** Direct
   quote: "even I could not understand what to do on most of the
   questions." This is more urgent than the wording-tier ladder concept —
   there's no point tiering reading difficulty upward if tier-1 tasks
   aren't clearly written. **Any new task content must be proofread for
   plain clarity by a human (the teacher) before it reaches students,**
   not just checked for correct test cases.

## Known state as of last review (verify — may be stale)

The teacher has been editing this project directly in Lovable (most
recently "this morning"), and separately a Claude session was working from
an uploaded zip that predates those edits. **Don't trust the summary below
as current — read the actual repo state first.** It's included so you know
what existed as of that snapshot:

- Stack: React + TanStack Router, Supabase backend, Pyodide for in-browser
  Python execution (no server-side execution).
- Routes seen: `dashboard`, `practice`, `play.$slug`, `duels`,
  `leaderboard`, `teacher.index`, `teacher.$classId`, `homework.$homeworkId`,
  `admin`, `auth`.
- `src/lib/game.ts` — topic definitions (GCSE_TOPICS, ALEVEL_TOPICS), XP
  curve, skill labels, badges.
- `src/lib/progress.ts` — adaptive skill level + XP/streak/badge recording,
  and `pickChallenge()` which picks a task near the student's rounded
  skill level.
- At that snapshot, seed content was **thin relative to the feature
  surface**: only 16 total tasks (4 per topic) existed for
  sequencing/selection/iteration/lists despite duels, leaderboard, homework,
  and per-class teacher views all already being routed. This is the
  "wide but shallow" pattern to watch for generally with Lovable-built
  scaffolding — it happily builds a route for anything asked, whether or
  not the content behind it is ready.
- Migrations exist for: core schema (profiles, roles, classes), a
  `challenges` seed insert, and the `lessons` table + `wording_tier`/
  `lesson_id` columns added to `challenges`.

## Work already drafted (not yet applied — needs re-doing against current repo)

A Claude Code / chat session generated a migration seeding 12 lessons and
52 tasks (Sequencing, Selection, Iteration, Lists) from authored JSON in
`seed/*.json`, joining tasks to lessons by slug. **This was never applied**
— while assembling it, a quote-balance self-check caught an unterminated
SQL string literal partway through the generated file (likely an
unescaped `'` in a task brief that wasn't doubled to `''`). The bug was
not yet fixed when the session ended, and the repo has since moved on
(Lovable edits this morning). Treat that draft as reference only, not
something to apply as-is — and given the wording-quality feedback above,
**each of those 52 tasks needs a clarity pass, not just a syntax-quoting
fix**, before going anywhere near students.

General lesson from this: when generating SQL (or any structured content)
programmatically, verify string escaping / balance before running it
against a real database, rather than assuming string-replace escaping was
applied correctly everywhere.

## Constraints to keep in view

- **Content correctness**: this is exam-facing material for a real
  qualification (GCSE OCR / A level). Wrong terminology or spec-mismatched
  tasks actively mislead students. Every batch of authored content should
  be reviewed by the teacher before going live, not just checked for
  passing test cases — and per the priority list above, plain clarity of
  wording matters as much as correctness.
- **Student data / safeguarding**: this app is not part of the school's
  procured/vetted IT systems, and it will hold data on minors (accounts,
  skill levels, task/homework history). The teacher should check with
  their school's DPO/IT lead before wider rollout — this file should not
  let that get silently dropped as the project moves forward.
- **Scope discipline**: the original brief plus the "beat GoCodeIt" plan
  covers lessons, a deep task bank, quizzes, a markbook, self-hosting,
  admin, and future payments — essentially the whole GoCodeIt product.
  Given the priority-fix list above, the recommendation is: fix classes,
  the IDE, design, and task wording quality on the *existing* four topics
  before expanding to Strings/Subprograms/File handling or starting Stage
  2/3. Get real classroom use on a smaller, solid base before building
  markbook/quiz layers on top.

## Workflow / tooling notes

- **Git is the source of truth.** Pull latest at the start of every
  session and commit/push at the end, regardless of which tool (Lovable,
  Claude Code) made the changes — the teacher previously lost sync between
  a Lovable-edited repo and a stale uploaded zip.
- **Division of labour going forward**: Claude Code for content authoring,
  bug fixes, schema/migration work, and logic (precise, reviewable diffs,
  no credit cost). Lovable reserved for new visual/UI scaffolding when
  credits allow, used deliberately rather than for everything.
- Avoid both tools editing the repo in the same window without pulling in
  between.
