import { PGlite } from "@electric-sql/pglite";
// Checks 20261003110000_weekly_reports.sql: first passes only, UK dates, the
// accuracy attempts, personal task lists, which homework is still relevant, the
// marking queue and released results - and that only the server can call them.
// Run after changing that file:
//
//   npm i --no-save @electric-sql/pglite
//   node scripts/test-weekly-reports-sql.mjs
//
// (Not part of `npm test` because it needs that extra package.)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root =
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../supabase/migrations") + "/";
const db = new PGlite();

await db.exec(`
  CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
  CREATE SCHEMA auth;
  CREATE TABLE auth.users (id uuid PRIMARY KEY);
  CREATE TABLE public.profiles (id uuid PRIMARY KEY, email text, full_name text);
  CREATE TABLE public.stats (user_id uuid PRIMARY KEY, xp int NOT NULL DEFAULT 0);
  CREATE TABLE public.challenges (id uuid PRIMARY KEY, title text, topic text);
  CREATE TABLE public.attempts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, challenge_id uuid, passed boolean NOT NULL, xp_awarded int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL);
  CREATE TABLE public.skills (user_id uuid, topic text, consecutive_fails int NOT NULL DEFAULT 0);
  CREATE TABLE public.classes (id uuid PRIMARY KEY, name text);
  CREATE TABLE public.class_members (class_id uuid, student_id uuid);
  CREATE TABLE public.homework (id uuid PRIMARY KEY, class_id uuid, title text, due_at timestamptz, created_at timestamptz NOT NULL, challenge_ids uuid[] NOT NULL DEFAULT '{}');
  CREATE TABLE public.homework_assignments (homework_id uuid, student_id uuid, challenge_ids uuid[] NOT NULL DEFAULT '{}');
  CREATE TABLE public.assessments (id uuid PRIMARY KEY, class_id uuid, title text, total_marks int, results_released boolean);
  CREATE TABLE public.assessment_attempts (id uuid PRIMARY KEY, assessment_id uuid, student_id uuid, submitted_at timestamptz, marked_at timestamptz);
  CREATE TABLE public.assessment_answers (attempt_id uuid, marks_awarded int);
  GRANT USAGE ON SCHEMA auth, public TO authenticated, service_role;
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO service_role;
  GRANT SELECT ON public.profiles TO authenticated;
`);
await db.exec(fs.readFileSync(root + "20261003110000_weekly_reports.sql", "utf8"));

const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const S1 = id(1), S2 = id(2), S3 = id(3), K = id(100);
const [C1, C2, C3, C4] = [id(11), id(12), id(13), id(14)];
const [H1, HOLD, HNODUE, HNODUEOLD] = [id(21), id(22), id(23), id(24)];
const [A1, A2, T1, T2, T3, T4] = [id(31), id(32), id(41), id(42), id(43), id(44)];

// Week: Monday 28 Sep 00:00 UK (BST = UTC+1) to Sunday 4 Oct 17:00 UK.
const FROM = "2026-09-27T23:00:00Z", TO = "2026-10-04T16:00:00Z", PREV = "2026-09-20T23:00:00Z";

await db.exec(`
  INSERT INTO public.stats VALUES ('${S1}', 300), ('${S2}', 0), ('${S3}', 50);
  INSERT INTO public.challenges VALUES
    ('${C1}','Task 1','iteration'), ('${C2}','Task 2','lists'), ('${C3}','Task 3','lists'), ('${C4}','Other','strings');
  INSERT INTO public.classes VALUES ('${K}','10B2');
  INSERT INTO public.class_members VALUES ('${K}','${S1}'), ('${K}','${S2}'), ('${K}','${S3}');
  INSERT INTO public.attempts (user_id, challenge_id, passed, xp_awarded, created_at) VALUES
    ('${S1}','${C1}', true, 20, '2026-09-29T10:00:00Z'),
    ('${S1}','${C2}', false, 0, '2026-09-30T23:30:00Z'),
    ('${S1}','${C2}', true, 30, '2026-10-01T10:00:00Z'),
    ('${S1}','${C1}', true, 0, '2026-10-02T10:00:00Z'),
    ('${S1}','${C4}', true, 15, '2026-09-21T10:00:00Z'),
    ('${S3}','${C2}', true, 25, '2026-10-02T09:00:00Z');
  INSERT INTO public.skills VALUES ('${S1}','lists',3), ('${S1}','iteration',2);
  INSERT INTO public.homework VALUES
    ('${H1}','${K}','Lists homework','2026-10-06T15:00:00Z','2026-09-28T09:00:00Z', ARRAY['${C1}','${C2}','${C3}']::uuid[]),
    ('${HOLD}','${K}','Ancient','2026-08-01T15:00:00Z','2026-07-20T09:00:00Z', ARRAY['${C1}']::uuid[]),
    ('${HNODUE}','${K}','No deadline, recent',NULL,'2026-09-29T09:00:00Z', ARRAY['${C1}']::uuid[]),
    ('${HNODUEOLD}','${K}','No deadline, old',NULL,'2026-08-20T09:00:00Z', ARRAY['${C1}']::uuid[]);
  INSERT INTO public.homework_assignments VALUES ('${H1}','${S3}', ARRAY['${C2}']::uuid[]);
  INSERT INTO public.assessments VALUES ('${A1}','${K}','Selection quiz', 20, true), ('${A2}','${K}','Unreleased paper', 10, false);
  INSERT INTO public.assessment_attempts VALUES
    ('${T1}','${A1}','${S1}','2026-10-01T09:00:00Z', NULL),
    ('${T2}','${A1}','${S2}','2026-10-01T09:00:00Z','2026-10-02T09:00:00Z'),
    ('${T3}','${A1}','${S3}', NULL, NULL),
    ('${T4}','${A2}','${S2}','2026-10-01T09:00:00Z','2026-10-02T09:00:00Z');
  INSERT INTO public.assessment_answers VALUES ('${T2}', 3), ('${T2}', 4), ('${T4}', 9);
`);

let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => {
  console.log((cond ? "PASS " : "FAIL ") + name + (cond ? "" : "  " + extra));
  cond ? pass++ : fail++;
};
const as = async (role, sql) => {
  await db.exec(`SET ROLE ${role}`);
  try { return { rows: (await db.query(sql)).rows }; }
  catch (e) { return { error: e.message }; }
  finally { await db.exec(`RESET ROLE`); }
};
const call = async (sql) => (await as("service_role", sql)).rows[0].v;

const week = await call(`SELECT public.report_student_week('${FROM}','${TO}','${PREV}') AS v`);
const w = (s) => week.find((x) => x.student_id === s);
ok("every student with a stats row appears, active or not", week.length === 3, String(week.length));
ok("tasks passed counts first passes in the week only (replays excluded)", w(S1).tasks_passed === 2, JSON.stringify(w(S1)));
ok("last week's first passes are counted separately", w(S1).prev_tasks_passed === 1);
ok("XP earned is what the attempts paid (replays paid 0)", w(S1).xp_earned === 50, String(w(S1).xp_earned));
ok("total XP comes from stats", w(S1).xp_total === 300);
ok(
  "active days are UK dates (23:30 UTC in BST is already the next day) and include replay days",
  JSON.stringify(w(S1).active_dates) === JSON.stringify(["2026-09-29", "2026-10-01", "2026-10-02"]),
  JSON.stringify(w(S1).active_dates),
);
ok("what they worked on is by topic", w(S1).topics.iteration === 1 && w(S1).topics.lists === 1, JSON.stringify(w(S1).topics));
ok(
  "accuracy counts attempts up to the first pass: pass, fail, pass = 3 attempts, 2 passed",
  w(S1).attempts_counted === 3 && w(S1).passed_counted === 2,
  JSON.stringify([w(S1).attempts_counted, w(S1).passed_counted]),
);
ok("attempts in the window includes the replay", w(S1).attempts_in_window === 4);
ok("last attempt is the newest of all time", w(S1).last_attempt_at.startsWith("2026-10-02"));
ok("three fails in a row marks a topic as stuck", JSON.stringify(w(S1).stuck_topics) === '["lists"]', JSON.stringify(w(S1).stuck_topics));
ok("a student who did nothing shows zeros and no last attempt", w(S2).tasks_passed === 0 && w(S2).attempts_in_window === 0 && w(S2).last_attempt_at === null);

const hw = await call(`SELECT public.report_homework_status('${TO}') AS v`);
const h = (s, id) => hw.find((x) => x.student_id === s && x.homework_id === id);
ok("homework set long ago and long overdue is left out", !hw.some((x) => x.homework_id === HOLD));
ok("a deadline-free homework set recently stays in, an old one is left out", hw.some((x) => x.homework_id === HNODUE) && !hw.some((x) => x.homework_id === HNODUEOLD));
ok("progress uses the shared list: 2 of 3 done", h(S1, H1).done === 2 && h(S1, H1).total === 3, JSON.stringify(h(S1, H1)));
ok("next task is the first one they haven't passed", h(S1, H1).next_task === "Task 3", String(h(S1, H1).next_task));
ok("a student who has done nothing starts at task 1", h(S2, H1).done === 0 && h(S2, H1).next_task === "Task 1");
ok("a personal task list replaces the shared one", h(S3, H1).total === 1 && h(S3, H1).done === 1 && h(S3, H1).next_task === null, JSON.stringify(h(S3, H1)));
ok("a finished homework carries when it was finished", h(S3, H1).last_pass.startsWith("2026-10-02"));
ok("the class name comes with it", h(S1, H1).class_name === "10B2");

const q = await call(`SELECT public.report_marking_queue() AS v`);
ok("papers handed in but not marked are queued per class", q.length === 1 && q[0].title === "Selection quiz" && q[0].unmarked === 1 && q[0].submitted === 2, JSON.stringify(q));

const res = await call(`SELECT public.report_results('${FROM}','${TO}') AS v`);
ok("released results marked this week are listed with marks", res.length === 1 && res[0].student_id === S2 && res[0].awarded === 7 && res[0].total === 20, JSON.stringify(res));
ok("results that have not been released are not", !res.some((x) => x.title === "Unreleased paper"));

ok("a signed-in student cannot call them", !!(await as("authenticated", `SELECT public.report_marking_queue()`)).error);
ok("nor can the public", !!(await as("anon", `SELECT public.report_student_week('${FROM}','${TO}','${PREV}')`)).error);
ok("the send log is server-only", !!(await as("authenticated", `SELECT * FROM public.weekly_report_log`)).error);
ok("a student can switch weekly emails off for themselves", !(await as("authenticated", `UPDATE public.profiles SET weekly_reports = false`)).error);
ok("but not change other profile columns they were never given", !!(await as("authenticated", `UPDATE public.profiles SET email = 'x'`)).error);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
