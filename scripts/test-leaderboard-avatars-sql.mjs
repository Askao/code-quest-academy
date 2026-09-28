import { PGlite } from "@electric-sql/pglite";
// Checks 20260930212000_leaderboard_avatars.sql: the DROP + CREATE actually
// lands (RETURNS TABLE can't change column list under CREATE OR REPLACE),
// avatar comes back correctly, and the pre-existing staff-exclusion /
// class-vs-school scoping this migration copies verbatim still behaves the
// same as it did before avatar was added. Run after changing that file:
//
//   npm i --no-save @electric-sql/pglite
//   node scripts/test-leaderboard-avatars-sql.mjs
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
  CREATE TABLE public.profiles (id uuid PRIMARY KEY, full_name text, selected_avatar text, school_id uuid);
  CREATE TABLE public.classes (id uuid PRIMARY KEY, teacher_id uuid, name text, track public.track DEFAULT 'gcse', school_id uuid, improved_window_days int NOT NULL DEFAULT 7);
  CREATE TABLE public.class_members (class_id uuid, student_id uuid, UNIQUE (class_id, student_id));
  CREATE TABLE public.skills (user_id uuid, track public.track);
  CREATE TABLE public.stats (user_id uuid PRIMARY KEY, xp int NOT NULL DEFAULT 0, streak_days int NOT NULL DEFAULT 0);
  CREATE TABLE public.attempts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, xp_awarded int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
  GRANT USAGE ON SCHEMA auth TO authenticated;
  GRANT SELECT ON public.user_roles, public.profiles, public.classes, public.class_members, public.skills, public.stats, public.attempts, auth.users TO authenticated;
  CREATE FUNCTION public.has_role(_u uuid, _r public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS
    $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_u AND role=_r) $$;
  CREATE FUNCTION public.is_class_member(_class_id uuid, _u uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS
    $$ SELECT EXISTS (SELECT 1 FROM public.class_members WHERE class_id=_class_id AND student_id=_u) $$;
  CREATE FUNCTION public.is_class_teacher(_class_id uuid, _u uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS
    $$ SELECT EXISTS (SELECT 1 FROM public.classes WHERE id=_class_id AND teacher_id=_u) $$;
`);

const U = {
  T: "a0000000-0000-0000-0000-000000000002", // teacher of class C, staff so never ranks
  S1: "b0000000-0000-0000-0000-000000000001", // in class C, has an avatar, in the school
  S2: "b0000000-0000-0000-0000-000000000002", // in class C, no avatar equipped
  S3: "b0000000-0000-0000-0000-000000000003", // outside the class, outside the school
};
const C = "c0000000-0000-0000-0000-00000000000c";
const SCHOOL = "e0000000-0000-0000-0000-000000000001";
await db.exec(`
  INSERT INTO auth.users VALUES ('${U.T}'), ('${U.S1}'), ('${U.S2}'), ('${U.S3}');
  INSERT INTO public.user_roles VALUES ('${U.T}','teacher');
  INSERT INTO public.profiles (id, full_name, selected_avatar, school_id) VALUES
    ('${U.S1}', 'Ada', 'fox', '${SCHOOL}'),
    ('${U.S2}', 'Bea', NULL, '${SCHOOL}'),
    ('${U.S3}', 'Cai', NULL, NULL);
  INSERT INTO public.classes VALUES ('${C}', '${U.T}', '10A', 'gcse', '${SCHOOL}', 7);
  INSERT INTO public.class_members VALUES ('${C}', '${U.S1}'), ('${C}', '${U.S2}');
  INSERT INTO public.skills (user_id, track) VALUES ('${U.S1}', 'gcse'), ('${U.S2}', 'gcse');
  INSERT INTO public.stats (user_id, xp, streak_days) VALUES ('${U.S1}', 500, 3), ('${U.S2}', 200, 1);
  INSERT INTO public.attempts (user_id, xp_awarded) VALUES ('${U.S1}', 50), ('${U.S2}', 20);
`);

await db.exec(fs.readFileSync(root + "20260930212000_leaderboard_avatars.sql", "utf8"));

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

let r = await as("S1", `SELECT * FROM public.leaderboard_top_xp('${C}', NULL, 10)`);
ok("leaderboard_top_xp still runs after the DROP + CREATE", !r.error, JSON.stringify(r));
ok("it returns both classmates", r.rows?.length === 2, JSON.stringify(r.rows));
const ada = r.rows?.find((row) => row.name === "Ada");
ok("Ada's equipped avatar comes back", ada?.avatar === "fox", JSON.stringify(ada));
const bea = r.rows?.find((row) => row.name === "Bea");
ok("Bea's unequipped avatar comes back as null, not an error", bea?.avatar === null, JSON.stringify(bea));
ok("ranked by XP descending, same as before", r.rows?.[0]?.name === "Ada");

r = await as("S1", `SELECT * FROM public.leaderboard_most_improved('${C}', NULL, 10)`);
ok("leaderboard_most_improved still runs after the DROP + CREATE", !r.error, JSON.stringify(r));
ok(
  "its avatar column also comes back correctly",
  r.rows?.find((row) => row.name === "Ada")?.avatar === "fox",
  JSON.stringify(r.rows),
);

r = await as("S3", `SELECT * FROM public.leaderboard_top_xp('${C}', NULL, 10)`);
ok("a student outside the class still can't read its board", (r.rows ?? []).length === 0, JSON.stringify(r));

r = await as("S1", `SELECT * FROM public.leaderboard_top_xp(NULL, 'gcse', 10)`);
ok(
  "the school-wide board still excludes the teacher (staff never rank)",
  !(r.rows ?? []).some((row) => row.id === U.T),
  JSON.stringify(r),
);
ok(
  "...and still excludes a student in a different school",
  !(r.rows ?? []).some((row) => row.name === "Cai"),
  JSON.stringify(r),
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
