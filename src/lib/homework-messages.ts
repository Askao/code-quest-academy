/**
 * Teacher messages about a homework: what the email looks like, who gets it,
 * and the send loop. Like homework-emails.ts this has no database or network
 * access of its own - homework-messages.server.ts supplies the real store and
 * sender - so all of it can be tested.
 */
import { ctaButton, escapeHtml, shellHtml } from "./email-shell.ts";
import {
  detailRows,
  firstName,
  formatDue,
  isQuietHours,
  type EmailContent,
  type EmailStore,
  type HomeworkRow,
  type RunDeps,
  type RunResult,
} from "./homework-emails.ts";

export { MESSAGE_MAX_LENGTH, validateMessageBody } from "./message-text.ts";

export type Audience = "all" | "unfinished";
/** A held or half-failed message is still retried for this long. */
export const MESSAGE_CATCH_UP_MS = 48 * 3_600_000;
const DEFAULT_MAX_EMAILS = 150;

export type MessageRow = {
  id: string;
  homework_id: string;
  body: string;
  audience: Audience;
  created_at: string;
  processed_at: string | null;
};

export type Progress = { done: number; total: number; hasTasks: boolean };

/** Someone who still has something to do on this homework (or has not been given a list yet). */
export function isUnfinished(p: Progress): boolean {
  return !p.hasTasks || p.total === 0 || p.done < p.total;
}

type MessageFields = {
  studentName: string;
  className: string;
  title: string;
  body: string;
  dueAt: string | null;
  homeworkId: string;
  siteUrl: string;
  progress: Progress;
};

const footer = `<p style="color: #888; font-size: 12px; margin: 32px 0 0;">Your teacher sent this through H-Code. You can't reply to this email - if you need help, speak to your teacher in class.</p>`;

export function teacherMessageEmail(f: MessageFields): EmailContent {
  const rows: [string, string][] = [
    ["Class", f.className],
    ["Due", f.dueAt ? formatDue(f.dueAt) : "No deadline"],
  ];
  if (f.progress.hasTasks && f.progress.total > 0) {
    rows.push(["Your progress", `${f.progress.done} of ${f.progress.total} tasks done`]);
  }
  return {
    subject: `Message from your teacher about "${f.title}"`,
    html: shellHtml(`
    <h1 style="font-size: 22px; margin: 0 0 8px;">A message about your homework</h1>
    <p style="color: #ccc; margin: 0 0 16px;">Hi ${escapeHtml(firstName(f.studentName))}, your teacher sent this to ${escapeHtml(f.className)} about ${escapeHtml(f.title)}.</p>
    <div style="border: 1px solid #2b2b31; background: #17171b; border-radius: 8px; padding: 14px 16px; margin: 0 0 20px; white-space: pre-line; color: #eee;">${escapeHtml(f.body.trim())}</div>
    ${detailRows(rows)}
    ${ctaButton(`${f.siteUrl}/homework/${f.homeworkId}`, "Open the homework")}
    ${footer}
  `),
  };
}

export interface MessageStore extends EmailStore {
  messageById(id: string): Promise<MessageRow | null>;
  /** Messages with processed_at unset, created since the given time. */
  messagesPending(since: Date): Promise<MessageRow[]>;
  /** Records the send before it happens. False if another run got there first. */
  claimMessageEmail(messageId: string, studentId: string): Promise<boolean>;
  releaseMessageEmail(messageId: string, studentId: string): Promise<void>;
  markMessageProcessed(messageId: string): Promise<void>;
}

export type MessageDeps = Omit<RunDeps, "store"> & { store: MessageStore };

async function deliver(msg: MessageRow, deps: MessageDeps, budget: { left: number }, result: RunResult) {
  const { store, send, siteUrl, pause } = deps;
  const hw: HomeworkRow | null = await store.homeworkById(msg.homework_id);
  if (!hw) {
    // The homework was deleted, so there is nobody to tell.
    await store.markMessageProcessed(msg.id);
    return;
  }
  const [className, recipients] = await Promise.all([store.className(hw.class_id), store.recipients(hw.class_id)]);
  let complete = true;

  for (const r of recipients) {
    if (budget.left <= 0) {
      complete = false;
      break;
    }
    const progress = await store.progress(hw, r.studentId);
    if (msg.audience === "unfinished" && !isUnfinished(progress)) {
      result.skipped++;
      continue;
    }
    if (!(await store.claimMessageEmail(msg.id, r.studentId))) {
      result.skipped++;
      continue;
    }
    budget.left--;
    const content = teacherMessageEmail({
      studentName: r.name,
      className,
      title: hw.title,
      body: msg.body,
      dueAt: hw.due_at,
      homeworkId: hw.id,
      siteUrl,
      progress,
    });
    let ok = false;
    try {
      ok = await send(r.email, content.subject, content.html);
    } catch (e) {
      console.error("[homework-messages] send threw", e);
    }
    if (ok) {
      result.sent++;
    } else {
      result.failed++;
      complete = false;
      await store.releaseMessageEmail(msg.id, r.studentId);
    }
    if (pause) await pause();
  }

  if (complete) await store.markMessageProcessed(msg.id);
}

/** What the teacher's Send button triggers. Nothing goes out between 21:00 and 07:00 UK time. */
export async function sendMessageEmailsFor(msg: MessageRow, deps: MessageDeps): Promise<RunResult> {
  const result: RunResult = { sent: 0, failed: 0, skipped: 0 };
  if (isQuietHours(deps.now)) return { ...result, held: "quiet-hours" };
  await deliver(msg, deps, { left: deps.maxEmails ?? DEFAULT_MAX_EMAILS }, result);
  return result;
}

/** The hourly catch-up for messages that were held back overnight or only partly sent. */
export async function runPendingMessages(deps: MessageDeps): Promise<RunResult> {
  const result: RunResult = { sent: 0, failed: 0, skipped: 0 };
  if (isQuietHours(deps.now)) return { ...result, held: "quiet-hours" };
  const budget = { left: deps.maxEmails ?? DEFAULT_MAX_EMAILS };
  const pending = await deps.store.messagesPending(new Date(deps.now.getTime() - MESSAGE_CATCH_UP_MS));
  for (const msg of pending) {
    if (budget.left <= 0) break;
    await deliver(msg, deps, budget, result);
  }
  return result;
}
