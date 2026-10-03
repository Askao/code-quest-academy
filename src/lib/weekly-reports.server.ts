/**
 * POST /api/reports/send-weekly - the weekly student and teacher emails.
 *
 * Called hourly on Sundays and Mondays by GitHub Actions (see
 * .github/workflows/weekly-reports.yml) with the shared cron secret. Which
 * emails are due is decided here from the UK clock (students from Sunday 17:00,
 * teachers from Monday 07:00, never after 21:00), so the hourly schedule only
 * has to be "often enough" and survives the clocks changing. Each email is
 * recorded in weekly_report_log before it goes, so an hourly retry never
 * emails anyone twice, and a failed send is removed so the next run tries again.
 *
 * Query parameters (for manual runs): kind=students|teachers (ignore the
 * clock), dryRun=1 (work everything out, send and record nothing).
 *
 * What goes in each email, and why, is in weekly-reports.ts. The numbers come
 * from the report_* database functions, each returning one jsonb value so the
 * 1,000-row response limit can never cut a busy week short.
 */
import { timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendResendEmail } from "./email-shell";
import {
  buildStudentEmail,
  buildTeacherEmail,
  outstandingHomework,
  reportDue,
  studentReportWanted,
  studentWindow,
  teacherWindow,
  type HomeworkStatus,
  type MarkingRow,
  type ReportKind,
  type ResultRow,
  type StudentWeek,
  type TeacherClass,
} from "./weekly-reports";

export const WEEKLY_REPORTS_PATH = "/api/reports/send-weekly";

// Resend allows a couple of requests a second; this keeps a full run under it.
const SEND_GAP_MS = 600;
const MAX_EMAILS_PER_RUN = 150;
const PAGE = 1000;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  return aBuf.length === bBuf.length && timingSafeEqual(aBuf, bBuf);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any, "public", any>;

/** Reads a whole table a page at a time, since a single read stops at 1,000 rows without saying so. */
async function fetchAll<T>(db: Db, table: string, columns: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from(table).select(columns).range(from, from + PAGE - 1);
    if (error) throw new Error(`[weekly-reports] read ${table}: ${error.message}`);
    out.push(...((data ?? []) as T[]));
    if ((data ?? []).length < PAGE) return out;
  }
}

async function rpcJson<T>(db: Db, fn: string, args: Record<string, unknown>): Promise<T[]> {
  const { data, error } = await db.rpc(fn, args);
  if (error) throw new Error(`[weekly-reports] ${fn}: ${error.message}`);
  return (data ?? []) as T[];
}

export async function handleSendWeeklyReports(request: Request): Promise<Response> {
  const secret = process.env["REPORTS_CRON_SECRET"];
  const siteUrl = (process.env["SITE_URL"] ?? "https://www.hcodeacademy.co.uk").replace(/\/$/, "");
  if (!secret) {
    console.error("[weekly-reports] Missing REPORTS_CRON_SECRET");
    return json({ error: "Server misconfigured" }, 500);
  }
  const provided = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!provided || !safeEqual(provided, secret)) return json({ error: "Unauthorized" }, 401);

  const params = new URL(request.url).searchParams;
  const dryRun = params.get("dryRun") === "1";
  const now = new Date();
  const asked = params.get("kind");
  const kind: ReportKind | null =
    asked === "students" ? "student" : asked === "teachers" ? "teacher" : reportDue(now);
  if (!kind) return json({ skipped: "not a report time" }, 200);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as unknown as Db;
  const window = kind === "student" ? studentWindow(now) : teacherWindow(now);

  const [weekRows, homework, results, marking, profiles, roles, classes, coTeachers, members, alreadySent] =
    await Promise.all([
      rpcJson<StudentWeek>(db, "report_student_week", {
        _from: window.from.toISOString(),
        _to: window.to.toISOString(),
        _prev_from: window.prevFrom.toISOString(),
      }),
      rpcJson<HomeworkStatus>(db, "report_homework_status", { _now: now.toISOString() }),
      kind === "student"
        ? rpcJson<ResultRow>(db, "report_results", { _from: window.from.toISOString(), _to: window.to.toISOString() })
        : Promise.resolve([] as ResultRow[]),
      kind === "teacher" ? rpcJson<MarkingRow>(db, "report_marking_queue", {}) : Promise.resolve([] as MarkingRow[]),
      fetchAll<{ id: string; full_name: string | null; email: string | null; weekly_reports: boolean | null }>(
        db,
        "profiles",
        "id, full_name, email, weekly_reports",
      ),
      fetchAll<{ user_id: string; role: string }>(db, "user_roles", "user_id, role"),
      fetchAll<{ id: string; teacher_id: string; name: string }>(db, "classes", "id, teacher_id, name"),
      fetchAll<{ class_id: string; teacher_id: string }>(db, "class_co_teachers", "class_id, teacher_id"),
      fetchAll<{ class_id: string; student_id: string }>(db, "class_members", "class_id, student_id"),
      fetchAll<{ user_id: string; week_start: string; kind: string }>(db, "weekly_report_log", "user_id, week_start, kind"),
    ]);

  const sentAlready = new Set(
    alreadySent.filter((r) => r.week_start === window.weekStart && r.kind === kind).map((r) => r.user_id),
  );
  const weeks = new Map(weekRows.map((w) => [w.student_id, w]));
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const rolesByUser = new Map<string, Set<string>>();
  for (const r of roles) {
    if (!rolesByUser.has(r.user_id)) rolesByUser.set(r.user_id, new Set());
    rolesByUser.get(r.user_id)!.add(r.role);
  }
  const isStaff = (id: string) => {
    const r = rolesByUser.get(id);
    return !!r && (r.has("teacher") || r.has("admin"));
  };
  const homeworkByStudent = new Map<string, HomeworkStatus[]>();
  for (const h of homework) {
    if (!homeworkByStudent.has(h.student_id)) homeworkByStudent.set(h.student_id, []);
    homeworkByStudent.get(h.student_id)!.push(h);
  }

  const counts = { eligible: 0, sent: 0, failed: 0, alreadySent: 0, skippedNothingToSay: 0, optedOut: 0, heldForNextRun: 0 };
  const samples: string[] = [];
  let budget = MAX_EMAILS_PER_RUN;

  async function deliver(userId: string, to: string, subject: string, html: string) {
    if (sentAlready.has(userId)) {
      counts.alreadySent++;
      return;
    }
    counts.eligible++;
    if (dryRun) {
      if (samples.length < 5) samples.push(subject);
      return;
    }
    if (budget <= 0) {
      counts.heldForNextRun++;
      return;
    }
    const { error } = await db
      .from("weekly_report_log")
      .insert({ user_id: userId, week_start: window.weekStart, kind });
    if (error) {
      if (error.code === "23505") {
        counts.alreadySent++; // another run got there first
        return;
      }
      throw new Error(`[weekly-reports] record send: ${error.message}`);
    }
    budget--;
    let ok = false;
    try {
      ok = await sendResendEmail(to, subject, html);
    } catch (e) {
      console.error("[weekly-reports] send threw", e);
    }
    if (ok) {
      counts.sent++;
    } else {
      counts.failed++;
      await db.from("weekly_report_log").delete().eq("user_id", userId).eq("week_start", window.weekStart).eq("kind", kind);
    }
    await new Promise((resolve) => setTimeout(resolve, SEND_GAP_MS));
  }

  if (kind === "student") {
    const resultsByStudent = new Map<string, ResultRow[]>();
    for (const r of results) {
      if (!resultsByStudent.has(r.student_id)) resultsByStudent.set(r.student_id, []);
      resultsByStudent.get(r.student_id)!.push(r);
    }
    for (const [studentId, week] of weeks) {
      const profile = profileById.get(studentId);
      if (isStaff(studentId) || !profile?.email) continue;
      if (profile.weekly_reports === false) {
        counts.optedOut++;
        continue;
      }
      const mine = homeworkByStudent.get(studentId) ?? [];
      if (!studentReportWanted(week, outstandingHomework(mine, now))) {
        counts.skippedNothingToSay++;
        continue;
      }
      const email = buildStudentEmail({
        name: profile.full_name ?? "",
        week,
        homework: mine,
        results: resultsByStudent.get(studentId) ?? [],
        window,
        now,
        siteUrl,
      });
      await deliver(studentId, profile.email, email.subject, email.html);
    }
  } else {
    const studentsOf = (classId: string) =>
      members.filter((m) => m.class_id === classId && !isStaff(m.student_id)).map((m) => m.student_id);
    const classesByTeacher = new Map<string, TeacherClass[]>();
    const add = (teacherId: string, c: { id: string; name: string }) => {
      const list = classesByTeacher.get(teacherId) ?? [];
      if (!list.some((x) => x.id === c.id)) list.push({ id: c.id, name: c.name, studentIds: studentsOf(c.id) });
      classesByTeacher.set(teacherId, list);
    };
    for (const c of classes) add(c.teacher_id, c);
    for (const ct of coTeachers) {
      const c = classes.find((x) => x.id === ct.class_id);
      if (c) add(ct.teacher_id, c);
    }
    const names = new Map(profiles.map((p) => [p.id, p.full_name ?? ""]));
    for (const [teacherId, teacherClasses] of classesByTeacher) {
      const profile = profileById.get(teacherId);
      if (!isStaff(teacherId) || !profile?.email) continue;
      if (profile.weekly_reports === false) {
        counts.optedOut++;
        continue;
      }
      const email = buildTeacherEmail({
        teacherName: profile.full_name ?? "",
        classes: teacherClasses,
        weeks,
        homework,
        marking,
        names,
        window,
        now,
        siteUrl,
      });
      if (!email) {
        counts.skippedNothingToSay++;
        continue;
      }
      await deliver(teacherId, profile.email, email.subject, email.html);
    }
  }

  return json(
    { kind, dryRun, weekStart: window.weekStart, from: window.from.toISOString(), to: window.to.toISOString(), ...counts, ...(dryRun ? { sampleSubjects: samples } : {}) },
    200,
  );
}
