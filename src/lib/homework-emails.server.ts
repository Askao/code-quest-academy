/**
 * The two endpoints behind the homework emails (what to send, and when, is in
 * homework-emails.ts):
 *
 *  - POST /api/homework/notify    - called from the teacher's browser right after
 *    they set homework, with their sign-in token. Emails that class's students.
 *  - POST /api/homework/reminders - called hourly by GitHub Actions (see
 *    .github/workflows/homework-emails.yml) with the shared cron secret. Sends
 *    the "1 day left" reminders, and any "set" emails that were held back
 *    overnight or failed.
 *
 * Everything is worked out here from the database, never from what the caller
 * sends - the notify call only names a homework - and each email is recorded in
 * homework_emails before it goes, so a repeat call can't send it twice.
 */
import { timingSafeEqual } from "node:crypto";
import { sendResendEmail } from "./email-shell";
import {
  runHourly,
  sendSetEmailsFor,
  type EmailKind,
  type EmailStore,
  type HomeworkRow,
  type RunDeps,
} from "./homework-emails";

export const HOMEWORK_NOTIFY_PATH = "/api/homework/notify";
export const HOMEWORK_REMINDERS_PATH = "/api/homework/reminders";

// Resend allows a couple of requests a second; this keeps a full class under it.
const SEND_GAP_MS = 600;
const HOMEWORK_COLUMNS = "id, class_id, title, instructions, due_at, created_at, challenge_ids";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  return aBuf.length === bBuf.length && timingSafeEqual(aBuf, bBuf);
}

const bearer = (request: Request) =>
  (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");

type HomeworkWithTasks = HomeworkRow & { challenge_ids: string[] | null };

async function realStore(): Promise<EmailStore> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const fail = (what: string, message: string): never => {
    throw new Error(`[homework-emails] ${what}: ${message}`);
  };

  return {
    async homeworkDueBetween(from, to) {
      const { data, error } = await supabaseAdmin
        .from("homework")
        .select(HOMEWORK_COLUMNS)
        .gt("due_at", from.toISOString())
        .lte("due_at", to.toISOString());
      if (error) fail("read homework due soon", error.message);
      return (data ?? []) as HomeworkWithTasks[];
    },
    async homeworkCreatedSince(since) {
      const { data, error } = await supabaseAdmin
        .from("homework")
        .select(HOMEWORK_COLUMNS)
        .gte("created_at", since.toISOString());
      if (error) fail("read recent homework", error.message);
      return (data ?? []) as HomeworkWithTasks[];
    },
    async homeworkById(id) {
      const { data, error } = await supabaseAdmin
        .from("homework")
        .select(HOMEWORK_COLUMNS)
        .eq("id", id)
        .maybeSingle();
      if (error) fail("read homework", error.message);
      return (data as HomeworkWithTasks | null) ?? null;
    },
    async className(classId) {
      const { data } = await supabaseAdmin.from("classes").select("name").eq("id", classId).maybeSingle();
      return data?.name ?? "your class";
    },
    async recipients(classId) {
      const { data: members, error } = await supabaseAdmin
        .from("class_members")
        .select("student_id")
        .eq("class_id", classId);
      if (error) fail("read class members", error.message);
      const ids = (members ?? []).map((m) => m.student_id);
      if (ids.length === 0) return [];
      const { data: profiles, error: pErr } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      if (pErr) fail("read profiles", pErr.message);
      return (profiles ?? [])
        .filter((p) => !!p.email)
        .map((p) => ({ studentId: p.id, name: p.full_name ?? "", email: p.email as string }));
    },
    async alreadyEmailed(homeworkId, kind) {
      const { data, error } = await supabaseAdmin
        .from("homework_emails")
        .select("student_id")
        .eq("homework_id", homeworkId)
        .eq("kind", kind);
      if (error) fail("read homework_emails", error.message);
      return new Set((data ?? []).map((r) => r.student_id));
    },
    async progress(hw, studentId) {
      // The student's own list if they have one, else the homework's shared one
      // (the same fallback the dashboard uses).
      const { data: own } = await supabaseAdmin
        .from("homework_assignments")
        .select("challenge_ids")
        .eq("homework_id", hw.id)
        .eq("student_id", studentId)
        .maybeSingle();
      const ids = (own?.challenge_ids as string[] | undefined) ?? (hw as HomeworkWithTasks).challenge_ids ?? [];
      if (ids.length === 0) return { done: 0, total: 0, hasTasks: !!own };
      const { data: passed, error } = await supabaseAdmin
        .from("attempts")
        .select("challenge_id")
        .eq("user_id", studentId)
        .eq("passed", true)
        .in("challenge_id", ids);
      if (error) fail("read attempts", error.message);
      const done = new Set((passed ?? []).map((a) => a.challenge_id));
      return { done: ids.filter((id) => done.has(id)).length, total: ids.length, hasTasks: true };
    },
    async claim(homeworkId, studentId, kind: EmailKind) {
      const { error } = await supabaseAdmin
        .from("homework_emails")
        .insert({ homework_id: homeworkId, student_id: studentId, kind });
      if (!error) return true;
      if (error.code === "23505") return false; // someone else already sent it
      fail("record email", error.message);
      return false;
    },
    async release(homeworkId, studentId, kind: EmailKind) {
      await supabaseAdmin
        .from("homework_emails")
        .delete()
        .eq("homework_id", homeworkId)
        .eq("student_id", studentId)
        .eq("kind", kind);
    },
  };
}

async function deps(): Promise<RunDeps> {
  return {
    store: await realStore(),
    send: sendResendEmail,
    now: new Date(),
    siteUrl: (process.env["SITE_URL"] ?? "https://www.hcodeacademy.co.uk").replace(/\/$/, ""),
    pause: () => new Promise((resolve) => setTimeout(resolve, SEND_GAP_MS)),
  };
}

export async function handleHomeworkReminders(request: Request): Promise<Response> {
  const secret = process.env["REPORTS_CRON_SECRET"];
  if (!secret) {
    console.error("[homework-emails] Missing REPORTS_CRON_SECRET");
    return json({ error: "Server misconfigured" }, 500);
  }
  const provided = bearer(request);
  if (!provided || !safeEqual(provided, secret)) return json({ error: "Unauthorized" }, 401);

  return json(await runHourly(await deps()), 200);
}

export async function handleHomeworkNotify(request: Request): Promise<Response> {
  const token = bearer(request);
  if (!token) return json({ error: "Unauthorized" }, 401);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: auth, error: authError } = await supabaseAdmin.auth.getUser(token);
  const userId = auth?.user?.id;
  if (authError || !userId) return json({ error: "Unauthorized" }, 401);

  let homeworkId: unknown;
  try {
    homeworkId = ((await request.json()) as { homeworkId?: unknown }).homeworkId;
  } catch {
    return json({ error: "Bad request" }, 400);
  }
  if (typeof homeworkId !== "string" || !/^[0-9a-f-]{36}$/i.test(homeworkId)) {
    return json({ error: "Bad request" }, 400);
  }

  const d = await deps();
  const hw = await d.store.homeworkById(homeworkId);
  if (!hw) return json({ error: "Not found" }, 404);

  // Only someone who teaches the class (or an admin) can trigger it.
  const [teaches, admin] = await Promise.all([
    supabaseAdmin.rpc("is_class_teacher", { _class_id: hw.class_id, _user_id: userId }),
    supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" }),
  ]);
  if (teaches.data !== true && admin.data !== true) return json({ error: "Forbidden" }, 403);

  return json(await sendSetEmailsFor(hw, d), 200);
}
