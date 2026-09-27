import { PGlite } from "@electric-sql/pglite";
// Checks 20260930200000_remove_student_from_class.sql: only that class's
// teacher, a co-teacher, a same-school teacher, or an admin can remove a
// student, and only from the one class asked for. Run after changing that
// file:
//
//   npm i --no-save @electric-sql/pglite
//   node scripts/test-remove-student-sql.mjs
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
  CREATE TABLE public.profiles (id uuid PRIMARY KEY, school_id uuid);
  CREATE TABLE public.classes (id uuid PRIMARY KEY, teacher_id uuid, school_id uuid);
  CREATE TABLE public.class_co_teachers (class_id uuid, teacher_id uuid);
  CREATE TABLE public.class_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE (class_id, student_id));
  GRANT USAGE ON SCHEMA auth TO authenticated;
  GRANT SELECT ON public.user_roles, public.profiles, public.classes, public.class_co_teachers, public.class_members, auth.users TO authenticated;
  CREATE FUNCTION public.has_role(_u uuid, _r public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS
    $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_u AND role=_r) $$;
  CREATE FUNCTION public.is_class_teacher(_class_id uuid, _user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (SELECT 1 FROM public.classes WHERE id = _class_id AND teacher_id = _user_id)
       OR EXISTS (SELECT 1 FROM public.class_co_teachers WHERE class_id = _class_id AND teacher_id = _user_id)
       OR EXISTS (
            SELECT 1 FROM public.classes c JOIN public.profiles p ON p.id = _user_id
            WHERE c.id = _class_id AND c.school_id IS NOT NULL AND c.school_id = p.school_id
          )
  $$;
`);

const U = {
  OWNER: "a0000000-0000-0000-0000-000000000001",
  CO: "a0000000-0000-0000-0000-000000000002",
  SCHOOLMATE: "a0000000-0000-0000-0000-000000000003",
  STRANGER: "a0000000-0000-0000-0000-000000000004",
  ADMIN: "a0000000-0000-0000-0000-000000000005",
  S1: "b0000000-0000-0000-0000-000000000001",
  S2: "b0000000-0000-0000-0000-000000000002",
};
const SCHOOL = "c0000000-0000-0000-0000-00000000000c";
const C = "d0000000-0000-0000-0000-00000000000d";
const OTHER_C = "d0000000-0000-0000-0000-00000000000e";
await db.exec(`
  INSERT INTO auth.users VALUES ${Object.values(U).map((u) => `('${u}')`).join(",")};
  INSERT INTO public.user_roles VALUES
    ('${U.OWNER}','teacher'), ('${U.CO}','teacher'), ('${U.SCHOOLMATE}','teacher'),
    ('${U.STRANGER}','teacher'), ('${U.ADMIN}','admin'), ('${U.S1}','student'), ('${U.S2}','student');
  INSERT INTO public.profiles (id, school_id) VALUES ('${U.SCHOOLMATE}', '${SCHOOL}');
  INSERT INTO public.classes (id, teacher_id, school_id) VALUES ('${C}', '${U.OWNER}', '${SCHOOL}');
  INSERT INTO public.classes (id, teacher_id, school_id) VALUES ('${OTHER_C}', '${U.STRANGER}', NULL);
  INSERT INTO public.class_co_teachers VALUES ('${C}', '${U.CO}');
  INSERT INTO public.class_members (class_id, student_id) VALUES ('${C}', '${U.S1}'), ('${C}', '${U.S2}'), ('${OTHER_C}', '${U.S1}');
`);

let pass = 0,
  fail = 0;
const ok = (name, cond, extra = "") => {
  console.log((cond ? "PASS " : "FAIL ") + name + (cond ? "" : "  " + extra));
  cond ? pass++ : fail++;
};

await db.exec(fs.readFileSync(root + "20260930200000_remove_student_from_class.sql", "utf8"));

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
const memberOf = async (classId, studentId) =>
  (
    await admin(
      `SELECT count(*)::int n FROM public.class_members WHERE class_id='${classId}' AND student_id='${studentId}'`,
    )
  ).rows[0].n === 1;

ok(
  "a stranger teacher cannot remove a student from someone else's class",
  !!(await as("STRANGER", `SELECT public.remove_student_from_class('${U.S1}', '${C}')`)).error,
);
ok("...and nothing changed", await memberOf(C, U.S1));

ok(
  "a student cannot remove anyone",
  !!(await as("S2", `SELECT public.remove_student_from_class('${U.S1}', '${C}')`)).error,
);

const r1 = await as("CO", `SELECT public.remove_student_from_class('${U.S1}', '${C}')`);
ok("a co-teacher can remove a student", !r1.error, JSON.stringify(r1));
ok("...only that student leaves the class", !(await memberOf(C, U.S1)) && (await memberOf(C, U.S2)));
ok(
  "...their membership in a different class is untouched",
  await memberOf(OTHER_C, U.S1),
);

const r2 = await as("SCHOOLMATE", `SELECT public.remove_student_from_class('${U.S2}', '${C}')`);
ok("a same-school teacher (not the owner or an explicit co-teacher) can also remove a student", !r2.error, JSON.stringify(r2));
ok("...and it took effect", !(await memberOf(C, U.S2)));

await admin(
  `INSERT INTO public.class_members (class_id, student_id) VALUES ('${C}', '${U.S1}') ON CONFLICT DO NOTHING`,
);
const r3 = await as("ADMIN", `SELECT public.remove_student_from_class('${U.S1}', '${C}')`);
ok("an admin can remove a student from any class", !r3.error && !(await memberOf(C, U.S1)), JSON.stringify(r3));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
