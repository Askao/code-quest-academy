# Beating gocodeit: lessons, a deep task bank, quizzes and a markbook

Goal: your own PyForge site covers everything you used gocodeit for — structured lesson paths, a big per-topic task bank with gradually harder wording, OCR-style theory quizzes, and a teacher markbook — running on your own server.

This plan is staged. Stage 1 (lessons + task bank) is what gets built first, as you chose.

## Stage 1 — Structured lessons and a deep task bank

### Lesson paths
Each topic (Sequencing, Selection, Iteration, Lists, Strings, Subprograms, File handling; plus the A Level topics kept separate) becomes a path:

```text
Topic: Iteration
  Lesson 1  Explain + worked example  ->  3 guided tasks
  Lesson 2  Explain + worked example  ->  4 tasks
  Lesson 3  Challenge set             ->  5 tasks (exam-style wording)
  End-of-topic quiz
```

- A lesson page shows short teaching notes, an annotated worked example you can run, then its task list.
- Lessons unlock in order; the topic shows a progress ring and unlocks the next lesson at a pass threshold you can set later.
- Practice mode stays as it is for free-choice revision.

### Task bank with a wording ladder
The main gap you named: students cope with the code but not the question wording. Every topic gets tasks tagged with a **wording tier** as well as a difficulty:

- Tier 1 — direct instruction ("Write a program that prints the numbers 1 to 10.")
- Tier 2 — short context, requirement still explicit.
- Tier 3 — scenario wording, requirement embedded in a sentence or two.
- Tier 4 — OCR exam-style scenario with success criteria and edge cases to spot.

The adaptive engine then moves a student up the wording ladder independently of code difficulty, so a confident coder still gets stretched by the reading. Roughly 20-30 tasks per GCSE topic (about 150-200 GCSE tasks in total), spread across tiers, plus a smaller A Level set. These are seeded into the database in batches, topic by topic, so you can review each topic as it lands.

### Task authoring for you
An admin/teacher task editor so you can add or reword tasks yourself later without touching code: title, topic, difficulty, wording tier, brief, starter code, hints, and test cases.

## Stage 2 — Exam-style theory quizzes
MCQ and short-answer questions per topic (trace tables, spot-the-error, "state the purpose of…"), auto-marked where possible, with short-answer items flagged for teacher marking. Sit at the end of each lesson path and can be set as homework.

## Stage 3 — Teacher markbook and reports
A grid of students by topic showing skill level, tasks attempted/passed, accuracy, quiz scores, and last active. Filter by class, sort by weakest topic, and CSV export for reports.

## Technical notes

- New tables: `lessons` (topic, order, notes, worked example), `lesson_tasks` link, `quiz_questions` and `quiz_attempts`, plus `wording_tier` and `lesson_id` columns on the existing `challenges` table. Each new public table ships with GRANTs and RLS scoped to student/teacher/admin as the existing tables are.
- Adaptive selection in `src/lib/progress.ts` extends to track a per-topic wording tier alongside the existing 1-5 skill level.
- Content is seeded through SQL migrations, so it travels with the repo when you self-host — nothing is locked to this environment.
- Marking still runs in the browser with Pyodide, so no code-execution server is needed on your box.

Stage 1 is a large content build; I'll do it topic by topic so you can check tone and wording as we go rather than at the end.
