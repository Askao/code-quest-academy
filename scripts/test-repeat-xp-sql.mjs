import { PGlite } from "@electric-sql/pglite";
// Checks 20261002110000_no_xp_for_repeat_passes.sql: a student only earns XP
// the first time they pass a challenge, however the attempt is inserted. Run
// after changing that file:
//
//   npm i --no-save @electric-sql/pglite
//   node scripts/test-repeat-xp-sql.mjs
//
// (Not part of `npm test` because it needs that extra package.)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root =
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../supabase/migrations") + "/";
const db = new PGlite();

await db.exec(`
  CREATE TABLE public.attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    challenge_id uuid NOT NULL,
    passed boolean NOT NULL DEFAULT false,
    xp_awarded int NOT NULL DEFAULT 0,
    mode text);
`);
await db.exec(fs.readFileSync(root + "20261002110000_no_xp_for_repeat_passes.sql", "utf8"));

const A = "a0000000-0000-0000-0000-000000000001";
const B = "a0000000-0000-0000-0000-000000000002";
const C1 = "c0000000-0000-0000-0000-000000000001";
const C2 = "c0000000-0000-0000-0000-000000000002";
let pass = 0,
  fail = 0;
const ok = (name, cond, extra = "") => {
  console.log((cond ? "PASS " : "FAIL ") + name + (cond ? "" : "  " + extra));
  cond ? pass++ : fail++;
};
const add = async (u, c, passed, xp, mode = "practice") =>
  (
    await db.query(
      `INSERT INTO public.attempts (user_id, challenge_id, passed, xp_awarded, mode) VALUES ($1,$2,$3,$4,$5) RETURNING xp_awarded`,
      [u, c, passed, xp, mode],
    )
  ).rows[0].xp_awarded;

ok("a first pass keeps its XP", (await add(A, C1, true, 30)) === 30);
ok("a second pass of the same challenge earns nothing", (await add(A, C1, true, 30)) === 0);
ok("...however many times it is repeated", (await add(A, C1, true, 45, "duel")) === 0);
ok("a failed attempt is untouched (it never had XP)", (await add(A, C1, false, 0)) === 0);
ok("a different challenge still earns XP", (await add(A, C2, true, 20)) === 20);
ok("another student's first pass of the same challenge still earns XP", (await add(B, C1, true, 30)) === 30);

ok("failing first and passing later still earns XP once", await (async () => {
  const D = "a0000000-0000-0000-0000-000000000003";
  await add(D, C1, false, 0);
  const first = await add(D, C1, true, 30);
  const again = await add(D, C1, true, 30);
  return first === 30 && again === 0;
})());

const total = (await db.query(`SELECT sum(xp_awarded)::int AS t FROM public.attempts WHERE user_id = '${A}'`)).rows[0].t;
ok("student A's stored XP only counts each challenge once (30 + 20)", total === 50, String(total));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
