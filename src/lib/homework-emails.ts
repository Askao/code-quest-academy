/**
 * Homework emails: one when homework is set, one when a student still has a
 * day or less left and hasn't finished. Everything that decides *whether* and
 * *what* to send lives here, with no database or network access, so it can be
 * tested; homework-emails.server.ts supplies the real store and sender.
 */
import { ctaButton, escapeHtml, shellHtml } from "./email-shell.ts";

export type EmailKind = "set" | "reminder";

const HOUR = 3_600_000;
/** A reminder goes out once a homework is due within this long. */
export const REMINDER_WITHIN_MS = 24 * HOUR;
/** No reminder for homework set less than this long ago - the "set" email is enough. */
export const REMINDER_MIN_AGE_MS = 12 * HOUR;
/** A "set" email that was held back (quiet hours) or failed is still sent for this long. */
export const CATCH_UP_MS = 48 * HOUR;

const QUIET_FROM_HOUR = 21;
const QUIET_TO_HOUR = 7;
const TIME_ZONE = "Europe/London";

/** The hour (0-23) it is in the UK, which is what students' evenings run on. */
export function ukHour(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  return Number(parts.find((p) => p.type === "hour")?.value ?? "12") % 24;
}

/** Nobody wants a homework email at midnight: nothing is sent 21:00-07:00 UK time. */
export function isQuietHours(now: Date): boolean {
  const h = ukHour(now);
  return h >= QUIET_FROM_HOUR || h < QUIET_TO_HOUR;
}

export function formatDue(dueAt: string): string {
  const d = new Date(dueAt);
  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
  return `${day} at ${time}`;
}

/** "about 5 hours" / "about 1 hour" / "less than an hour" - for the reminder's subject and opening line. */
export function timeLeft(dueAt: string, now: Date): string {
  const ms = new Date(dueAt).getTime() - now.getTime();
  const hours = Math.round(ms / HOUR);
  if (ms < HOUR / 2) return "less than an hour";
  if (hours <= 1) return "about 1 hour";
  return `about ${hours} hours`;
}

export type ReminderInput = {
  dueAt: string | null;
  createdAt: string;
  /** Tasks passed / tasks on this student's list. */
  done: number;
  total: number;
  /** False when the homework has no task list at all for this student yet. */
  hasTasks: boolean;
  now: Date;
};

/** Should this student get the "1 day left" reminder right now? */
export function shouldRemind(i: ReminderInput): boolean {
  if (!i.dueAt) return false;
  const left = new Date(i.dueAt).getTime() - i.now.getTime();
  if (left <= 0 || left > REMINDER_WITHIN_MS) return false;
  if (i.now.getTime() - new Date(i.createdAt).getTime() < REMINDER_MIN_AGE_MS) return false;
  if (!i.hasTasks) return false;
  return i.total === 0 || i.done < i.total;
}

export type EmailContent = { subject: string; html: string };

type EmailFields = {
  studentName: string;
  className: string;
  title: string;
  instructions: string;
  dueAt: string | null;
  homeworkId: string;
  siteUrl: string;
};

function firstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0];
  return first || "there";
}

function detailRows(rows: [string, string][]): string {
  return `<table style="width: 100%; border-collapse: collapse; border-top: 1px solid #333; border-bottom: 1px solid #333;">
    ${rows
      .map(
        ([label, value]) => `<tr>
      <td style="padding: 8px 0; color: #ccc;">${escapeHtml(label)}</td>
      <td style="padding: 8px 0; text-align: right; font-weight: 600;">${escapeHtml(value)}</td>
    </tr>`,
      )
      .join("")}
  </table>`;
}

const footer = `<p style="color: #888; font-size: 12px; margin: 32px 0 0;">You're getting this because your teacher set homework for your class on H-Code.</p>`;

export function setHomeworkEmail(f: EmailFields): EmailContent {
  const title = escapeHtml(f.title);
  const notes = f.instructions.trim()
    ? `<p style="color: #ccc; margin: 0 0 20px; white-space: pre-line;">${escapeHtml(f.instructions.trim())}</p>`
    : "";
  return {
    subject: `New homework: ${f.title}`,
    html: shellHtml(`
    <h1 style="font-size: 22px; margin: 0 0 8px;">New homework: ${title}</h1>
    <p style="color: #ccc; margin: 0 0 20px;">Hi ${escapeHtml(firstName(f.studentName))}, your teacher has set new homework for ${escapeHtml(f.className)}.</p>
    ${notes}
    ${detailRows([
      ["Class", f.className],
      ["Due", f.dueAt ? formatDue(f.dueAt) : "No deadline"],
    ])}
    ${ctaButton(`${f.siteUrl}/homework/${f.homeworkId}`, "Open the homework")}
    ${footer}
  `),
  };
}

export function reminderEmail(f: EmailFields & { done: number; total: number; now: Date }): EmailContent {
  const left = f.dueAt ? timeLeft(f.dueAt, f.now) : "not long";
  const remaining = f.total - f.done;
  const progress =
    f.total > 0
      ? `${f.done} of ${f.total} tasks done — ${remaining} still to do`
      : "You haven't started yet";
  return {
    subject: `Reminder: "${f.title}" is due in ${left}`,
    html: shellHtml(`
    <h1 style="font-size: 22px; margin: 0 0 8px;">Homework due soon</h1>
    <p style="color: #ccc; margin: 0 0 20px;">Hi ${escapeHtml(firstName(f.studentName))}, "${escapeHtml(f.title)}" is due in ${escapeHtml(left)} and isn't finished yet.</p>
    ${detailRows([
      ["Class", f.className],
      ["Due", f.dueAt ? formatDue(f.dueAt) : ""],
      ["Progress", progress],
    ])}
    ${ctaButton(`${f.siteUrl}/homework/${f.homeworkId}`, "Finish your homework")}
    ${footer}
  `),
  };
}

// ---------------------------------------------------------------------------
// The run itself, against a store and a sender that the server supplies.
// ---------------------------------------------------------------------------

export type HomeworkRow = {
  id: string;
  class_id: string;
  title: string;
  instructions: string;
  due_at: string | null;
  created_at: string;
};
export type Recipient = { studentId: string; name: string; email: string };

export interface EmailStore {
  homeworkDueBetween(from: Date, to: Date): Promise<HomeworkRow[]>;
  homeworkCreatedSince(since: Date): Promise<HomeworkRow[]>;
  homeworkById(id: string): Promise<HomeworkRow | null>;
  className(classId: string): Promise<string>;
  /** Students on the class roster who have an email address. */
  recipients(classId: string): Promise<Recipient[]>;
  /** Students who already have this kind of email for this homework. */
  alreadyEmailed(homeworkId: string, kind: EmailKind): Promise<Set<string>>;
  progress(hw: HomeworkRow, studentId: string): Promise<{ done: number; total: number; hasTasks: boolean }>;
  /** Records the send before it happens. False if another run got there first. */
  claim(homeworkId: string, studentId: string, kind: EmailKind): Promise<boolean>;
  /** Undoes a claim after a failed send, so the next run tries again. */
  release(homeworkId: string, studentId: string, kind: EmailKind): Promise<void>;
}

export type RunDeps = {
  store: EmailStore;
  send: (to: string, subject: string, html: string) => Promise<boolean>;
  now: Date;
  siteUrl: string;
  /** Called between sends to stay under the mail provider's rate limit. */
  pause?: () => Promise<void>;
  /** Most emails one run will send; the rest wait for the next run. */
  maxEmails?: number;
};

export type RunResult = { sent: number; failed: number; skipped: number; held?: "quiet-hours" };

const DEFAULT_MAX_EMAILS = 150;

async function sendToClass(
  hw: HomeworkRow,
  kind: EmailKind,
  deps: RunDeps,
  budget: { left: number },
  result: RunResult,
) {
  const { store, send, now, siteUrl, pause } = deps;
  const [className, recipients, done] = await Promise.all([
    store.className(hw.class_id),
    store.recipients(hw.class_id),
    store.alreadyEmailed(hw.id, kind),
  ]);
  for (const r of recipients) {
    if (done.has(r.studentId)) continue;
    if (budget.left <= 0) return;

    const base = {
      studentName: r.name,
      className,
      title: hw.title,
      instructions: hw.instructions,
      dueAt: hw.due_at,
      homeworkId: hw.id,
      siteUrl,
    };
    let content: EmailContent;
    if (kind === "reminder") {
      const p = await store.progress(hw, r.studentId);
      if (!shouldRemind({ dueAt: hw.due_at, createdAt: hw.created_at, now, ...p })) {
        result.skipped++;
        continue;
      }
      content = reminderEmail({ ...base, done: p.done, total: p.total, now });
    } else {
      content = setHomeworkEmail(base);
    }

    if (!(await store.claim(hw.id, r.studentId, kind))) {
      result.skipped++;
      continue;
    }
    budget.left--;
    let ok = false;
    try {
      ok = await send(r.email, content.subject, content.html);
    } catch (e) {
      console.error("[homework-emails] send threw", e);
    }
    if (ok) {
      result.sent++;
    } else {
      result.failed++;
      await store.release(hw.id, r.studentId, kind);
    }
    if (pause) await pause();
  }
}

/** "Homework set" emails for one homework - what the teacher's Set button triggers. */
export async function sendSetEmailsFor(hw: HomeworkRow, deps: RunDeps): Promise<RunResult> {
  const result: RunResult = { sent: 0, failed: 0, skipped: 0 };
  if (isQuietHours(deps.now)) return { ...result, held: "quiet-hours" };
  await sendToClass(hw, "set", deps, { left: deps.maxEmails ?? DEFAULT_MAX_EMAILS }, result);
  return result;
}

/**
 * The hourly run: reminders for homework due within a day, plus a catch-up for
 * "set" emails that were held back overnight or failed. Does nothing during
 * quiet hours - the next run after 07:00 picks it all up.
 */
export async function runHourly(deps: RunDeps): Promise<RunResult> {
  const result: RunResult = { sent: 0, failed: 0, skipped: 0 };
  if (isQuietHours(deps.now)) return { ...result, held: "quiet-hours" };
  const budget = { left: deps.maxEmails ?? DEFAULT_MAX_EMAILS };

  const recent = await deps.store.homeworkCreatedSince(new Date(deps.now.getTime() - CATCH_UP_MS));
  for (const hw of recent) {
    if (hw.due_at && new Date(hw.due_at) <= deps.now) continue;
    await sendToClass(hw, "set", deps, budget, result);
  }

  const soon = await deps.store.homeworkDueBetween(
    deps.now,
    new Date(deps.now.getTime() + REMINDER_WITHIN_MS),
  );
  for (const hw of soon) await sendToClass(hw, "reminder", deps, budget, result);
  return result;
}
