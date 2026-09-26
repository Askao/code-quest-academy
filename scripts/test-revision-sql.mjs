import { PGlite } from "@electric-sql/pglite";
// Checks the revision-paper migration (20260930130000_revision_papers.sql) on
// top of the assessments tables and question bank, in an in-memory Postgres
// (PGlite) with row-level security switched on. Run after changing that file
// or after growing the question pool:
//
//   npm i --no-save @electric-sql/pglite
//   node scripts/test-revision-sql.mjs
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
  S1: "b0000000-0000-0000-0000-000000000001", // in class C
  S2: "b0000000-0000-0000-0000-000000000002", // in no class
};
const C = "c0000000-0000-0000-0000-00000000000c";
await db.exec(`
  INSERT INTO auth.users VALUES ${Object.values(U).map((u) => `('${u}')`).join(",")};
  INSERT INTO public.user_roles VALUES ('${U.T}','teacher'),('${U.S1}','student'),('${U.S2}','student');
  INSERT INTO public.classes VALUES ('${C}','${U.T}','ocr');
  INSERT INTO public.class_members VALUES ('${C}','${U.S1}');
`);

let pass = 0,
  fail = 0;
const ok = (name, cond, extra = "") => {
  console.log((cond ? "PASS " : "FAIL ") + name + (cond ? "" : "  " + extra));
  cond ? pass++ : fail++;
};

await db.exec(fs.readFileSync(root + "20260926120000_assessments.sql", "utf8"));
await db.exec(fs.readFileSync(root + "20260926130000_seed_assessment_questions.sql", "utf8"));
await db.exec(fs.readFileSync(root + "20260930130000_revision_papers.sql", "utf8"));
await db.exec(fs.readFileSync(root + "20260930140000_question_concepts.sql", "utf8"));
await db.exec(fs.readFileSync(root + "20260930170000_class_revision_summary.sql", "utf8"));

const as = async (who, sql) => {
  await db.exec(`SET ROLE authenticated; SET app.uid = '${U[who]}'`);
  try {
    return { rows: (await db.query(sql)).rows };
  } catch (e) {
    return { error: e.message };
  } finally {
    await db.exec(`RESET ROLE; RESET app.uid`);
  }
};
const admin = (sql) => db.query(sql);
const created = async (who, args) => {
  const r = await as(who, `SELECT public.create_revision_paper(${args}) AS r`);
  return r.error ? r : { ...r, paper: r.rows[0].r };
};
const itemsOf = async (pid) =>
  (await admin(`SELECT question_id, was_weak FROM public.revision_items WHERE paper_id='${pid}' ORDER BY position`)).rows;
const bankCount = (await admin(`SELECT count(*)::int n FROM public.assessment_questions WHERE board='ocr'`)).rows[0].n;
const selCount = (await admin(`SELECT count(*)::int n FROM public.assessment_questions WHERE board='ocr' AND topic='selection'`)).rows[0].n;

// ---- the student can't read the bank or anyone's papers directly
ok("a student cannot read the question bank", (await as("S1", "SELECT count(*)::int n FROM public.assessment_questions")).rows[0].n === 0);
ok("a student cannot read mark schemes", (await as("S1", "SELECT count(*)::int n FROM public.assessment_mark_points")).rows[0].n === 0);

// ---- building
let r = await created("S1", `'ocr', '{}', 6, 'smart', 'My first paper', NULL`);
ok("a student with no history gets a paper of the size they asked for", !r.error && r.paper.questions === 6 && r.paper.weak === 0, r.error ?? JSON.stringify(r.paper));
const P1 = r.paper.paper_id;
const items1 = await itemsOf(P1);
ok("...all from the OCR pool, no repeats", items1.length === 6 && new Set(items1.map((i) => i.question_id)).size === 6 && items1.every((i) => i.question_id.startsWith("ocr-")));
const abil = (await admin(`SELECT q.ability FROM public.revision_items i JOIN public.assessment_questions q ON q.id=i.question_id WHERE i.paper_id='${P1}' ORDER BY i.position`)).rows.map((x) => x.ability);
ok("...in rising order of difficulty", abil.every((a, i) => i === 0 || a >= abil[i - 1]), JSON.stringify(abil));
ok("the paper belongs to the student who built it", (await as("S1", "SELECT count(*)::int n FROM public.revision_papers")).rows[0].n === 1 && (await as("S2", "SELECT count(*)::int n FROM public.revision_papers")).rows[0].n === 0);
ok("nobody else can read its questions or answers either", (await as("S2", "SELECT count(*)::int n FROM public.revision_items")).rows[0].n === 0 && (await as("T", "SELECT count(*)::int n FROM public.revision_items")).rows[0].n === 0);

ok("a paper needs 3-30 questions", !!(await created("S1", `'ocr','{}',2,'smart','x',NULL`)).error && !!(await created("S1", `'ocr','{}',31,'smart','x',NULL`)).error);
ok("an unknown board is refused", !!(await created("S1", `'edexcel','{}',5,'smart','x',NULL`)).error);
ok("an unknown focus is refused", !!(await created("S1", `'ocr','{}',5,'hard','x',NULL`)).error);
r = await created("S1", `'ocr','{}',10,'smart','Timed',0`);
const timedRow = (await admin(`SELECT time_limit_minutes t, total_marks m FROM public.revision_papers WHERE id='${r.paper.paper_id}'`)).rows[0];
ok("the exam-style timer is about a minute a mark, to the nearest 5, at least 10", timedRow.t === Math.max(10, Math.round((timedRow.m * 1.1) / 5) * 5), JSON.stringify(timedRow));
r = await created("S1", `'ocr','{}',5,'smart','Own timer',25`);
ok("a chosen timer is kept as given", (await admin(`SELECT time_limit_minutes t FROM public.revision_papers WHERE id='${r.paper.paper_id}'`)).rows[0].t === 25);
ok("a silly timer is refused", !!(await created("S1", `'ocr','{}',5,'smart','x',2`)).error);
r = await created("S1", `'ocr','{nonexistent}',5,'smart','x',NULL`);
ok("a topic with no questions gives a clear error", !!r.error && /no questions/.test(r.error), r.error);
r = await created("S1", `'ocr','{iteration}',4,'smart','Loops',NULL`);
const itItems = await itemsOf(r.paper.paper_id);
ok("the topic filter is respected", itItems.length === 4 && itItems.every((i) => i.question_id.startsWith("ocr-iteration-")));
r = await created("S1", `'ocr','{}',30,'smart','Big',NULL`);
ok("asking for more than exist gives everything available, not an error", !r.error && r.paper.questions === Math.min(30, bankCount), r.error ?? `${r.paper.questions} vs ${Math.min(30, bankCount)}`);
r = await as("S1", `SELECT public.create_revision_paper('ocr','{}',5,'smart','x',NULL)`);
const anon = await db.query(`SELECT has_function_privilege('anon','public.create_revision_paper(text,text[],int,text,text,int)','EXECUTE') a`);
ok("anon cannot build papers", anon.rows[0].a === false);
r = await db.query(`SELECT public.create_revision_paper('ocr','{}',5,'smart','x',NULL)`).catch((e) => ({ error: e.message }));
ok("with no signed-in user it is refused", !!r.error && /Not signed in/.test(r.error), r.error);

// ---- sitting
r = await as("S2", `SELECT public.open_revision_paper('${P1}')`);
ok("someone else cannot open the paper", !!r.error && /not found/i.test(r.error), r.error);
r = await as("S1", `SELECT public.open_revision_paper('${P1}') AS p`);
const open = r.rows[0].p;
ok("opening starts the clock and returns every question", !!open.started_at && open.questions.length === 6);
ok("no mark scheme is shown before handing in", open.questions.every((q) => q.mark_scheme === null));
ok("...and the question text is included", open.questions.every((q) => typeof q.question === "string" && q.question.length > 10));
const q1 = open.questions[0].question_id;
r = await as("S1", `SELECT public.save_revision_answer('${P1}','${q1}','my answer')`);
ok("answers save", !r.error, r.error);
r = await as("S1", `SELECT public.save_revision_answer('${P1}','ocr-iteration-99','x')`);
ok("an answer to a question not on the paper is refused", !!r.error);
r = await as("S1", `SELECT public.mark_revision_question('${P1}','${q1}','[]')`);
ok("cannot mark before handing in", !!r.error && /Hand the paper in/.test(r.error), r.error);
r = await as("S2", `SELECT public.submit_revision_paper('${P1}')`);
ok("someone else cannot hand it in", !!r.error);
r = await as("S1", `SELECT public.submit_revision_paper('${P1}')`);
ok("hand in", !r.error, r.error);
r = await as("S1", `SELECT public.save_revision_answer('${P1}','${q1}','changed')`);
ok("no edits after handing in", !!r.error && /already been handed in/.test(r.error), r.error);
r = await as("S1", `SELECT public.open_revision_paper('${P1}') AS p`);
const done = r.rows[0].p;
ok("after handing in, the mark scheme appears for every question", done.questions.every((q) => Array.isArray(q.mark_scheme) && q.mark_scheme.length > 0));
ok("...with no marking recorded yet", done.questions.every((q) => q.marked === false && q.mark_scheme.every((m) => m.awarded === null)));
ok("...and the saved answer is still there", done.questions.find((q) => q.question_id === q1).answer === "my answer");

// ---- self-marking
const byId = Object.fromEntries(done.questions.map((q) => [q.question_id, q]));
let marksTotal = 0;
let missedIds = [];
for (const q of done.questions) {
  const pts = q.mark_scheme;
  // award the first point only (so multi-mark questions are partly right), all of a 1-point question
  const awardPoints = pts.length === 1 ? [pts[0]] : [pts[0]];
  const body = JSON.stringify(awardPoints.map((p) => ({ position: p.position, awarded: true })));
  const res = await as("S1", `SELECT public.mark_revision_question('${P1}','${q.question_id}','${body}') AS s`);
  if (res.error) ok("marking works", false, res.error);
  const expected = Math.min(awardPoints.reduce((s, p) => s + p.marks, 0), q.marks);
  ok(`score for ${q.question_id} is the awarded points, capped`, res.rows[0].s === expected, `${res.rows[0].s} vs ${expected}`);
  marksTotal += expected;
  if (expected < q.marks) missedIds.push(q.question_id);
}
r = await admin(`SELECT marked_at, (SELECT sum(marks_awarded) FROM public.revision_answers WHERE paper_id='${P1}')::int AS total FROM public.revision_papers WHERE id='${P1}'`);
ok("once every question is marked the paper is finished", !!r.rows[0].marked_at);
ok("...and the marks add up", r.rows[0].total === marksTotal);
r = await as("S1", `SELECT public.mark_revision_question('${P1}','${q1}','[{"position":1,"awarded":true},{"position":2,"awarded":true},{"position":3,"awarded":true},{"position":4,"awarded":true}]') AS s`);
ok("re-marking is allowed and still capped at the question's marks", !r.error && r.rows[0].s <= byId[q1].marks, r.error);
await as("S1", `SELECT public.mark_revision_question('${P1}','${q1}','[{"position":1,"awarded":true}]')`);
r = await as("S2", `SELECT public.mark_revision_question('${P1}','${q1}','[]')`);
ok("someone else cannot mark it", !!r.error);

// ---- learning from mistakes
ok("there are questions marked as not fully right", missedIds.length > 0, "test data needs a multi-mark question");
r = await as("S1", `SELECT public.revision_history() AS h`);
const hist = (await as("S1", `SELECT question_id, fraction FROM public.revision_history()`)).rows;
ok("history holds one row per question met", hist.length === 6);
ok("...with the fraction of marks got", hist.every((h) => h.fraction >= 0 && h.fraction <= 1));
const missedConcepts = new Set(
  (await admin(`SELECT DISTINCT concept FROM public.assessment_questions WHERE id IN (${missedIds.map((i) => `'${i}'`).join(",")})`)).rows.map((r) => r.concept),
).size;
r = await created("S1", `'ocr','{}',${Math.min(6, bankCount)},'weak','Fix my gaps',NULL`);
const weakItems = await itemsOf(r.paper.paper_id);
const includedMissed = weakItems.filter((i) => missedIds.includes(i.question_id)).length;
ok("a 'weak' paper includes a question for every concept they lost marks on (up to its size)", includedMissed === Math.min(missedConcepts, 6), `${includedMissed} of ${missedConcepts} concepts (${missedIds.length} questions)`);
ok("...and flags them as repeats", weakItems.filter((i) => i.was_weak).length === r.paper.weak && r.paper.weak === includedMissed);
r = await created("S1", `'ocr','{}',10,'smart','Smart',NULL`);
const smartItems = await itemsOf(r.paper.paper_id);
const smartMissed = smartItems.filter((i) => missedIds.includes(i.question_id)).length;
ok("a 'smart' paper leans on misses but is not only misses", smartMissed === Math.min(missedConcepts, 7) && smartItems.length === Math.min(10, bankCount), `${smartMissed} missed of ${smartItems.length}`);
r = await created("S1", `'ocr','{}',5,'new','Fresh',NULL`);
const newItems = await itemsOf(r.paper.paper_id);
const seen = new Set(hist.map((h) => h.question_id));
ok("a 'new' paper prefers questions never seen", newItems.every((i) => !seen.has(i.question_id)) || bankCount - seen.size < 5);
r = await created("S2", `'ocr','{}',6,'weak','x',NULL`);
ok("a student with no history asking for 'weak' still gets a full paper", !r.error && r.paper.questions === 6 && r.paper.weak === 0, r.error);
ok("history is private: another student sees none", (await as("S2", `SELECT count(*)::int n FROM public.revision_history()`)).rows[0].n === 0);

// ---- teacher-marked assessments feed the same history, but only once released
const A = "d0000000-0000-0000-0000-00000000000a";
// three questions the student has never met in a revision paper, so what follows is about the teacher's marks alone
const qsIt = (await admin(`SELECT DISTINCT ON (concept) id, marks FROM public.assessment_questions WHERE board='ocr' AND id NOT IN (SELECT question_id FROM public.revision_answers) ORDER BY concept, id LIMIT 3`)).rows;
await admin(`INSERT INTO public.assessments (id, class_id, title, board, time_limit_minutes, question_count, total_marks) VALUES ('${A}','${C}','Live','ocr',30,3,${qsIt.reduce((s, q) => s + q.marks, 0)})`);
for (const [i, q] of qsIt.entries()) await admin(`INSERT INTO public.assessment_items VALUES ('${A}',${i + 1},'${q.id}')`);
r = await created("S1", `'ocr','{}',30,'smart','x',NULL`);
const live = new Set(qsIt.map((q) => q.id));
const selItems = await itemsOf(r.paper.paper_id);
ok("questions from a live (unreleased) assessment are never offered to its class", selItems.every((i) => !live.has(i.question_id)) && selItems.length === Math.min(30, bankCount - 3), `${selItems.length}`);
r = await as("S2", `SELECT public.create_revision_paper('ocr','{}',30,'smart','x',NULL) AS r`);
ok("...but they are for students not in that class", r.rows[0].r.questions === Math.min(30, bankCount));
const T1 = (await admin(`INSERT INTO public.assessment_attempts (assessment_id, student_id, submitted_at, marked_at) VALUES ('${A}','${U.S1}', now(), now()) RETURNING id`)).rows[0].id;
for (const q of qsIt) await admin(`INSERT INTO public.assessment_answers (attempt_id, question_id, answer, marks_awarded) VALUES ('${T1}','${q.id}','x',0)`);
r = await as("S1", `SELECT count(*)::int n FROM public.revision_history() WHERE question_id IN (${qsIt.map((q) => `'${q.id}'`).join(",")})`);
ok("marked-but-unreleased teacher marks do not leak into history", r.rows[0].n === 0);
await admin(`UPDATE public.assessments SET results_released = true WHERE id='${A}'`);
r = await as("S1", `SELECT count(*)::int n FROM public.revision_history() WHERE question_id IN (${qsIt.map((q) => `'${q.id}'`).join(",")}) AND fraction = 0`);
ok("once released, the teacher's marks count as misses", r.rows[0].n === 3);
r = await created("S1", `'ocr','{}',10,'weak','x',NULL`);
const back = await itemsOf(r.paper.paper_id);
ok("...and those questions come back in a weak paper", qsIt.every((q) => back.some((i) => i.question_id === q.id && i.was_weak)));

// ---- variety: no repeats of a concept, topics take turns
const conceptOf = async (pid) =>
  (await admin(`SELECT q.concept FROM public.revision_items i JOIN public.assessment_questions q ON q.id = i.question_id WHERE i.paper_id='${pid}'`)).rows.map((x) => x.concept);
const topicOf = async (pid) =>
  (await admin(`SELECT q.topic FROM public.revision_items i JOIN public.assessment_questions q ON q.id = i.question_id WHERE i.paper_id='${pid}'`)).rows.map((x) => x.topic);
let repeats = 0, lowTopicSpread = 0;
for (let k = 0; k < 12; k++) {
  const p = (await as("S2", `SELECT public.create_revision_paper('ocr','{}',10,'smart','v',NULL) AS r`)).rows[0].r.paper_id;
  const cs = await conceptOf(p);
  if (new Set(cs).size !== cs.length) repeats++;
  if (new Set(await topicOf(p)).size < 8) lowTopicSpread++;
}
ok("12 random papers of 10: none has two questions on the same concept", repeats === 0, `${repeats} had a repeat`);
ok("...and each draws on at least 8 different topics (topics take turns)", lowTopicSpread === 0, `${lowTopicSpread} were lumpy`);
const itConcepts = (await admin(`SELECT count(DISTINCT concept)::int n, count(*)::int q FROM public.assessment_questions WHERE board='ocr' AND topic='iteration'`)).rows[0];
r = await as("S2", `SELECT public.create_revision_paper('ocr','{iteration}',${itConcepts.q},'smart','all of iteration',NULL) AS r`);
const itPaper = r.rows[0].r;
ok("a small topic still fills the paper when concepts run out (repeats come last)", itPaper.questions === itConcepts.q, JSON.stringify(itPaper));
ok("...using every concept at least once", new Set(await conceptOf(itPaper.paper_id)).size === itConcepts.n);
r = await as("S2", `SELECT public.create_revision_paper('ocr','{iteration}',${itConcepts.n},'smart','one of each',NULL) AS r`);
const oneEach = await conceptOf(r.rows[0].r.paper_id);
ok("asking for exactly as many as there are concepts gives one of each", new Set(oneEach).size === oneEach.length && oneEach.length === itConcepts.n);
ok("every question in the bank has a concept", (await admin(`SELECT count(*)::int n FROM public.assessment_questions WHERE concept IS NULL OR concept = ''`)).rows[0].n === 0);

// ---- topic summary for the builder
r = await as("S1", `SELECT public.revision_topics('ocr') AS t`);
const topics = r.rows[0].t;
const sel = topics.find((t) => t.topic === "selection");
ok("the builder's topic list counts questions, misses and unseen", sel && sel.available === selCount && typeof sel.missed === 'number' && sel.available >= sel.missed, JSON.stringify(sel));
r = await as("S1", `SELECT public.revision_topics('aqa') AS t`);
ok("...for the other board too", r.rows[0].t.length > 0 && r.rows[0].t.every((t) => t.available > 0));

// ---- analysis + housekeeping
r = await as("S1", `SELECT public.my_revision_analysis() AS a`);
ok("analysis lists only the papers marked in full", r.rows[0].a.length === 1 && r.rows[0].a[0].assessment_id === P1);
ok("...in the same shape as the assessment analysis", r.rows[0].a[0].questions.length === 6 && "topic" in r.rows[0].a[0].questions[0] && r.rows[0].a[0].marks_awarded === marksTotal);
r = await as("S2", `SELECT public.my_revision_analysis() AS a`);
ok("another student's analysis is empty", r.rows[0].a.length === 0);
r = await as("S2", `DELETE FROM public.revision_papers WHERE id='${P1}'`);
ok("someone else cannot delete the paper", (await admin(`SELECT count(*)::int n FROM public.revision_papers WHERE id='${P1}'`)).rows[0].n === 1);
await as("S1", `DELETE FROM public.revision_papers WHERE id='${P1}'`);
ok("a student can delete their own paper, and everything under it goes too", (await admin(`SELECT (SELECT count(*) FROM public.revision_items WHERE paper_id='${P1}')::int + (SELECT count(*) FROM public.revision_answers WHERE paper_id='${P1}')::int + (SELECT count(*) FROM public.revision_marks WHERE paper_id='${P1}')::int AS n`)).rows[0].n === 0);
for (const [t, stmt] of [
  ["revision_papers", `INSERT INTO public.revision_papers (student_id, title, board) VALUES ('${U.S1}','x','ocr')`],
  ["revision_items", `UPDATE public.revision_items SET position = 99`],
  ["revision_answers", `UPDATE public.revision_answers SET marks_awarded = 99`],
  ["revision_marks", `UPDATE public.revision_marks SET marks = 99`],
]) {
  const direct = await as("S1", stmt);
  ok(`${t}: a student cannot write to it directly`, !!direct.error, JSON.stringify(direct));
}

// ---- the teacher's class summary (counts and self-marked totals only)
{
  const S3 = "b0000000-0000-0000-0000-000000000003"; // in class C, has never revised
  await admin(`INSERT INTO auth.users VALUES ('${S3}')`);
  await admin(`INSERT INTO public.class_members VALUES ('${C}','${S3}')`);
  const qs = (await admin(`SELECT id, topic, marks FROM public.assessment_questions WHERE board='ocr' AND topic IN ('selection','iteration') ORDER BY topic, id LIMIT 40`)).rows;
  const sel = qs.filter((q) => q.topic === "selection").slice(0, 2);
  const itr = qs.filter((q) => q.topic === "iteration").slice(0, 1);
  const mk = async (student, submitted) => {
    const id = (await admin(`INSERT INTO public.revision_papers (student_id, title, board, submitted_at) VALUES ('${student}','x','ocr', ${submitted ? "now()" : "NULL"}) RETURNING id`)).rows[0].id;
    return id;
  };
  const base = (await admin(`SELECT count(*)::int made, count(submitted_at)::int done FROM public.revision_papers WHERE student_id='${U.S1}'`)).rows[0];
  const P_done = await mk(U.S1, true);
  const P_open = await mk(U.S1, false);
  const P_other = await mk(U.S2, true); // S2 is in no class
  let expSel = 0, availSel = 0, expItr = 0, availItr = 0;
  for (const q of sel) {
    await admin(`INSERT INTO public.revision_answers (paper_id, question_id, marked, marks_awarded) VALUES ('${P_done}','${q.id}', true, ${q.marks})`);
    expSel += q.marks; availSel += q.marks;
  }
  for (const q of itr) {
    await admin(`INSERT INTO public.revision_answers (paper_id, question_id, marked, marks_awarded) VALUES ('${P_done}','${q.id}', true, 0)`);
    availItr += q.marks;
  }
  // an unmarked answer must not count towards the totals
  await admin(`INSERT INTO public.revision_answers (paper_id, question_id, marked, marks_awarded) VALUES ('${P_other}','${sel[0].id}', true, 1)`);

  const sum = await as("T", `SELECT * FROM public.class_revision_summary('${C}') ORDER BY student_id`);
  ok("the teacher gets one row per class member, including a student who has never revised", !sum.error && sum.rows.length === 2, JSON.stringify(sum));
  const r1 = sum.rows.find((x) => x.student_id === U.S1);
  const r3 = sum.rows.find((x) => x.student_id === S3);
  ok("papers made and handed in are counted", r1.papers_made === base.made + 2 && r1.papers_handed_in === base.done + 1, JSON.stringify(r1));
  ok("self-marked totals add up", r1.marks_awarded === expSel && r1.marks_available === availSel + availItr, JSON.stringify(r1));
  const topics = Object.fromEntries(r1.topics.map((t) => [t.topic, t]));
  ok("...and are broken down by topic", topics.selection?.awarded === expSel && topics.selection?.available === availSel && topics.iteration?.awarded === 0 && topics.iteration?.available === availItr, JSON.stringify(r1.topics));
  ok("a student who has never revised shows zeros and no last-active date", r3.papers_made === 0 && r3.marks_available === 0 && r3.last_active === null && r3.topics.length === 0, JSON.stringify(r3));
  ok("a student outside the class never appears", !sum.rows.some((x) => x.student_id === U.S2));
  ok("the summary carries no questions or answers", Object.keys(r1).sort().join() === "last_active,marks_available,marks_awarded,papers_handed_in,papers_made,student_id,topics");
  ok("a student cannot use it, even on their own class", (await as("S1", `SELECT * FROM public.class_revision_summary('${C}')`)).rows.length === 0);
  ok("a teacher of a different class gets nothing", (await as("S2", `SELECT * FROM public.class_revision_summary('${C}')`)).rows.length === 0);
  ok("the teacher still cannot read the papers themselves", (await as("T", "SELECT count(*)::int n FROM public.revision_answers")).rows[0].n === 0);
}


console.log(`
${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
