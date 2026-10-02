import { PGlite } from "@electric-sql/pglite";
// Checks 20261002121000_reset_farmed_xp.sql: farmers drop to the XP of their
// first pass of each challenge, honest students are untouched, nobody is
// raised, equipped cosmetics they no longer qualify for are cleared, the
// changes are backed up, the undo statements restore them, and re-running it
// does nothing more. Run after changing that file:
//
//   npm i --no-save @electric-sql/pglite
//   node scripts/test-reset-farmed-xp-sql.mjs
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
  CREATE TABLE public.profiles (id uuid PRIMARY KEY, email text, full_name text, school_id uuid);
  CREATE TABLE public.stats (user_id uuid PRIMARY KEY, xp int NOT NULL DEFAULT 0, best_streak int NOT NULL DEFAULT 0, updated_at timestamptz DEFAULT now());
  CREATE TABLE public.duels (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), winner_id uuid);
  CREATE TABLE public.challenges (id uuid PRIMARY KEY, track text, topic text);
  CREATE TABLE public.attempts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, challenge_id uuid, passed boolean NOT NULL DEFAULT false, xp_awarded int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
  CREATE TABLE public.skills (user_id uuid, track text, topic text, passes int NOT NULL DEFAULT 0);
  GRANT USAGE ON SCHEMA auth TO authenticated;
  GRANT SELECT, UPDATE ON public.profiles TO authenticated;
  GRANT SELECT ON public.stats, public.duels, public.attempts, auth.users TO authenticated;
`);
for (const f of [
  "20260930210000_locker_cosmetics.sql",
  "20261002120000_century_counts_distinct_challenges.sql",
]) await db.exec(fs.readFileSync(root + f, "utf8"));

const F = "a0000000-0000-0000-0000-00000000000f"; // farmer
const H = "a0000000-0000-0000-0000-000000000001"; // honest
const L = "a0000000-0000-0000-0000-00000000000a"; // below their attempt total
const C1 = "c0000000-0000-0000-0000-000000000001";
const C2 = "c0000000-0000-0000-0000-000000000002";
const at = (u, c, passed, xp, minute) =>
  `('${u}','${c}',${passed},${xp},'2026-09-01T10:${String(minute).padStart(2, "0")}:00Z')`;
await db.exec(`
  INSERT INTO auth.users VALUES ('${F}'),('${H}'),('${L}');
  INSERT INTO public.profiles (id) VALUES ('${F}'),('${H}'),('${L}');
  INSERT INTO public.challenges VALUES ('${C1}','gcse','sequencing'),('${C2}','gcse','sequencing');
  INSERT INTO public.attempts (user_id, challenge_id, passed, xp_awarded, created_at) VALUES
    ${at(F, C1, true, 30, 1)}, ${at(F, C1, true, 30, 2)}, ${at(F, C1, true, 30, 3)}, ${at(F, C1, true, 30, 4)},
    ${at(F, C2, false, 0, 5)}, ${at(F, C2, true, 20, 6)}, ${at(F, C2, true, 20, 7)},
    ${at(H, C1, true, 30, 1)},
    ${at(L, C1, true, 30, 1)};
  INSERT INTO public.stats (user_id, xp) VALUES ('${F}', 160), ('${H}', 30), ('${L}', 10);
  INSERT INTO public.skills VALUES ('${F}','gcse','sequencing',6), ('${H}','gcse','sequencing',1);
  UPDATE public.profiles SET selected_avatar = 'crown', selected_banner = 'horizon' WHERE id = '${F}';
  UPDATE public.profiles SET selected_avatar = 'sprout' WHERE id = '${H}';
`);

let pass = 0,
  fail = 0;
const ok = (name, cond, extra = "") => {
  console.log((cond ? "PASS " : "FAIL ") + name + (cond ? "" : "  " + extra));
  cond ? pass++ : fail++;
};
const one = async (sql) => (await db.query(sql)).rows[0];
const xp = async (u) => (await one(`SELECT xp FROM public.stats WHERE user_id='${u}'`)).xp;

const sql = fs.readFileSync(root + "20261002121000_reset_farmed_xp.sql", "utf8");
await db.exec(sql);

ok("the farmer drops to their first passes only (30 + 20)", (await xp(F)) === 50, String(await xp(F)));
ok("an honest student is untouched", (await xp(H)) === 30);
ok("a student already below their attempt total is never raised", (await xp(L)) === 10);
ok(
  "repeat passes have their attempt XP zeroed",
  (await one(`SELECT count(*)::int AS n FROM public.attempts WHERE user_id='${F}' AND xp_awarded > 0`)).n === 2,
);
ok(
  "the first pass of each challenge keeps its XP",
  (await one(`SELECT sum(xp_awarded)::int AS n FROM public.attempts WHERE user_id='${F}'`)).n === 50,
);
ok(
  "skills.passes is recounted as distinct challenges (6 -> 2)",
  (await one(`SELECT passes FROM public.skills WHERE user_id='${F}'`)).passes === 2,
);
ok(
  "an honest student's pass count is unchanged",
  (await one(`SELECT passes FROM public.skills WHERE user_id='${H}'`)).passes === 1,
);
const pf = await one(`SELECT selected_avatar, selected_banner FROM public.profiles WHERE id='${F}'`);
ok("an avatar the farmer no longer qualifies for is cleared", pf.selected_avatar === null);
ok("a banner they still qualify for is kept", pf.selected_banner === "horizon");
ok(
  "an honest student keeps their avatar",
  (await one(`SELECT selected_avatar FROM public.profiles WHERE id='${H}'`)).selected_avatar === "sprout",
);

ok("old XP is backed up", (await one(`SELECT xp_before FROM public.xp_reset_backup WHERE user_id='${F}'`)).xp_before === 160);
ok(
  "every zeroed attempt is backed up (3 repeats of C1 + 1 of C2)",
  (await one(`SELECT count(*)::int AS n FROM public.xp_reset_attempts_backup`)).n === 4,
);

await db.exec(sql);
ok("running it again changes nothing", (await xp(F)) === 50 && (await xp(H)) === 30);
ok(
  "...and does not overwrite the backup with already-reset values",
  (await one(`SELECT xp_before FROM public.xp_reset_backup WHERE user_id='${F}'`)).xp_before === 160,
);

await db.exec(`
  update public.attempts a set xp_awarded = b.xp_before from public.xp_reset_attempts_backup b where a.id = b.attempt_id;
  update public.stats s set xp = b.xp_before from public.xp_reset_backup b where b.user_id = s.user_id;
  update public.profiles p set selected_avatar = b.avatar_before, selected_banner = b.banner_before
    from public.xp_reset_backup b where b.user_id = p.id;
`);
ok("the documented undo restores XP", (await xp(F)) === 160);
ok(
  "...and the equipped avatar",
  (await one(`SELECT selected_avatar FROM public.profiles WHERE id='${F}'`)).selected_avatar === "crown",
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
