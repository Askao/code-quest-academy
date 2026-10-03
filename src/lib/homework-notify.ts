import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/lib/assessments-db";
import { validateMessageBody } from "@/lib/message-text";

export type NotifyOutcome =
  | { kind: "sent"; sent: number }
  | { kind: "held" }
  | { kind: "failed" };

/** What the teacher should be told, in one line. Pure, so it can be tested. */
export function notifyMessage(o: NotifyOutcome): string | null {
  if (o.kind === "held") return "Students will be emailed at 7am.";
  if (o.kind === "failed") return "Couldn't email students just now - it will be retried within the hour.";
  return o.sent > 0 ? `Emailed ${o.sent} student${o.sent === 1 ? "" : "s"}.` : null;
}

async function postForOutcome(path: string, payload: Record<string, string>): Promise<NotifyOutcome> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { kind: "failed" };
    const res = await fetch(path, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { kind: "failed" };
    const body = (await res.json()) as { sent?: number; failed?: number; held?: string };
    if (body.held) return { kind: "held" };
    if ((body.failed ?? 0) > 0) return { kind: "failed" };
    return { kind: "sent", sent: body.sent ?? 0 };
  } catch {
    return { kind: "failed" };
  }
}

/**
 * Asks the server to email the class about a homework that was just set. The
 * server works out who to email from the database - only the homework's id is
 * sent - and the hourly job retries anything that fails here, so a problem is
 * a delay, not a lost email.
 */
export function notifyHomeworkSet(homeworkId: string): Promise<NotifyOutcome> {
  return postForOutcome("/api/homework/notify", { homeworkId });
}

/**
 * Saves a teacher's message about a homework (the database checks they teach
 * the class) and asks the server to email it. Only the message's id goes to
 * the server, which reads the text and works out the recipients itself.
 */
export async function sendHomeworkMessage(opts: {
  homeworkId: string;
  body: string;
  audience: "all" | "unfinished";
}): Promise<{ ok: true; outcome: NotifyOutcome } | { ok: false; error: string }> {
  const checked = validateMessageBody(opts.body);
  if (!checked.ok) return { ok: false, error: checked.reason };
  const { data } = await supabase.auth.getSession();
  const senderId = data.session?.user.id;
  if (!senderId) return { ok: false, error: "You need to be signed in." };
  const { data: row, error } = await sb
    .from("homework_messages")
    .insert({ homework_id: opts.homeworkId, sender_id: senderId, body: checked.body, audience: opts.audience })
    .select("id")
    .single();
  if (error || !row) return { ok: false, error: error?.message ?? "Couldn't save the message." };
  return { ok: true, outcome: await postForOutcome("/api/homework/message", { messageId: row.id as string }) };
}
