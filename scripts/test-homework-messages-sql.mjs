import { PGlite } from "@electric-sql/pglite";
// Checks 20261003100000_homework_messages.sql: only a class's teacher can send
// a message about its homework (and only as themselves), students on that
// class can read it but nobody else can, the length and daily limits hold, and
// the delivery log is server-only. Run after changing that file:
//
//   npm i --no-save @electric-sql/pglite
//   node scripts/test-homework-messages-sql.mjs
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
  CREATE TABLE public.homework (id uuid PRIMARY KEY, class_id uuid NOT NULL REFERENCES public.classes(id));
  GRANT USAGE ON SCHEMA auth TO authenticated;
  GRANT SELECT ON public.user_roles, public.classes, public.class_members, public.homework, auth.users TO authenticated;
  CREATE FUNCTION public.has_role(_u uuid, _r public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS
    $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_u AND role=_r) $$;
  CREATE FUNCTION public.is_class_teacher(_c uuid, _u uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS
    $$ SELECT EXISTS (SELECT 1 FROM public.classes WHERE id=_c AND teacher_id=_u) $$;
`);
await db.exec(fs.readFileSync(root + "20261003100000_homework_messages.sql", "utf8"));

const U = {
  T: "a0000000-0000-0000-0000-000000000001", // teaches class C
  T2: "a0000000-0000-0000-0000-000000000002", // teaches class D
  ADMIN: "a0000000-0000-0000-0000-000000000003",
  S1: "b0000000-0000-0000-0000-000000000001", // in class C
  S2: "b0000000-0000-0000-0000-000000000002", // in class D
};
const C = "c0000000-0000-0000-0000-00000000000c";
const D = "c0000000-0000-0000-0000-00000000000d";
const HW_C = "d0000000-0000-0000-0000-00000000000c";
const HW_D = "d0000000-0000-0000-0000-00000000000d";
await db.exec(`
  INSERT INTO auth.users SELECT unnest(ARRAY['${Object.values(U).join("','")}']::uuid[]);
  INSERT INTO public.user_roles VALUES ('${U.T}','teacher'),('${U.T2}','teacher'),('${U.ADMIN}','admin'),('${U.S1}','student'),('${U.S2}','student');
  INSERT INTO public.classes VALUES ('${C}','${U.T}'),('${D}','${U.T2}');
  INSERT INTO public.class_members VALUES ('${C}','${U.S1}'),('${D}','${U.S2}');
  INSERT INTO public.homework VALUES ('${HW_C}','${C}'),('${HW_D}','${D}');
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
const send = (who, hw, body, sender = who, audience = "unfinished") =>
  as(who, `INSERT INTO public.homework_messages (homework_id, sender_id, body, audience) VALUES ('${hw}','${U[sender]}','${body}','${audience}') RETURNING id`);

ok("a class's teacher can send a message about its homework", !(await send("T", HW_C, "Please finish task 2")).error);
ok("an admin can too", !(await send("ADMIN", HW_C, "Hello from the admin")).error);
ok("another class's teacher cannot", !!(await send("T2", HW_C, "Not my class")).error);
ok("a student cannot send one", !!(await send("S1", HW_C, "Hi")).error);
ok("a teacher cannot send as someone else", !!(await send("T", HW_C, "Spoof", "T2")).error);
ok("an empty message is refused", !!(await send("T", HW_C, "   ")).error);
ok("a message over 1000 characters is refused", !!(await send("T", HW_C, "x".repeat(1001))).error);
ok("a message of exactly 1000 characters is fine", !(await send("T", HW_C, "y".repeat(1000))).error);
ok("an unknown audience is refused", !!(await send("T", HW_C, "x", "T", "everyone-ever")).error);

const mine = await as("S1", `SELECT count(*)::int n FROM public.homework_messages WHERE homework_id = '${HW_C}'`);
ok("a student on the class can read its messages", mine.rows?.[0]?.n >= 3, JSON.stringify(mine));
const theirs = await as("S2", `SELECT count(*)::int n FROM public.homework_messages WHERE homework_id = '${HW_C}'`);
ok("a student in another class cannot", theirs.rows?.[0]?.n === 0, JSON.stringify(theirs));
const other = await as("T2", `SELECT count(*)::int n FROM public.homework_messages WHERE homework_id = '${HW_C}'`);
ok("another class's teacher cannot read them either", other.rows?.[0]?.n === 0, JSON.stringify(other));

ok("a student cannot edit a message", (await as("S1", `UPDATE public.homework_messages SET body = 'edited' RETURNING id`)).error !== undefined);
const del = await as("T", `DELETE FROM public.homework_messages RETURNING id`);
ok("nobody can delete one through the API", !!del.error, JSON.stringify(del));

// daily limit: HW_C already has 3 messages from above (T, ADMIN, the 1000-char one)
await send("T", HW_C, "four");
await send("T", HW_C, "five");
ok("a sixth message on one homework in a day is refused", !!(await send("T", HW_C, "six")).error);
ok("...but the limit is per homework", !(await send("T2", HW_D, "other homework")).error);

ok("the delivery log cannot be read by teachers", !!(await as("T", `SELECT * FROM public.homework_message_emails`)).error);
ok("...or written to by them", !!(await as("T", `INSERT INTO public.homework_message_emails (message_id, student_id) VALUES (gen_random_uuid(), '${U.S1}')`)).error);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
