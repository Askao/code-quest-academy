import { PGlite } from "@electric-sql/pglite";
// Checks the assessments migration and question seed against an in-memory
// Postgres (PGlite) with row-level security switched on - who can see and do
// what, the timer rules, and the marking maths. Run after changing either SQL
// file, or after growing the question pool:
//
//   npm i --no-save @electric-sql/pglite
//   node scripts/test-assessments-sql.mjs
//
// (Not part of `npm test` because it needs that extra package.)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root =
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../supabase/migrations") + "/";
const db = new PGlite();

// Stand-ins for the real schema the migration builds on.
await db.exec(`
  CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
  CREATE SCHEMA auth;
  CREATE TABLE auth.users (id uuid PRIMARY KEY);
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.uid', true), '')::uuid $$;
  CREATE TYPE public.app_role AS ENUM ('admin','teacher','student');
  CREATE TYPE public.track AS ENUM ('gcse','alevel');
  CREATE TABLE public.user_roles (user_id uuid, role public.app_role);
  CREATE TABLE public.classes (id uuid PRIMARY KEY, teacher_id uuid, board text DEFAULT 'ocr');
  CREATE TABLE public.class_members (class_id uuid, student_id uuid);
  GRANT SELECT ON public.user_roles, public.classes, public.class_members, auth.users TO authenticated;
  GRANT USAGE ON SCHEMA auth TO authenticated;
  CREATE FUNCTION public.has_role(_u uuid, _r public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS
    $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_u AND role=_r) $$;
  CREATE FUNCTION public.is_class_teacher(_c uuid, _u uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS
    $$ SELECT EXISTS (SELECT 1 FROM public.classes WHERE id=_c AND teacher_id=_u) $$;
  CREATE FUNCTION public.is_class_member(_c uuid, _u uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS
    $$ SELECT EXISTS (SELECT 1 FROM public.class_members WHERE class_id=_c AND student_id=_u) $$;
`);
const U = {
  T: "a0000000-0000-0000-0000-000000000001",
  X: "a0000000-0000-0000-0000-000000000002",
  S1: "b0000000-0000-0000-0000-000000000001",
  S2: "b0000000-0000-0000-0000-000000000002",
  S3: "b0000000-0000-0000-0000-000000000003",
};
const C = "c0000000-0000-0000-0000-00000000000c",
  D = "c0000000-0000-0000-0000-00000000000d";
await db.exec(`
  INSERT INTO auth.users VALUES ${Object.values(U)
    .map((u) => `('${u}')`)
    .join(",")};
  INSERT INTO public.user_roles VALUES ('${U.T}','teacher'),('${U.X}','teacher'),('${U.S1}','student'),('${U.S2}','student'),('${U.S3}','student');
  INSERT INTO public.classes VALUES ('${C}','${U.T}','ocr'),('${D}','${U.X}','aqa');
  INSERT INTO public.class_members VALUES ('${C}','${U.S1}'),('${C}','${U.S2}'),('${D}','${U.S3}');
`);

let pass = 0,
  fail = 0;
const ok = (name, cond, extra = "") => {
  console.log((cond ? "PASS " : "FAIL ") + name + (cond ? "" : "  " + extra));
  cond ? pass++ : fail++;
};

// Migration + seed (as the superuser, like applying them in the SQL editor).
await db.exec(fs.readFileSync(root + "20260926120000_assessments.sql", "utf8"));
await db.exec(fs.readFileSync(root + "20260926130000_seed_assessment_questions.sql", "utf8"));
await db.exec(fs.readFileSync(root + "20260928120000_my_assessment_analysis.sql", "utf8"));
const count = async (t) =>
  Number((await db.query(`SELECT count(*)::int AS n FROM public.${t}`)).rows[0].n);
const content = ["ocr", "aqa"].flatMap((b) =>
  JSON.parse(
    fs.readFileSync(path.resolve(root, "../../src/content/assessments/" + b + ".json"), "utf8"),
  ),
);
const nQuestions = content.length;
const nPoints = content.reduce((n, q) => n + q.markScheme.length, 0);
ok(`seed loaded all ${nQuestions} questions`, (await count("assessment_questions")) === nQuestions);
ok(`seed loaded all ${nPoints} mark points`, (await count("assessment_mark_points")) === nPoints);
await db.exec(fs.readFileSync(root + "20260926130000_seed_assessment_questions.sql", "utf8"));
ok(
  "re-running the seed changes nothing (idempotent)",
  (await count("assessment_questions")) === nQuestions &&
    (await count("assessment_mark_points")) === nPoints,
);

// Helper: run a statement as a given user in the `authenticated` role.
const as = async (who, sql, params = []) => {
  await db.exec(`SET ROLE authenticated; SET app.uid = '${U[who]}'`);
  try {
    return { rows: (await db.query(sql, params)).rows };
  } catch (e) {
    return { error: e.message };
  } finally {
    await db.exec(`RESET ROLE; RESET app.uid`);
  }
};
const admin = (sql, params = []) => db.query(sql, params);
const fn = (who, call, params = []) => as(who, `SELECT ${call} AS r`, params);

// ---- bank & mark schemes are teacher-only
ok(
  "teacher can read the question bank",
  (await as("T", "SELECT count(*)::int n FROM public.assessment_questions")).rows[0].n ===
    nQuestions,
);
ok(
  "teacher can read mark schemes",
  (await as("T", "SELECT count(*)::int n FROM public.assessment_mark_points")).rows[0].n ===
    nPoints,
);
ok(
  "student sees NO questions directly",
  (await as("S1", "SELECT count(*)::int n FROM public.assessment_questions")).rows[0].n === 0,
);
ok(
  "student sees NO mark schemes directly",
  (await as("S1", "SELECT count(*)::int n FROM public.assessment_mark_points")).rows[0].n === 0,
);

// ---- setting an assessment
const qids = (
  await admin(
    `SELECT id FROM public.assessment_questions WHERE board='ocr' AND topic='iteration' ORDER BY id`,
  )
).rows.map((r) => r.id);
const marksOf = (await admin(`SELECT id, marks FROM public.assessment_questions`)).rows.reduce(
  (m, r) => ((m[r.id] = r.marks), m),
  {},
);
const total = qids.reduce((s, id) => s + marksOf[id], 0);
const A = "d0000000-0000-0000-0000-00000000000a";
let r = await as(
  "S1",
  `INSERT INTO public.assessments (id, class_id, title, board, time_limit_minutes) VALUES ('${A}','${C}','x','ocr',30)`,
);
ok("a student cannot set an assessment", !!r.error);
r = await as(
  "X",
  `INSERT INTO public.assessments (id, class_id, title, board, time_limit_minutes) VALUES ('${A}','${C}','x','ocr',30)`,
);
ok("a teacher of ANOTHER class cannot set one for this class", !!r.error);
r = await as(
  "T",
  `INSERT INTO public.assessments (id, class_id, title, board, topics, time_limit_minutes, question_count, total_marks, created_by)
  VALUES ('${A}','${C}','Iteration test','ocr','{iteration}',30,${qids.length},${total},'${U.T}')`,
);
ok("the class's teacher can set an assessment", !r.error, r.error);
for (const [i, id] of qids.entries()) {
  r = await as(
    "T",
    `INSERT INTO public.assessment_items (assessment_id, position, question_id) VALUES ('${A}',${i + 1},'${id}')`,
  );
  if (r.error) ok("teacher builds the paper", false, r.error);
}
ok("teacher built the paper", (await count("assessment_items")) === qids.length);
r = await as(
  "S1",
  `INSERT INTO public.assessment_items (assessment_id, position, question_id) VALUES ('${A}',99,'${qids[0]}')`,
);
ok("a student cannot add questions to a paper", !!r.error);

ok(
  "student in the class sees the assessment",
  (await as("S1", "SELECT count(*)::int n FROM public.assessments")).rows[0].n === 1,
);
ok(
  "student in another class does not",
  (await as("S3", "SELECT count(*)::int n FROM public.assessments")).rows[0].n === 0,
);
ok(
  "student cannot read the paper's items directly",
  (await as("S1", "SELECT count(*)::int n FROM public.assessment_items")).rows[0].n === 0,
);

// ---- starting
ok(
  "a student from another class cannot start it",
  /not in this class/.test(
    (await fn("S3", `(public.start_assessment('${A}')).attempt_id`)).error ?? "",
  ),
);
r = await as("S1", `SELECT * FROM public.start_assessment('${A}')`);
ok("a student can start it", !r.error && r.rows.length === 1, r.error);
const t1 = r.rows[0];
ok(
  "deadline is start + time limit",
  new Date(t1.deadline) - new Date(t1.started_at) === 30 * 60000,
);
await new Promise((res) => setTimeout(res, 50));
r = await as("S1", `SELECT * FROM public.start_assessment('${A}')`);
ok(
  "starting again returns the SAME attempt and start time (clock can't be reset)",
  r.rows[0].attempt_id === t1.attempt_id &&
    +new Date(r.rows[0].started_at) === +new Date(t1.started_at),
);

// ---- the paper
r = await fn("S1", `public.assessment_paper('${t1.attempt_id}')`);
const paper = r.rows[0].r;
ok(
  "the paper reports the server clock for the countdown",
  Math.abs(new Date(paper.server_now) - Date.now()) < 5000,
);
ok(
  "student gets every question, in order",
  paper.questions.length === qids.length && paper.questions[0].question_id === qids[0],
);
ok(
  "the paper contains no mark scheme",
  !JSON.stringify(paper).match(/markScheme|mark_scheme|guidance|Accept/i),
  JSON.stringify(paper).slice(0, 80),
);
ok(
  "another student cannot open this attempt's paper",
  /not found/.test((await fn("S2", `public.assessment_paper('${t1.attempt_id}')`)).error ?? ""),
);
ok(
  "a student who hasn't started has no paper",
  /not found/.test(
    (await fn("S2", `public.assessment_paper('00000000-0000-0000-0000-000000000000')`)).error ?? "",
  ),
);

// ---- answering
const save = (who, att, q, text) =>
  fn(who, `public.save_assessment_answer($1, $2, $3)`, [att, q, text]);
ok(
  "student can save an answer",
  !(await save("S1", t1.attempt_id, qids[0], "for and while")).error,
);
ok(
  "saving again overwrites (autosave)",
  !(await save("S1", t1.attempt_id, qids[0], "for and while loops")).error,
);
ok(
  "the saved answer comes back in the paper",
  (await fn("S1", `public.assessment_paper('${t1.attempt_id}')`)).rows[0].r.questions[0].answer ===
    "for and while loops",
);
ok(
  "cannot answer a question that isn't on the paper",
  /not part/.test((await save("S1", t1.attempt_id, "aqa-iteration-01", "x")).error ?? ""),
);
ok(
  "another student cannot save into this attempt",
  /not found/.test((await save("S2", t1.attempt_id, qids[0], "x")).error ?? ""),
);
ok(
  "an over-long answer is refused",
  /too long/.test((await save("S1", t1.attempt_id, qids[0], "x".repeat(20001))).error ?? ""),
);
ok(
  "student cannot write answers directly",
  !!(
    await as(
      "S1",
      `INSERT INTO public.assessment_answers (attempt_id, question_id, answer) VALUES ('${t1.attempt_id}','${qids[1]}','hack')`,
    )
  ).error,
);

// ---- marking is blocked while the student is still working
const pts = (arr) => JSON.stringify(arr);
r = await fn("T", `public.mark_assessment_answer($1, $2, $3::jsonb, $4)`, [
  t1.attempt_id,
  qids[0],
  pts([{ position: 1, awarded: true }]),
  "",
]);
ok(
  "teacher cannot mark while the student is still working",
  /still working/.test(r.error ?? ""),
  r.error,
);

// ---- timer: simulate the student running out of time
await admin(
  `UPDATE public.assessment_attempts SET started_at = now() - interval '30 minutes 20 seconds' WHERE id='${t1.attempt_id}'`,
);
ok(
  "a save inside the 45s grace after the deadline is still accepted",
  !(await save("S1", t1.attempt_id, qids[1], "late but ok")).error,
);
await admin(
  `UPDATE public.assessment_attempts SET started_at = now() - interval '31 minutes 30 seconds' WHERE id='${t1.attempt_id}'`,
);
ok(
  "a save well after the deadline is refused",
  /Time is up/.test((await save("S1", t1.attempt_id, qids[1], "too late")).error ?? ""),
);
ok(
  "after time is up the teacher may mark even without a submit",
  !(
    await fn("T", `public.mark_assessment_answer($1, $2, $3::jsonb, $4)`, [
      t1.attempt_id,
      qids[0],
      pts([{ position: 1, awarded: true }]),
      "ok",
    ])
  ).error,
);
await admin(`UPDATE public.assessment_attempts SET started_at = now() WHERE id='${t1.attempt_id}'`);

ok("student submits", !(await fn("S1", `public.submit_assessment('${t1.attempt_id}')`)).error);
ok(
  "saving after submitting is refused",
  /already been submitted/.test(
    (await save("S1", t1.attempt_id, qids[0], "changed my mind")).error ?? "",
  ),
);
ok(
  "submitting twice is harmless",
  !(await fn("S1", `public.submit_assessment('${t1.attempt_id}')`)).error,
);

// ---- marking
const q0 = qids[0],
  q2 = qids[2],
  q4 = qids[4];
const mark = (who, att, q, points, comment = "") =>
  fn(who, `public.mark_assessment_answer($1, $2, $3::jsonb, $4)`, [att, q, pts(points), comment]);
ok(
  "a student cannot mark",
  /Only this class/.test(
    (
      await mark("S1", t1.attempt_id, q0, [
        { position: 1, awarded: true },
        { position: 2, awarded: true },
      ])
    ).error ?? "",
  ),
);
ok(
  "a teacher of another class cannot mark",
  /Only this class/.test(
    (await mark("X", t1.attempt_id, q0, [{ position: 1, awarded: true }])).error ?? "",
  ),
);
r = await mark(
  "T",
  t1.attempt_id,
  q0,
  [
    { position: 1, awarded: true },
    { position: 2, awarded: false },
  ],
  "Missed the second type",
);
ok(`YES on 1 of 2 points awards 1 mark (${q0})`, r.rows?.[0].r === 1, JSON.stringify(r));
r = await mark("T", t1.attempt_id, q0, [
  { position: 1, awarded: true },
  { position: 2, awarded: true },
]);
ok("re-marking replaces the earlier ruling: both points = 2", r.rows?.[0].r === 2);
// Q2 (ocr-iteration-02) is 2 marks but offers 3 points of 1: capping matters.
const cap = qids.find((id) => id === "ocr-iteration-02");
r = await mark("T", t1.attempt_id, cap, [
  { position: 1, awarded: true },
  { position: 2, awarded: true },
  { position: 3, awarded: true },
]);
ok(
  "three YES on a '2 marks, 3 points' question is capped at 2",
  r.rows?.[0].r === 2,
  JSON.stringify(r),
);
r = await mark(
  "T",
  t1.attempt_id,
  q4,
  [
    { position: 1, awarded: true },
    { position: 3, awarded: true },
    { position: 6, awarded: true },
  ],
  "Partly there",
);
ok(
  "a question the student never answered can still be marked (blank row created)",
  !r.error && r.rows[0].r === 3,
  r.error,
);
ok(
  "a point left out of the list counts as NO",
  (await mark("T", t1.attempt_id, q2, [{ position: 2, awarded: true }])).rows[0].r === 1,
);
ok(
  "marks record whether each point was awarded",
  (
    await admin(
      `SELECT count(*)::int n FROM public.assessment_marks WHERE attempt_id='${t1.attempt_id}' AND question_id='${q2}' AND awarded`,
    )
  ).rows[0].n === 1,
);
ok(
  "teacher can read answers",
  (
    await as(
      "T",
      `SELECT count(*)::int n FROM public.assessment_answers WHERE attempt_id='${t1.attempt_id}'`,
    )
  ).rows[0].n >= 4,
);
ok(
  "student cannot read answers or marks directly",
  (await as("S1", `SELECT count(*)::int n FROM public.assessment_answers`)).rows[0].n === 0 &&
    (await as("S1", `SELECT count(*)::int n FROM public.assessment_marks`)).rows[0].n === 0,
);
ok(
  "student cannot see another student's attempt",
  (await as("S2", `SELECT count(*)::int n FROM public.assessment_attempts`)).rows[0].n === 0,
);
ok(
  "the student sees their own attempt",
  (await as("S1", `SELECT count(*)::int n FROM public.assessment_attempts`)).rows[0].n === 1,
);

// ---- results
ok(
  "results are hidden until marked and released",
  (await fn("S1", `public.my_assessment_result('${t1.attempt_id}')`)).rows[0].r.available === false,
);
ok(
  "teacher marks the attempt complete",
  !(await fn("T", `public.set_assessment_marked('${t1.attempt_id}', true)`)).error,
);
ok(
  "still hidden until the teacher releases results",
  (await fn("S1", `public.my_assessment_result('${t1.attempt_id}')`)).rows[0].r.available === false,
);
ok(
  "teacher releases results",
  !(await as("T", `UPDATE public.assessments SET results_released = true WHERE id='${A}'`)).error,
);
const res = (await fn("S1", `public.my_assessment_result('${t1.attempt_id}')`)).rows[0].r;
ok(
  "released + marked: the student sees their score",
  res.available === true && res.marks_awarded === 2 + 2 + 3 + 1,
  JSON.stringify(res).slice(0, 120),
);
ok(
  "the student's result has comments but no mark scheme",
  !JSON.stringify(res).match(/guidance|mark_points|Accept/i) &&
    res.questions.some((q) => q.comment === "Partly there"),
);

// ---- my_assessment_analysis(): the dashboard's "My results" data
{
  const mine = (await fn("S1", "public.my_assessment_analysis()")).rows[0].r;
  ok("analysis: one marked, released assessment comes back", mine.length === 1 && mine[0].assessment_id === A);
  const item = mine[0];
  ok("analysis: marks add up (2+2+3+1 = 8)", item.marks_awarded === 8, JSON.stringify(item.marks_awarded));
  ok(
    "analysis: total marks is the sum of the paper's question marks",
    item.total_marks === qids.reduce((n, id) => n + marksOf[id], 0),
  );
  ok(
    "analysis: every question carries its topic, marks and score",
    item.questions.length === qids.length &&
      item.questions.every((x) => x.topic === "iteration" && typeof x.marks === "number" && typeof x.marks_awarded === "number"),
  );
  ok("analysis: the teacher's comment is included", item.questions.some((x) => x.comment === "Partly there"));
  ok("analysis: no mark scheme leaks", !JSON.stringify(mine).match(/guidance|mark_points|Accept/i));
  ok("analysis: another student in the class sees nothing of S1's work", (await fn("S2", "public.my_assessment_analysis()")).rows[0].r.length === 0);
  ok("analysis: a student in another class sees nothing", (await fn("S3", "public.my_assessment_analysis()")).rows[0].r.length === 0);
  await admin(`UPDATE public.assessments SET results_released = false WHERE id='${A}'`);
  ok("analysis: withdrawing the results hides them from the analysis too", (await fn("S1", "public.my_assessment_analysis()")).rows[0].r.length === 0);
  await admin(`UPDATE public.assessments SET results_released = true WHERE id='${A}'`);
  await admin(`UPDATE public.assessment_attempts SET marked_at = NULL WHERE id='${t1.attempt_id}'`);
  ok("analysis: unmarked work is not analysed", (await fn("S1", "public.my_assessment_analysis()")).rows[0].r.length === 0);
  await admin(`UPDATE public.assessment_attempts SET marked_at = now() WHERE id='${t1.attempt_id}'`);
  ok("analysis: restored once marked and released again", (await fn("S1", "public.my_assessment_analysis()")).rows[0].r.length === 1);
}

// ---- window rules (B is created here)
const B = "d0000000-0000-0000-0000-00000000000b";
await as(
  "T",
  `INSERT INTO public.assessments (id, class_id, title, board, time_limit_minutes, question_count, total_marks, opens_at)
  VALUES ('${B}','${C}','Later','ocr',20,1,2, now() + interval '1 day')`,
);
await as("T", `INSERT INTO public.assessment_items VALUES ('${B}',1,'${qids[0]}')`);
{
  await as("S1", `UPDATE public.assessments SET results_released = true WHERE id='${B}'`);
  await as("S1", `UPDATE public.assessments SET title = 'hacked' WHERE id='${B}'`);
  const row = (
    await admin(`SELECT results_released, title FROM public.assessments WHERE id='${B}'`)
  ).rows[0];
  ok(
    "a student cannot release results or edit an assessment",
    row.results_released === false && row.title === "Later",
    JSON.stringify(row),
  );
}
ok(
  "cannot start before it opens",
  /not opened/.test((await fn("S2", `(public.start_assessment('${B}')).attempt_id`)).error ?? ""),
);
await admin(
  `UPDATE public.assessments SET opens_at = NULL, closes_at = now() - interval '1 minute' WHERE id='${B}'`,
);
ok(
  "cannot start after it has closed",
  /closed/.test((await fn("S2", `(public.start_assessment('${B}')).attempt_id`)).error ?? ""),
);
await admin(`UPDATE public.assessments SET closes_at = now() + interval '1 hour' WHERE id='${B}'`);
r = await as("S2", `SELECT * FROM public.start_assessment('${B}')`);
await admin(
  `UPDATE public.assessments SET closes_at = now() - interval '1 minute' WHERE id='${B}'`,
);
ok(
  "someone who started in time can carry on after the window closes",
  !(await as("S2", `SELECT * FROM public.start_assessment('${B}')`)).error && !r.error,
);
const E = "d0000000-0000-0000-0000-00000000000e";
await as(
  "T",
  `INSERT INTO public.assessments (id, class_id, title, board, time_limit_minutes) VALUES ('${E}','${C}','Empty','ocr',20)`,
);
ok(
  "an assessment with no questions cannot be started",
  /no questions/.test((await fn("S2", `(public.start_assessment('${E}')).attempt_id`)).error ?? ""),
);

// ---- deleting
ok(
  "deleting the assessment removes its attempts, answers and marks",
  !(await as("T", `DELETE FROM public.assessments WHERE id='${A}'`)).error &&
    (await count("assessment_attempts")) === 1 &&
    (await count("assessment_marks")) === 0,
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
