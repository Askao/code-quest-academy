/**
 * Fortnightly progress report emails - one to each student summarising
 * their own last 14 days, one to each teacher summarising every class they
 * teach or co-teach over the same window. Triggered by a POST to
 * REPORTS_HOOK_PATH (wired in src/server.ts), guarded by a shared secret
 * rather than GoTrue's webhook signing (nothing in GoTrue calls this - it's
 * meant to be hit by an external scheduler, see
 * .github/workflows/fortnightly-reports.yml) and sent via the same Resend
 * HTTP API the auth emails use (see auth-email-hook.server.ts) since
 * outbound SMTP is blocked from this Railway environment.
 */

import { timingSafeEqual } from "node:crypto";
import { ctaButton, escapeHtml, sendResendEmail, shellHtml } from "./email-shell";

export const REPORTS_HOOK_PATH = "/api/reports/send-fortnightly";

const WINDOW_DAYS = 14;

function jsonResponse(body: unknown, status: number): Response {
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

type StudentSummary = {
  userId: string;
  name: string;
  email: string;
  xpGained: number;
  challengesPassed: number;
  totalXp: number;
  streakDays: number;
};

function statRow(label: string, value: string): string {
  return `<tr>
    <td style="padding: 8px 0; color: #ccc;">${label}</td>
    <td style="padding: 8px 0; text-align: right; font-weight: 600;">${value}</td>
  </tr>`;
}

function studentEmailHtml(summary: StudentSummary, siteUrl: string): string {
  const active = summary.xpGained > 0 || summary.challengesPassed > 0;
  const message = active
    ? "Nice work over the last two weeks - here's how it went."
    : "You haven't practised in the last two weeks - here's a nudge to jump back in.";
  return shellHtml(`
    <h1 style="font-size: 22px; margin: 0 0 8px;">Your H-Code report</h1>
    <p style="color: #ccc; margin: 0 0 20px;">Hi ${escapeHtml(summary.name)}, ${message}</p>
    <table style="width: 100%; border-collapse: collapse; border-top: 1px solid #333; border-bottom: 1px solid #333;">
      ${statRow("XP gained (last 14 days)", String(summary.xpGained))}
      ${statRow("Challenges passed (last 14 days)", String(summary.challengesPassed))}
      ${statRow("Total XP", String(summary.totalXp))}
      ${statRow("Current streak", `${summary.streakDays} day${summary.streakDays === 1 ? "" : "s"}`)}
    </table>
    ${ctaButton(`${siteUrl}/dashboard`, "Go to your dashboard")}
  `);
}

function teacherEmailHtml(
  teacherName: string,
  classes: { name: string; students: StudentSummary[] }[],
  siteUrl: string,
): string {
  const classesHtml = classes
    .map((c) => {
      const rows = c.students
        .slice()
        .sort((a, b) => b.xpGained - a.xpGained)
        .map((s) => {
          const inactive = s.xpGained === 0 && s.challengesPassed === 0;
          return `<tr style="${inactive ? "color: #f1a3a3;" : ""}">
            <td style="padding: 6px 0;">${escapeHtml(s.name)}${inactive ? " (no activity)" : ""}</td>
            <td style="padding: 6px 0; text-align: right;">${s.xpGained} XP</td>
            <td style="padding: 6px 0; text-align: right;">${s.challengesPassed} passed</td>
            <td style="padding: 6px 0; text-align: right;">${s.streakDays}🔥</td>
          </tr>`;
        })
        .join("");
      return `<h2 style="font-size: 16px; margin: 24px 0 8px;">${escapeHtml(c.name)}</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; border-top: 1px solid #333;">
          ${rows || `<tr><td style="padding: 6px 0; color: #888;">No students in this class yet.</td></tr>`}
        </table>`;
    })
    .join("");
  return shellHtml(`
    <h1 style="font-size: 22px; margin: 0 0 8px;">Your classes - last 14 days</h1>
    <p style="color: #ccc; margin: 0 0 8px;">Hi ${escapeHtml(teacherName)}, here's how your students got on.</p>
    ${classesHtml}
    ${ctaButton(`${siteUrl}/teacher`, "Go to the Teacher area")}
  `);
}

export async function handleSendFortnightlyReports(request: Request): Promise<Response> {
  const secret = process.env["REPORTS_CRON_SECRET"];
  const siteUrl = (process.env["SITE_URL"] ?? "https://www.hcodeacademy.co.uk").replace(/\/$/, "");
  if (!secret) {
    console.error("[reports] Missing REPORTS_CRON_SECRET");
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }
  const provided = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!provided || !safeEqual(provided, secret)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [
    profilesRes,
    rolesRes,
    attemptsRes,
    statsRes,
    classesRes,
    coTeachersRes,
    membersRes,
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("id, full_name, email"),
    supabaseAdmin.from("user_roles").select("user_id, role"),
    supabaseAdmin
      .from("attempts")
      .select("user_id, passed, xp_awarded, challenge_id")
      .gte("created_at", since),
    supabaseAdmin.from("stats").select("user_id, xp, streak_days"),
    supabaseAdmin.from("classes").select("id, teacher_id, name"),
    supabaseAdmin.from("class_co_teachers").select("class_id, teacher_id"),
    supabaseAdmin.from("class_members").select("class_id, student_id"),
  ]);
  for (const [name, res] of Object.entries({
    profiles: profilesRes,
    user_roles: rolesRes,
    attempts: attemptsRes,
    stats: statsRes,
    classes: classesRes,
    class_co_teachers: coTeachersRes,
    class_members: membersRes,
  })) {
    if (res.error) throw new Error(`[reports] Failed to read ${name}: ${res.error.message}`);
  }
  const profiles = (profilesRes.data ?? []) as { id: string; full_name: string; email: string | null }[];
  const roles = (rolesRes.data ?? []) as { user_id: string; role: string }[];
  const attemptsInWindow = (attemptsRes.data ?? []) as {
    user_id: string;
    passed: boolean;
    xp_awarded: number;
    challenge_id: string;
  }[];
  const statsRows = (statsRes.data ?? []) as { user_id: string; xp: number; streak_days: number }[];
  const classes = (classesRes.data ?? []) as { id: string; teacher_id: string; name: string }[];
  const coTeachers = (coTeachersRes.data ?? []) as { class_id: string; teacher_id: string }[];
  const members = (membersRes.data ?? []) as { class_id: string; student_id: string }[];

  const studentIds = new Set(
    roles.filter((r) => r.role === "student").map((r) => r.user_id),
  );
  const teacherIds = new Set(
    roles.filter((r) => r.role === "teacher").map((r) => r.user_id),
  );

  const xpGainedByUser = new Map<string, number>();
  const passedChallengesByUser = new Map<string, Set<string>>();
  for (const a of attemptsInWindow) {
    xpGainedByUser.set(a.user_id, (xpGainedByUser.get(a.user_id) ?? 0) + (a.xp_awarded ?? 0));
    if (a.passed) {
      if (!passedChallengesByUser.has(a.user_id)) passedChallengesByUser.set(a.user_id, new Set());
      passedChallengesByUser.get(a.user_id)!.add(a.challenge_id);
    }
  }
  const statsByUser = new Map(statsRows.map((s) => [s.user_id, s]));
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  function summaryFor(userId: string): StudentSummary | null {
    const profile = profileById.get(userId);
    if (!profile?.email) return null;
    const stats = statsByUser.get(userId);
    return {
      userId,
      name: profile.full_name || "there",
      email: profile.email,
      xpGained: xpGainedByUser.get(userId) ?? 0,
      challengesPassed: passedChallengesByUser.get(userId)?.size ?? 0,
      totalXp: stats?.xp ?? 0,
      streakDays: stats?.streak_days ?? 0,
    };
  }

  let studentsSent = 0;
  let teachersSent = 0;
  let failures = 0;

  for (const userId of studentIds) {
    const summary = summaryFor(userId);
    if (!summary) continue;
    const ok = await sendResendEmail(
      summary.email,
      "Your H-Code report — last 14 days",
      studentEmailHtml(summary, siteUrl),
    );
    if (ok) studentsSent++;
    else failures++;
  }

  const classesByTeacher = new Map<string, { id: string; name: string }[]>();
  for (const c of classes) {
    if (!classesByTeacher.has(c.teacher_id)) classesByTeacher.set(c.teacher_id, []);
    classesByTeacher.get(c.teacher_id)!.push({ id: c.id, name: c.name });
  }
  for (const ct of coTeachers) {
    const cls = classes.find((c) => c.id === ct.class_id);
    if (!cls) continue;
    if (!classesByTeacher.has(ct.teacher_id)) classesByTeacher.set(ct.teacher_id, []);
    if (!classesByTeacher.get(ct.teacher_id)!.some((c) => c.id === cls.id)) {
      classesByTeacher.get(ct.teacher_id)!.push({ id: cls.id, name: cls.name });
    }
  }
  const membersByClass = new Map<string, string[]>();
  for (const m of members) {
    if (!membersByClass.has(m.class_id)) membersByClass.set(m.class_id, []);
    membersByClass.get(m.class_id)!.push(m.student_id);
  }

  for (const teacherId of teacherIds) {
    const teacherClasses = classesByTeacher.get(teacherId);
    const teacherProfile = profileById.get(teacherId);
    if (!teacherClasses?.length || !teacherProfile?.email) continue;
    const classSummaries = teacherClasses.map((c) => ({
      name: c.name,
      students: (membersByClass.get(c.id) ?? [])
        .map((studentId) => summaryFor(studentId))
        .filter((s): s is StudentSummary => s !== null),
    }));
    const ok = await sendResendEmail(
      teacherProfile.email,
      "Your classes — last 14 days",
      teacherEmailHtml(teacherProfile.full_name || "there", classSummaries, siteUrl),
    );
    if (ok) teachersSent++;
    else failures++;
  }

  return jsonResponse({ studentsSent, teachersSent, failures }, 200);
}
