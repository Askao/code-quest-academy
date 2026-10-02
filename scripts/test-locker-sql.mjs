import { PGlite } from "@electric-sql/pglite";
// Checks 20260930210000_locker_cosmetics.sql: level_from_xp matches
// levelFromXp's curve, cosmetic_unlocked gates each cosmetic correctly, and
// set_cosmetic only ever lets a student equip their own unlocked cosmetics
// (direct writes to the two columns are blocked at the grant level). Run
// after changing that file:
//
//   npm i --no-save @electric-sql/pglite
//   node scripts/test-locker-sql.mjs
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
  CREATE TABLE public.stats (user_id uuid PRIMARY KEY, xp int NOT NULL DEFAULT 0, best_streak int NOT NULL DEFAULT 0);
  CREATE TABLE public.duels (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), winner_id uuid);
  CREATE TABLE public.attempts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, challenge_id uuid, passed boolean NOT NULL DEFAULT false);
  GRANT USAGE ON SCHEMA auth TO authenticated;
  GRANT SELECT, UPDATE ON public.profiles TO authenticated;
  GRANT SELECT ON public.stats, public.duels, public.attempts, auth.users TO authenticated;
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
`);

await db.exec(fs.readFileSync(root + "20260930210000_locker_cosmetics.sql", "utf8"));
await db.exec(fs.readFileSync(root + "20261002120000_century_counts_distinct_challenges.sql", "utf8"));

const U = {
  S1: "a0000000-0000-0000-0000-000000000001", // level 10, no wins
  S2: "a0000000-0000-0000-0000-000000000002", // level 1, no wins yet
  S3: "a0000000-0000-0000-0000-000000000003", // 5 duel wins, 100 passes, 14-day streak
};
await db.exec(`
  INSERT INTO auth.users VALUES ('${U.S1}'), ('${U.S2}'), ('${U.S3}');
  INSERT INTO public.profiles (id) VALUES ('${U.S1}'), ('${U.S2}'), ('${U.S3}');
  INSERT INTO public.stats (user_id, xp, best_streak) VALUES
    ('${U.S1}', 4820, 5),
    ('${U.S2}', 0, 0),
    ('${U.S3}', 60000, 14);
  INSERT INTO public.duels (winner_id) VALUES ${Array(5).fill(`('${U.S3}')`).join(",")};
  INSERT INTO public.attempts (user_id, challenge_id, passed)
    SELECT '${U.S3}', gen_random_uuid(), true FROM generate_series(1, 100);
  INSERT INTO public.attempts (user_id, challenge_id, passed) VALUES ('${U.S3}', gen_random_uuid(), false);
  INSERT INTO public.attempts (user_id, challenge_id, passed)
    SELECT '${U.S1}', ('c0000000-0000-0000-0000-00000000000' || (g % 3 + 1))::uuid, true FROM generate_series(1, 150) g;
`);

let pass = 0,
  fail = 0;
const ok = (name, cond, extra = "") => {
  console.log((cond ? "PASS " : "FAIL ") + name + (cond ? "" : "  " + extra));
  cond ? pass++ : fail++;
};

// ---- level_from_xp matches levelFromXp's curve
const lvl = async (xp) => (await db.query(`SELECT public.level_from_xp(${xp}) AS l`)).rows[0].l;
ok("0 xp is level 1", (await lvl(0)) === 1);
ok("99 xp is still level 1", (await lvl(99)) === 1);
ok("100 xp is level 2 (the boundary)", (await lvl(100)) === 2);
ok("299 xp is still level 2", (await lvl(299)) === 2);
ok("300 xp is level 3", (await lvl(300)) === 3);
ok("600 xp is level 4", (await lvl(600)) === 4);

// ---- cosmetic_unlocked
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
const unlocked = async (who, key) =>
  (await as(who, `SELECT public.cosmetic_unlocked('${U[who]}', '${key}') AS u`)).rows[0].u;

ok("S1 (level 10) has fox (needs level 9)", await unlocked("S1", "fox"));
ok("S1 does not have rocket (needs level 12)", !(await unlocked("S1", "rocket")));
ok("S2 (level 1) does not have comet before winning a duel", !(await unlocked("S2", "comet")));
await db.exec(`INSERT INTO public.duels (winner_id) VALUES ('${U.S2}')`);
ok("S2 has comet after winning a duel", await unlocked("S2", "comet"));
ok("S3 has century (100 passes, the 101st being unpassed doesn't matter)", await unlocked("S3", "century"));
ok("S1 does not have century: 150 replays of 3 challenges is only 3 challenges", !(await unlocked("S1", "century")));
let cnt = await as("S3", `SELECT public.my_passed_challenge_count() AS n`);
ok("my_passed_challenge_count counts distinct passed challenges for the caller", cnt.rows?.[0]?.n === 100, JSON.stringify(cnt));
cnt = await as("S1", `SELECT public.my_passed_challenge_count() AS n`);
ok("...and a farmer's replays collapse to 3", cnt.rows?.[0]?.n === 3, JSON.stringify(cnt));
ok("S3 has duellist_crest (5 duel wins)", await unlocked("S3", "duellist_crest"));
ok("S2 does not have duellist_crest (only 1 win)", !(await unlocked("S2", "duellist_crest")));
ok("S3 has streak_flame (14-day best streak)", await unlocked("S3", "streak_flame"));
ok("S1 does not have streak_flame (best streak 5)", !(await unlocked("S1", "streak_flame")));
ok("an unknown key is never unlocked", !(await unlocked("S1", "not-a-real-key")));

// ---- set_cosmetic
let r = await as("S1", `SELECT public.set_cosmetic('avatar', 'fox')`);
ok("a student can equip an avatar they've unlocked", !r.error, JSON.stringify(r));
ok(
  "...and it's saved",
  (await db.query(`SELECT selected_avatar FROM public.profiles WHERE id = '${U.S1}'`)).rows[0]
    .selected_avatar === "fox",
);

r = await as("S1", `SELECT public.set_cosmetic('avatar', 'rocket')`);
ok("a student cannot equip an avatar they haven't unlocked", !!r.error);
ok(
  "...and the rejected attempt didn't change anything",
  (await db.query(`SELECT selected_avatar FROM public.profiles WHERE id = '${U.S1}'`)).rows[0]
    .selected_avatar === "fox",
);

r = await as("S1", `SELECT public.set_cosmetic('hat', 'fox')`);
ok("an unknown cosmetic kind is rejected", !!r.error);

r = await as("S1", `SELECT public.set_cosmetic('avatar', NULL)`);
ok("null clears the slot back to the default", !r.error);
ok(
  "...and it actually cleared",
  (await db.query(`SELECT selected_avatar FROM public.profiles WHERE id = '${U.S1}'`)).rows[0]
    .selected_avatar === null,
);

r = await as("S1", `UPDATE public.profiles SET selected_avatar = 'crown' WHERE id = '${U.S1}'`);
ok(
  "writing the column directly (bypassing set_cosmetic) is refused at the grant level",
  !!r.error,
  JSON.stringify(r),
);

r = await as("S1", `SELECT public.set_cosmetic('banner', 'champion')`);
ok("a student cannot equip a banner they haven't unlocked (S1 is level 10, champion needs 25)", !!r.error);
r = await as("S3", `SELECT public.set_cosmetic('banner', 'ember')`);
ok("...but a student who has reached the level can", !r.error, JSON.stringify(r));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
