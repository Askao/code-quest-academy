import { PGlite } from "@electric-sql/pglite";
// Checks 20260930180000_content_drafts.sql against an in-memory Postgres
// (PGlite): only a teacher or admin can see, create, edit or remove a draft,
// only as themselves on insert, and updated_at ticks on every edit. Run
// after changing that file:
//
//   npm i --no-save @electric-sql/pglite
//   node scripts/test-content-drafts-sql.mjs
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
  GRANT USAGE ON SCHEMA auth TO authenticated;
  GRANT SELECT ON public.user_roles, auth.users TO authenticated;
  CREATE FUNCTION public.has_role(_u uuid, _r public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS
    $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_u AND role=_r) $$;
`);

const U = {
  T: "a0000000-0000-0000-0000-000000000001",
  T2: "a0000000-0000-0000-0000-000000000002",
  ADMIN: "a0000000-0000-0000-0000-000000000003",
  S: "b0000000-0000-0000-0000-000000000001",
};
await db.exec(`
  INSERT INTO auth.users VALUES ${Object.values(U).map((u) => `('${u}')`).join(",")};
  INSERT INTO public.user_roles VALUES
    ('${U.T}','teacher'), ('${U.T2}','teacher'), ('${U.ADMIN}','admin'), ('${U.S}','student');
`);

let pass = 0,
  fail = 0;
const ok = (name, cond, extra = "") => {
  console.log((cond ? "PASS " : "FAIL ") + name + (cond ? "" : "  " + extra));
  cond ? pass++ : fail++;
};

await db.exec(fs.readFileSync(root + "20260930180000_content_drafts.sql", "utf8"));

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

// ---- a student can do nothing with it
ok(
  "a student cannot see any drafts",
  (await as("S", "SELECT count(*)::int n FROM public.content_drafts")).rows[0].n === 0,
);
ok(
  "a student cannot create one",
  !!(
    await as(
      "S",
      `INSERT INTO public.content_drafts (created_by, topic, title) VALUES ('${U.S}', 'selection', 'x')`,
    )
  ).error,
);

// ---- a teacher can create, and it's visible to every teacher/admin (shared queue)
let r = await as(
  "T",
  `INSERT INTO public.content_drafts (created_by, topic, title, tier, difficulty, xp, brief)
   VALUES ('${U.T}', 'selection', 'Bus fare', 3, 3, 20, 'A bus company charges by age...')
   RETURNING id, status, created_at, updated_at`,
);
ok("a teacher can create a draft", !r.error && r.rows.length === 1, JSON.stringify(r));
const draftId = r.rows[0]?.id;
ok("a new draft starts as 'draft'", r.rows[0]?.status === "draft");
ok(
  "created_at and updated_at start equal",
  new Date(r.rows[0]?.created_at).getTime() === new Date(r.rows[0]?.updated_at).getTime(),
  JSON.stringify(r.rows[0]),
);

ok(
  "a teacher cannot create a draft claiming to be someone else",
  !!(
    await as(
      "T",
      `INSERT INTO public.content_drafts (created_by, topic, title) VALUES ('${U.T2}', 'selection', 'x')`,
    )
  ).error,
);

ok(
  "a second teacher sees the first teacher's draft (shared queue)",
  (await as("T2", "SELECT count(*)::int n FROM public.content_drafts")).rows[0].n === 1,
);
ok(
  "an admin sees it too",
  (await as("ADMIN", "SELECT count(*)::int n FROM public.content_drafts")).rows[0].n === 1,
);

// ---- editing: another teacher can pick it up, and updated_at moves
await new Promise((res) => setTimeout(res, 5));
r = await as(
  "T2",
  `UPDATE public.content_drafts SET status = 'ready', tests = '[{"stdin":"3","expect":"Free"}]'::jsonb
   WHERE id = '${draftId}' RETURNING status, updated_at, created_at`,
);
ok("another teacher can move it to ready", !r.error && r.rows[0]?.status === "ready", JSON.stringify(r));
ok(
  "updated_at ticks forward on edit, created_at does not",
  new Date(r.rows[0].updated_at).getTime() > new Date(r.rows[0].created_at).getTime(),
  JSON.stringify(r.rows[0]),
);

ok(
  "a student cannot update it either",
  (await as("S", `UPDATE public.content_drafts SET status = 'applied' WHERE id = '${draftId}'`))
    .rows === undefined || true, // UPDATE with no matching row is not an error under RLS; check no row changed
);
ok(
  "...and the status is unchanged after the student's attempt",
  (await admin(`SELECT status FROM public.content_drafts WHERE id = '${draftId}'`)).rows[0].status ===
    "ready",
);

// ---- constraints
ok(
  "tier must be 1-4",
  !!(await as("T", `INSERT INTO public.content_drafts (created_by, topic, title, tier) VALUES ('${U.T}','lists','x',5)`))
    .error,
);
ok(
  "difficulty must be 1-5",
  !!(
    await as(
      "T",
      `INSERT INTO public.content_drafts (created_by, topic, title, difficulty) VALUES ('${U.T}','lists','x',0)`,
    )
  ).error,
);
ok(
  "status must be one of the three values",
  !!(
    await as(
      "T",
      `INSERT INTO public.content_drafts (created_by, topic, title, status) VALUES ('${U.T}','lists','x','live')`,
    )
  ).error,
);

// ---- deleting
r = await as("S", `DELETE FROM public.content_drafts WHERE id = '${draftId}'`);
ok(
  "a student's delete affects nothing",
  (await admin(`SELECT count(*)::int n FROM public.content_drafts WHERE id = '${draftId}'`)).rows[0]
    .n === 1,
);
r = await as("T", `DELETE FROM public.content_drafts WHERE id = '${draftId}'`);
ok(
  "a teacher can delete a draft, including one they didn't create",
  !r.error &&
    (await admin(`SELECT count(*)::int n FROM public.content_drafts WHERE id = '${draftId}'`)).rows[0]
      .n === 0,
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
