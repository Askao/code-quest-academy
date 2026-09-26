import { PGlite } from "@electric-sql/pglite";
// Checks 20260929120000_class_membership_and_homework_emails.sql against an
// in-memory Postgres (PGlite): who may put a student in a class, who may join
// one with a code, and that the homework email log can only be reached by the
// server. Run after changing that file:
//
//   npm i --no-save @electric-sql/pglite
//   node scripts/test-membership-sql.mjs
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
  CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
  CREATE SCHEMA auth;
  CREATE TABLE auth.users (id uuid PRIMARY KEY);
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.uid', true), '')::uuid $$;
  CREATE TYPE public.app_role AS ENUM ('admin','teacher','student');
  CREATE TYPE public.track AS ENUM ('gcse','alevel');
  CREATE TABLE public.user_roles (user_id uuid, role public.app_role);
  CREATE TABLE public.classes (id uuid PRIMARY KEY, teacher_id uuid, name text, track public.track DEFAULT 'gcse', join_code text NOT NULL UNIQUE);
  CREATE TABLE public.class_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE (class_id, student_id));
  CREATE TABLE public.homework (id uuid PRIMARY KEY, class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE);
  GRANT USAGE ON SCHEMA auth TO authenticated;
  GRANT SELECT ON public.user_roles, public.classes, public.class_members, public.homework, auth.users TO authenticated;
  CREATE FUNCTION public.has_role(_u uuid, _r public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS
    $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_u AND role=_r) $$;
`);
const U = {
  ADMIN: "a0000000-0000-0000-0000-000000000001",
  T: "a0000000-0000-0000-0000-000000000002",
  S1: "b0000000-0000-0000-0000-000000000001", // in class C
  S2: "b0000000-0000-0000-0000-000000000002", // in no class
  S3: "b0000000-0000-0000-0000-000000000003", // in class C and D (odd, but possible)
  S4: "b0000000-0000-0000-0000-000000000004", // in no class
};
const C = "c0000000-0000-0000-0000-00000000000c",
  D = "c0000000-0000-0000-0000-00000000000d";
const H = "d0000000-0000-0000-0000-000000000001";
await db.exec(`
  INSERT INTO auth.users VALUES ${Object.values(U)
    .map((u) => `('${u}')`)
    .join(",")};
  INSERT INTO public.user_roles VALUES ('${U.ADMIN}','admin'),('${U.T}','teacher'),('${U.S1}','student'),('${U.S2}','student'),('${U.S3}','student'),('${U.S4}','student');
  INSERT INTO public.classes VALUES ('${C}','${U.T}','10A','gcse','ABC234'),('${D}','${U.T}','11B','alevel','XYZ789');
  INSERT INTO public.class_members (class_id, student_id) VALUES ('${C}','${U.S1}'),('${C}','${U.S3}'),('${D}','${U.S3}');
  INSERT INTO public.homework VALUES ('${H}','${C}');
`);

let pass = 0,
  fail = 0;
const ok = (name, cond, extra = "") => {
  console.log((cond ? "PASS " : "FAIL ") + name + (cond ? "" : "  " + extra));
  cond ? pass++ : fail++;
};

await db.exec(
  fs.readFileSync(root + "20260929120000_class_membership_and_homework_emails.sql", "utf8"),
);

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
const classesOf = async (who) =>
  (await db.query(`SELECT class_id FROM public.class_members WHERE student_id='${U[who]}'`)).rows
    .map((r) => r.class_id)
    .sort();

// ---- backfill: existing homework counts as already announced
{
  const n = (await db.query(`SELECT count(*)::int n FROM public.homework_emails WHERE kind='set'`))
    .rows[0].n;
  ok("existing homework is marked as already emailed to its class (2 members of C)", n === 2, `got ${n}`);
  const r = (await db.query(`SELECT count(*)::int n FROM public.homework_emails WHERE kind='reminder'`)).rows[0].n;
  ok("no reminders are backfilled", r === 0);
}

// ---- admin_set_student_class
let r = await as("S1", `SELECT public.admin_set_student_class('${U.S2}','${C}')`);
ok("a student cannot put anyone in a class", !!r.error && /Admins only/.test(r.error), r.error);
r = await as("T", `SELECT public.admin_set_student_class('${U.S2}','${C}')`);
ok("a teacher cannot use the admin function", !!r.error && /Admins only/.test(r.error), r.error);
r = await db.query(`SELECT public.admin_set_student_class('${U.S2}','${C}')`).catch((e) => ({ error: e.message }));
ok("with no signed-in user it is refused", !!r.error, "ran as superuser with no uid");

r = await as("ADMIN", `SELECT public.admin_set_student_class('${U.S2}','${C}')`);
ok("admin can add a student with no class", !r.error && (await classesOf("S2")).join() === C, r.error);

r = await as("ADMIN", `SELECT public.admin_set_student_class('${U.S1}','${D}')`);
ok("admin moving a student takes them out of the old class", !r.error && (await classesOf("S1")).join() === D, r.error);

r = await as("ADMIN", `SELECT public.admin_set_student_class('${U.S3}','${D}')`);
ok("setting a class removes every other class too", !r.error && (await classesOf("S3")).join() === D, r.error);

r = await as("ADMIN", `SELECT public.admin_set_student_class('${U.S3}','${D}')`);
ok("setting the class they're already in is harmless", !r.error && (await classesOf("S3")).length === 1);

r = await as("ADMIN", `SELECT public.admin_set_student_class('${U.S2}', NULL)`);
ok("passing no class removes the student from their class", !r.error && (await classesOf("S2")).length === 0, r.error);

r = await as("ADMIN", `SELECT public.admin_set_student_class('${U.T}','${C}')`);
ok("a teacher account cannot be put on a roster", !!r.error && /Only student/.test(r.error), r.error);
r = await as("ADMIN", `SELECT public.admin_set_student_class('${U.ADMIN}','${C}')`);
ok("an admin account cannot be put on a roster", !!r.error && /Only student/.test(r.error), r.error);
r = await as("ADMIN", `SELECT public.admin_set_student_class('${U.S2}','e0000000-0000-0000-0000-00000000000e')`);
ok("an unknown class is refused", !!r.error && /Class not found/.test(r.error), r.error);
ok("...and the student is untouched by the refusal", (await classesOf("S2")).length === 0);
r = await as("ADMIN", `SELECT public.admin_set_student_class('e1000000-0000-0000-0000-00000000000e','${C}')`);
ok("an unknown student is refused", !!r.error, "no error");
r = await db.query(`SELECT has_function_privilege('anon','public.admin_set_student_class(uuid,uuid)','EXECUTE') a`);
ok("anon cannot even call it", r.rows[0].a === false);

// ---- join_class_by_code
r = await as("S2", `SELECT * FROM public.join_class_by_code('abc234')`);
ok("a student with no class can join by code (any case)", !r.error && r.rows[0]?.joined_name === "10A" && (await classesOf("S2")).join() === C, r.error);
r = await as("S2", `SELECT * FROM public.join_class_by_code('XYZ789')`);
ok("...but not a second class", !!r.error && /already in a class/.test(r.error), r.error);
ok("...and they stay in the first", (await classesOf("S2")).join() === C);
r = await as("S4", `SELECT * FROM public.join_class_by_code('  xyz789  ')`);
ok("surrounding spaces are ignored", !r.error && r.rows[0]?.joined_id === D, r.error);
await db.exec(`DELETE FROM public.class_members WHERE student_id='${U.S4}'`);
r = await as("S4", `SELECT * FROM public.join_class_by_code('NOPE99')`);
ok("a wrong code says so and joins nothing", !!r.error && /No class found/.test(r.error) && (await classesOf("S4")).length === 0, r.error);
r = await as("S4", `SELECT * FROM public.join_class_by_code('')`);
ok("an empty code is refused", !!r.error && (await classesOf("S4")).length === 0);
r = await as("T", `SELECT * FROM public.join_class_by_code('ABC234')`);
ok("a teacher cannot join as a student", !!r.error && /Only student/.test(r.error), r.error);
r = await as("ADMIN", `SELECT * FROM public.join_class_by_code('ABC234')`);
ok("an admin cannot either", !!r.error && /Only student/.test(r.error), r.error);
r = await db.query(`SELECT has_function_privilege('anon','public.join_class_by_code(text)','EXECUTE') a`);
ok("anon cannot call join_class_by_code", r.rows[0].a === false);
r = await db.query(`SELECT * FROM public.join_class_by_code('ABC234')`).catch((e) => ({ error: e.message }));
ok("with no signed-in user it is refused", !!r.error && /Not signed in/.test(r.error), r.error);

// ---- homework_emails: server-only, once per (homework, student, kind)
r = await as("T", `SELECT count(*)::int n FROM public.homework_emails`);
ok("a teacher cannot read the email log", !!r.error, JSON.stringify(r.rows));
r = await as("S1", `INSERT INTO public.homework_emails (homework_id, student_id, kind) VALUES ('${H}','${U.S1}','reminder')`);
ok("a student cannot write to it", !!r.error);
await db.exec(`SET ROLE service_role`).catch(() => {});
r = await db
  .query(`INSERT INTO public.homework_emails (homework_id, student_id, kind) VALUES ('${H}','${U.S2}','reminder')`)
  .catch((e) => ({ error: e.message }));
ok("the server can record a reminder", !r.error, r.error);
r = await db
  .query(`INSERT INTO public.homework_emails (homework_id, student_id, kind) VALUES ('${H}','${U.S2}','reminder')`)
  .catch((e) => ({ error: e.message }));
ok("the same reminder can't be recorded twice (this is what stops double emails)", !!r.error && /duplicate key/.test(r.error), r.error);
r = await db
  .query(`INSERT INTO public.homework_emails (homework_id, student_id, kind) VALUES ('${H}','${U.S2}','nagging')`)
  .catch((e) => ({ error: e.message }));
ok("only 'set' and 'reminder' are valid kinds", !!r.error);
await db.exec(`RESET ROLE`);
await db.exec(`DELETE FROM public.homework WHERE id='${H}'`);
ok(
  "deleting a homework clears its email log",
  (await db.query(`SELECT count(*)::int n FROM public.homework_emails`)).rows[0].n === 0,
);

// ---- re-running the whole migration is safe
await db.exec(fs.readFileSync(root + "20260929120000_class_membership_and_homework_emails.sql", "utf8"));
ok("the migration can be run twice", true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
