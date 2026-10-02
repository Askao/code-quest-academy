import { PGlite } from "@electric-sql/pglite";
// Checks 20261002130000_class_attempt_summary.sql: every student in the class
// gets their own complete numbers however busy the rest of the class is,
// attempts after a challenge is completed don't count towards accuracy, and
// only that class's teacher (or an admin) can ask. Run after changing that file:
//
//   npm i --no-save @electric-sql/pglite
//   node scripts/test-class-attempt-summary-sql.mjs
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
  CREATE TABLE public.user_roles (user_id uuid, role public.app_role);
  CREATE TABLE public.classes (id uuid PRIMARY KEY, teacher_id uuid);
  CREATE TABLE public.class_members (class_id uuid, student_id uuid);
  CREATE TABLE public.attempts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, challenge_id uuid, passed boolean NOT NULL, created_at timestamptz NOT NULL);
  GRANT USAGE ON SCHEMA auth TO authenticated;
  GRANT SELECT ON public.user_roles, public.classes, public.class_members, public.attempts, auth.users TO authenticated;
  CREATE FUNCTION public.has_role(_u uuid, _r public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS
    $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_u AND role=_r) $$;
  CREATE FUNCTION public.is_class_teacher(_c uuid, _u uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS
    $$ SELECT EXISTS (SELECT 1 FROM public.classes WHERE id=_c AND teacher_id=_u) $$;
`);
await db.exec(fs.readFileSync(root + "20261002130000_class_attempt_summary.sql", "utf8"));

const U = {
  T: "a0000000-0000-0000-0000-000000000001", // teacher of class C
  T2: "a0000000-0000-0000-0000-000000000002", // some other teacher
  ADMIN: "a0000000-0000-0000-0000-000000000003",
  FARM: "b0000000-0000-0000-0000-00000000000f", // replays one task 2000 times
  QUIET: "b0000000-0000-0000-0000-000000000001", // a handful of real attempts
  NONE: "b0000000-0000-0000-0000-000000000002", // never attempted anything
  OTHER: "b0000000-0000-0000-0000-000000000009", // in a different class
};
const C = "c0000000-0000-0000-0000-00000000000c";
const D = "c0000000-0000-0000-0000-00000000000d";
const X1 = "d0000000-0000-0000-0000-000000000001";
const X2 = "d0000000-0000-0000-0000-000000000002";
await db.exec(`
  INSERT INTO auth.users SELECT unnest(ARRAY['${Object.values(U).join("','")}']::uuid[]);
  INSERT INTO public.user_roles VALUES ('${U.T}','teacher'),('${U.T2}','teacher'),('${U.ADMIN}','admin');
  INSERT INTO public.classes VALUES ('${C}','${U.T}'),('${D}','${U.T2}');
  INSERT INTO public.class_members VALUES ('${C}','${U.FARM}'),('${C}','${U.QUIET}'),('${C}','${U.NONE}'),('${D}','${U.OTHER}');
  -- the farmer: one pass, then 2000 replays (all later and all newer than anyone else's work)
  INSERT INTO public.attempts (user_id, challenge_id, passed, created_at) VALUES ('${U.FARM}','${X1}', true, '2026-09-30T09:00:00Z');
  INSERT INTO public.attempts (user_id, challenge_id, passed, created_at)
    SELECT '${U.FARM}','${X1}', true, '2026-10-01T00:00:00Z'::timestamptz + g * interval '1 second' FROM generate_series(1, 2000) g;
  -- the quiet student: fail, fail, pass on X1; fail on X2; and a replay of X1 after finishing
  INSERT INTO public.attempts (user_id, challenge_id, passed, created_at) VALUES
    ('${U.QUIET}','${X1}', false, '2026-09-20T09:00:00Z'),
    ('${U.QUIET}','${X1}', false, '2026-09-20T09:05:00Z'),
    ('${U.QUIET}','${X1}', true,  '2026-09-20T09:10:00Z'),
    ('${U.QUIET}','${X2}', false, '2026-09-21T09:00:00Z'),
    ('${U.QUIET}','${X1}', true,  '2026-09-22T09:00:00Z');
  INSERT INTO public.attempts (user_id, challenge_id, passed, created_at) VALUES ('${U.OTHER}','${X1}', true, '2026-09-25T09:00:00Z');
`);

let pass = 0,
  fail = 0;
const ok = (name, cond, extra = "") => {
  console.log((cond ? "PASS " : "FAIL ") + name + (cond ? "" : "  " + extra));
  cond ? pass++ : fail++;
};
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

const r = await as("T", `SELECT * FROM public.class_attempt_summary('${C}')`);
ok("the class's teacher can read it", !r.error, JSON.stringify(r));
const by = Object.fromEntries((r.rows ?? []).map((x) => [x.user_id, x]));
ok("it only covers students in that class", !(U.OTHER in by) && Object.keys(by).length === 2, JSON.stringify(Object.keys(by)));
ok(
  "a quiet student still gets their real numbers while a farmer fills the class with thousands of newer attempts",
  by[U.QUIET]?.attempts === 4 && by[U.QUIET]?.passed === 1,
  JSON.stringify(by[U.QUIET]),
);
ok(
  "...replays after completing a task are not counted (3 on X1 up to the first pass, plus 1 on X2)",
  by[U.QUIET]?.attempts === 4,
);
ok(
  "the farmer's 2000 replays don't count: one attempt, one pass, 100%",
  by[U.FARM]?.attempts === 1 && by[U.FARM]?.passed === 1,
  JSON.stringify(by[U.FARM]),
);
ok(
  "last active is still the newest attempt of any kind, replays included",
  new Date(by[U.QUIET].last_attempt).toISOString() === "2026-09-22T09:00:00.000Z",
  by[U.QUIET]?.last_attempt,
);
ok("a student with no attempts has no row (the page treats that as 0 attempts)", !(U.NONE in by));

ok("another class's teacher is refused", !!(await as("T2", `SELECT * FROM public.class_attempt_summary('${C}')`)).error);
ok("a student is refused", !!(await as("QUIET", `SELECT * FROM public.class_attempt_summary('${C}')`)).error);
ok("an admin can read any class", !(await as("ADMIN", `SELECT * FROM public.class_attempt_summary('${C}')`)).error);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
